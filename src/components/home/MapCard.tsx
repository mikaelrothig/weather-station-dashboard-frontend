import { CSSProperties, useEffect, useRef, useState } from "react";
import { getGraphStrokeColor } from "../../utils/ColorUtils";
import { getDegreesToCompass } from "../../utils/DataUtils";
import { getSpotSlug } from "../../utils/spotUtils";
import { DirectionArrow } from "../ui/DirectionArrow";
import { WindChip } from "../ui/WindChip";
import { WindStreaks } from "./WindStreaks";
import { averageWind, OUTLINE, projectSpot, SpotEntry, SpotHover, SpotStatus } from "./spotStatus";

// Where each name sits next to its dot, always out over the sea. Melkbos and Blouberg are 15 km apart, so they
// split above and below. A spot missing here gets a label to its left.
const LABELS: Record<string, { side: "left" | "below"; dy?: number }> = {
    melkbos: { side: "left", dy: -11 },
    blouberg: { side: "left", dy: 11 },
    hermanus: { side: "below" },
    witsand: { side: "below" },
};

const ASPECT = `${OUTLINE.width} / ${OUTLINE.height}`;

const DOT_LEGEND = [8, 15, 22, 30];

interface MapCardProps extends SpotHover {
    entries: SpotEntry[];
    /** Tagged on phones when nothing is being pointed at */
    featured: SpotStatus | null;
    className?: string;
}

/**
 * The Western Cape with live wind drifting across it and every spot plotted in its wind colour. From sm every spot
 * is named on the map; phones get a single tag for the spot you touched, or today's pick.
 */
export const MapCard = ({ entries, featured, hovered, onHover, className = "" }: MapCardProps) => {
    const statuses = entries.flatMap((e) => (e.status ? [e.status] : []));
    const wind = averageWind(statuses);
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
                className="relative mt-3 min-h-0 flex-[1_0_auto] overflow-hidden rounded-xl bg-canvas ring-1 ring-inset ring-white/[0.06]"
                style={{ aspectRatio: ASPECT }}
            >
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ aspectRatio: ASPECT }}>
                    {/* overflow-visible: the outline runs past its frame inland, so a taller card shows more land, not a cut edge */}
                    <svg viewBox={`0 0 ${OUTLINE.width} ${OUTLINE.height}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                        <path d={OUTLINE.land} fill="#17171a" />
                        <path d={OUTLINE.borders} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                </div>

                {statuses.length > 0 && <WindStreaks direction={wind.direction} speed={wind.speed} paused={!visible} />}

                {/* Spots share the artwork's frame, so their percentages land on the coastline */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ aspectRatio: ASPECT }}>
                    {entries.map(({ spot, status }) => {
                        const { x, y } = projectSpot(spot.coordinates);
                        const label = LABELS[getSpotSlug(spot)] ?? { side: "left" };
                        const active = hovered === spot.url;
                        const labelTransform = label.side === "left"
                            ? `translate(calc(-100% - 10px), calc(-50% + ${label.dy ?? 0}px))`
                            : "translate(-50%, 12px)";

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
                                        className={`block size-2.5 rounded-full shadow-[0_0_0_2px_#09090b] transition-transform duration-150 ease-out ${active || (!hovered && status === tagged) ? "scale-150" : ""}`}
                                        // No forecast: a neutral dot, so the spot is still there to tap
                                        style={{ backgroundColor: status ? getGraphStrokeColor(status.now.speed) : "#52525b" }}
                                    />
                                </span>

                                <span
                                    className={`absolute hidden items-center gap-1.5 whitespace-nowrap rounded-lg py-0.5 pl-2 pr-0.5 text-xs font-medium ring-1 backdrop-blur-md transition-[background-color,box-shadow,color] duration-150 ease-out sm:flex ${
                                        active ? "bg-zinc-800/95 text-zinc-50 ring-white/20" : "bg-zinc-900/80 text-zinc-300 ring-white/10"
                                    }`}
                                    style={{ transform: labelTransform }}
                                >
                                    {spot.name}
                                    {status ? <WindChip speed={status.now.speed} className="h-5 min-w-7 rounded-[5px]" /> : <span className="pr-1.5 text-zinc-500">–</span>}
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

                {/* What the dot colours mean */}
                <div className="pointer-events-none absolute right-2.5 top-2.5 hidden items-center gap-1.5 rounded-md bg-zinc-900/70 px-2 py-1 text-[10px] font-medium text-zinc-400 ring-1 ring-white/[0.06] backdrop-blur-md md:flex">
                    {DOT_LEGEND.map((kn) => (
                        <span key={kn} className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: getGraphStrokeColor(kn) }} />
                            {kn}
                        </span>
                    ))}
                    <span className="text-zinc-500">kn</span>
                </div>
            </div>
        </section>
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
            className="spot-tag pointer-events-none absolute flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-zinc-900/90 px-2 py-1 text-xs font-medium text-zinc-100 shadow-lg shadow-black/50 ring-1 ring-white/10 backdrop-blur-md"
            style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                "--tag-to": `translate(calc(${shiftX}), calc(${shiftY}))`,
                "--tag-from": `translate(calc(${shiftX}), calc(${shiftY} + ${from}))`,
            } as CSSProperties}
        >
            {status.spot.name}
            <span className="tabular-nums text-zinc-400">{Math.round(status.now.speed)} kn</span>
        </div>
    );
};
