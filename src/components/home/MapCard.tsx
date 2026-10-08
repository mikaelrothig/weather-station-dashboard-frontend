import { CSSProperties, useEffect, useId, useRef, useState } from "react";
import { getGraphStrokeColor, getWindBackgroundColor, WIND_SCALE } from "../../utils/ColorUtils";
import { getDegreesToCompass } from "../../utils/DataUtils";
import { getSpotSlug } from "../../utils/spotUtils";
import { DirectionArrow } from "../ui/DirectionArrow";
import { WindChip } from "../ui/WindChip";
import { WindStreaks } from "./WindStreaks";
import terrain from "./terrain.jpg";
import { averageWind, OUTLINE, projectSpot, SpotEntry, SpotHover, SpotStatus } from "./spotStatus";

// Where each name sits next to its dot, out over the sea where there's room. Blouberg's goes inland over the flat
// Cape Flats instead: out to sea it would cover Robben Island, and below it Table Mountain. Langebaan's goes inland
// too, clear of the lagoon. A spot missing here gets a label to its left.
const LABELS: Record<string, { side: "left" | "right" | "below"; dy?: number }> = {
    langebaan: { side: "right" },
    melkbos: { side: "left" },
    blouberg: { side: "right" },
    hermanus: { side: "below" },
    witsand: { side: "below" },
};

const ASPECT = `${OUTLINE.width} / ${OUTLINE.height}`;

// The two oceans, quieter than the spots, so the coastline reads as somewhere. Hidden on phones, where they'd crowd it.
const OCEANS: { name: string; coordinates: [number, number] }[] = [
    { name: "Atlantic Ocean", coordinates: [17.6, -34.6] },
    { name: "Indian Ocean", coordinates: [21.0, -34.75] },
];

// Mercator keeps longitude even across the map, so a distance is a fixed share of its width at the spots' latitude
const [WEST, , EAST] = OUTLINE.bbox;
const SCALE_KM = 50;
const SCALE_WIDTH = SCALE_KM / ((EAST - WEST) * 111.32 * Math.cos((33.75 * Math.PI) / 180));

// Solid in the middle, gone in the corners; the middle of each edge keeps about three quarters of its strength
const EDGE_FADE = "radial-gradient(ellipse farthest-corner at center, black 60%, transparent 100%)";

// Dark outline around the ocean names, so they stay legible over the streaks
const HALO = "[text-shadow:0_0_2px_#09090b,0_0_4px_#09090b,0_0_8px_#09090b]";

interface MapCardProps extends SpotHover {
    entries: SpotEntry[];
    /** Tagged on phones when nothing is being pointed at */
    featured: SpotStatus | null;
    className?: string;
}

/**
 * The Western Cape with live wind drifting across it and every spot plotted in its wind colour. From sm every spot
 * is named on the map, with the oceans and a scale for bearings; phones get a single tag for the spot you
 * touched, or today's pick.
 */
export const MapCard = ({ entries, featured, hovered, onHover, className = "" }: MapCardProps) => {
    const statuses = entries.flatMap((e) => (e.status ? [e.status] : []));
    const wind = averageWind(statuses);
    // useId can contain characters that break an SVG url(#…) reference, so keep it to safe ones
    const landClip = `land-${useId().replace(/[^\w-]/g, "")}`;
    const tagged = statuses.find((s) => s.spot.url === hovered) ?? featured;

    // Streaks only animate while the map is on screen
    const artRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const el = artRef.current;
        if (!el || !("IntersectionObserver" in window)) return;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section aria-labelledby="map-title" className={`card animate-enter flex flex-col p-4 md:p-5 ${className}`} style={{ "--i": 1 } as CSSProperties}>
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 id="map-title" className="text-sm font-semibold text-zinc-100">Wind now</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">Forecast for this hour at every spot</p>
                </div>
                {statuses.length > 0 && (
                    <div className="shrink-0 text-right">
                        <p className="flex items-center justify-end gap-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-50">
                            <DirectionArrow degrees={wind.direction} className="size-4 fill-zinc-300 stroke-none" />
                            {Math.round(wind.speed)}
                            <span className="text-sm font-medium text-zinc-500">kn</span>
                        </p>
                        <p className="text-xs text-zinc-400">
                            from the <span className="font-medium text-zinc-200">{getDegreesToCompass(wind.direction)}</span> on average
                        </p>
                    </div>
                )}
            </header>

            <div
                ref={artRef}
                // Never shorter than the artwork, and grows to fill the card when the column beside it is taller.
                // The artwork stays centred at its own ratio, so the extra room shows more land north and sea south.
                className="relative mt-3 min-h-0 flex-[1_0_auto] overflow-hidden rounded-xl bg-canvas ring-1 ring-inset ring-white/[0.04]"
                style={{ aspectRatio: ASPECT }}
            >
                {/* The artwork fades out toward the frame, so the map trails off rather than ending at a hard edge */}
                <div className="absolute inset-0" style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}>
                    {/* The sea: a faint dot grid that the land covers, so the water has texture and the coast an edge */}
                    <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1.5px)] bg-[length:14px_14px]" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ aspectRatio: ASPECT }}>
                        {/* overflow-visible: the outline runs past its frame inland, so a taller card shows more land, not a cut edge */}
                        <svg viewBox={`0 0 ${OUTLINE.width} ${OUTLINE.height}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                            <defs>
                                <clipPath id={landClip}><path d={OUTLINE.land} /></clipPath>
                            </defs>
                            <path d={OUTLINE.land} fill="#1c1c20" />
                            {/* Shaded relief, lit from the north-west: mid grey leaves the land as it is, lighter and darker light and
                                shade the slopes (hard-light). Kept to the coastline, and drawn up past the frame like the land is */}
                            <image
                                href={terrain}
                                x={0}
                                y={-OUTLINE.height * OUTLINE.terrainAbove}
                                width={OUTLINE.width}
                                height={OUTLINE.height * (1 + OUTLINE.terrainAbove)}
                                preserveAspectRatio="none"
                                clipPath={`url(#${landClip})`}
                                opacity={0.55}
                                style={{ mixBlendMode: "hard-light" }}
                            />
                            <path d={OUTLINE.land} fill="none" stroke="rgb(255 255 255 / 0.09)" strokeWidth={1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            <path d={OUTLINE.borders} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                        </svg>

                        {OCEANS.map((ocean) => <OceanLabel key={ocean.name} {...ocean} />)}
                    </div>
                </div>

                {statuses.length > 0 && <WindStreaks direction={wind.direction} speed={wind.speed} paused={!visible} />}

                {/* Spots share the artwork's frame, so their percentages land on the coastline */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ aspectRatio: ASPECT }}>
                    {entries.map(({ spot, status }) => {
                        const { x, y } = projectSpot(spot.coordinates);
                        const label = LABELS[getSpotSlug(spot)] ?? { side: "left" };
                        const active = hovered === spot.url;
                        const labelTransform = {
                            left: `translate(calc(-100% - 10px), calc(-50% + ${label.dy ?? 0}px))`,
                            right: `translate(10px, calc(-50% + ${label.dy ?? 0}px))`,
                            below: "translate(-50%, 12px)",
                        }[label.side];

                        return (
                            // Hidden from assistive tech and the tab order: the spot list carries the same links
                            <a
                                key={spot.url}
                                href={spot.url}
                                tabIndex={-1}
                                aria-hidden="true"
                                draggable={false}
                                onPointerEnter={() => onHover(spot.url)}
                                onPointerLeave={() => onHover(null)}
                                className="absolute"
                                style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                            >
                                {/* 32px hit area around a 10px dot */}
                                <span className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center">
                                    <span
                                        className={`block size-2.5 rounded-full transition-transform duration-[160ms] ease-[var(--ease-out)] ${active || (!hovered && status === tagged) ? "scale-150" : ""}`}
                                        // No forecast: a neutral dot, so the spot is still there to tap
                                        style={{ backgroundColor: status ? getGraphStrokeColor(status.now.speed) : "#52525b" }}
                                    />
                                </span>

                                <span
                                    className={`absolute hidden items-center whitespace-nowrap rounded-[9px] py-1 px-2 text-xs font-medium ring-1 ring-inset backdrop-blur-md transition-[background-color,box-shadow,color] duration-150 ease-[ease] sm:flex ${
                                        active ? "bg-zinc-800/95 text-zinc-50 ring-white/20" : "bg-surface/80 text-zinc-300 ring-white/10"
                                    }`}
                                    style={{ transform: labelTransform }}
                                >
                                    {spot.name}
                                </span>
                            </a>
                        );
                    })}

                    {tagged && (
                        <div className="sm:hidden">
                            <PhoneTag status={tagged} />
                        </div>
                    )}
                </div>

                {/* How far is far: the spots run about 300 km of coast. Styled like the wind legend; the padding is added to
                    the width, so the bar itself still spans the true distance */}
                <div
                    className="pointer-events-none absolute bottom-2.5 left-2.5 hidden rounded-lg bg-surface/80 px-2 pb-1 pt-2 ring-1 ring-inset ring-white/[0.06] backdrop-blur-md sm:block"
                    style={{ width: `calc(${SCALE_WIDTH * 100}% + 1rem)` }}
                    aria-hidden="true"
                >
                    <div className="h-1.5 border-x border-b border-zinc-500" />
                    <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums leading-4 text-zinc-500">
                        <span>0</span>
                        <span>{SCALE_KM} km</span>
                    </div>
                </div>

                {/* What the dot colours mean: the footer's wind scale, condensed */}
                <div className="pointer-events-none absolute right-2.5 top-2.5 hidden w-40 rounded-lg bg-surface/80 px-2 pb-1 pt-2 ring-1 ring-inset ring-white/[0.06] backdrop-blur-md md:block" aria-hidden="true">
                    <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-px">
                        {WIND_SCALE.map((knots) => (
                            <div key={knots} className={`h-1.5 first:rounded-l-sm last:rounded-r-sm ${getWindBackgroundColor(knots)}`} />
                        ))}
                    </div>
                    <div className="mt-1 grid grid-cols-[repeat(15,minmax(0,1fr))] font-mono text-[10px] tabular-nums leading-4 text-zinc-500">
                        {WIND_SCALE.map((knots, i) =>
                            i % 4 === 0 ? <span key={knots} style={{ gridColumnStart: i + 1 }}>{knots}</span> : null,
                        )}
                        <span className="justify-self-end" style={{ gridColumnStart: WIND_SCALE.length }}>kn</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

const OceanLabel = ({ name, coordinates }: (typeof OCEANS)[number]) => {
    const { x, y } = projectSpot(coordinates);
    return (
        // The same small caps as the page's eyebrow
        <span
            className={`pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600 sm:block ${HALO}`}
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        >
            {name}
        </span>
    );
};

const PhoneTag = ({ status }: { status: SpotStatus }) => {
    const { x, y } = projectSpot(status.spot.coordinates);
    // Near an edge the tag hangs off the other side of the dot, so it never gets cut off
    const shiftX = x > 0.72 ? "-100% + 14px" : x < 0.28 ? "-14px" : "-50%";
    const below = y < 0.3;
    const shiftY = below ? "14px" : "-100% - 14px";
    const from = below ? "-4px" : "4px";

    return (
        <div
            key={status.spot.url}
            className="spot-tag pointer-events-none absolute flex items-center gap-1.5 whitespace-nowrap rounded-[9px] bg-surface/90 py-1 pl-2.5 pr-1 text-xs font-medium text-zinc-100 shadow-lg shadow-black/50 ring-1 ring-white/10 backdrop-blur-md"
            style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                "--tag-to": `translate(calc(${shiftX}), calc(${shiftY}))`,
                "--tag-from": `translate(calc(${shiftX}), calc(${shiftY} + ${from}))`,
            } as CSSProperties}
        >
            {status.spot.name}
            <WindChip speed={status.now.speed} className="h-5 min-w-7 rounded-[5px]" />
        </div>
    );
};
