import { CSSProperties, MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Star } from "lucide-react";
import { getWindBackgroundColor, WIND_SCALE } from "../../utils/colorUtils";
import { getDegreesToCompass } from "../../utils/dataUtils";
import { getSpotSlug } from "../../utils/spotUtils";
import { Spot } from "../../utils/spotUtils";
import { DirectionArrow } from "../ui/DirectionArrow";
import { WindChip } from "../ui/WindChip";
import { boxStyle, fitArtwork, Size } from "./mapFrame";
import { MapTimeline, TimelineHour } from "./MapTimeline";
import { buildWindField, WindField } from "./windField";
import { getLandMask } from "./landMask";
import { FieldAt, WindColours, WindParticles } from "./WindLayers";
import terrain from "./terrain.jpg";
import depth from "./depth.jpg";
import { prepareTerrainShade, useTerrainShade } from "./terrainShade";
import { MapArtwork } from "./MapArtwork";
import { averageWind, OUTLINE, projectSpot, SpotEntry, SpotHover, SpotStatus, Wind, windAt } from "./spotStatus";

// Which side of its spot each name sits, out over the sea where there's room. Blouberg's goes inland over the flat
// Cape Flats instead: out to sea it would cover Robben Island, and below it Table Mountain. Langebaan's goes inland
// too, clear of the lagoon. Melkbos and Blouberg are only a label's height apart, so they face opposite ways. Misty
// Cliffs' goes out over False Bay, as one to the west runs off a phone's map. A spot missing here gets a label to its left.
type Side = "left" | "right" | "below";
const LABELS: Record<string, Side> = {
    langebaan: "right",
    melkbos: "left",
    blouberg: "right",
    mistycliffs: "right",
    hermanus: "below",
    witsand: "below",
};

// The label sits beside its spot's pin, a small gap clear of it
const LABEL_PLACEMENT: Record<Side, string> = {
    left: "translate(calc(-100% - 8px), -50%)",
    right: "translate(8px, -50%)",
    below: "translate(-50%, 8px)",
};
// The same edge as the site's cards: a fine light ring and a highlight along the top, under
// a soft drop shadow, stronger while the label is lit
const LABEL_EDGE = "0 0 0 1px rgb(255 255 255 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.04)";
const LABEL_SHADOW = { rest: `${LABEL_EDGE}, 0 4px 10px -2px rgb(0 0 0 / 0.45)`, lit: `${LABEL_EDGE}, 0 8px 18px -4px rgb(0 0 0 / 0.6)` };

// Forecast hours the timeline sweeps through per second while playing: the next two days in about 25 s
const PLAY_RATE = 2;
// Room kept clear along the bottom of the map for the timeline, in px, so it never sits over a spot
const TIMELINE_ROOM = 60;
// How long a spot's card stays up after the pointer leaves its label, so it can be reached, in ms
const PEEK_LINGER = 150;

// Night: the map dims to this much darker for the hours of darkness, easing in and out over this long around sunrise and
// sunset (in hours), so scrubbing or playing through an evening shows it get dark
const NIGHT_DIM = 0.38;
const TWILIGHT = 0.75;

/** How dark the hour (counted from midnight today, fractional) is: 0 by day, 1 at night, eased across twilight */
const darkness = (hour: number, sunrise: number, sunset: number) => {
    const clock = ((hour % 24) + 24) % 24 + 0.5;
    const ramp = (t: number) => Math.min(Math.max(t / TWILIGHT + 0.5, 0), 1);
    return 1 - Math.min(ramp(clock - sunrise), ramp(sunset - clock));
};

// The map's static artwork is prepared as soon as this code loads, while the forecast is still being fetched, so it's
// there on the map's first frame instead of popping in after: the relief and sea floor turned to light and shade now,
// the coastline's land mask (friction and shadow) when the browser is next idle
if (typeof window !== "undefined") {
    prepareTerrainShade(terrain);
    prepareTerrainShade(depth);
    (window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 0)))(() => getLandMask());
}

/** "HH:MM" as hours, e.g. 6.5 */
const clockHours = (clock: string) => {
    const [h, m] = clock.split(":").map(Number);
    return h + (m || 0) / 60;
};

interface MapCardProps extends SpotHover {
    entries: SpotEntry[];
    /** The rider's best window: its spot's label carries a star */
    pick: SpotStatus | null;
    /** The weather station's latest reading, shown on its spot's label while the map is on now */
    live?: { url: string; speed: number; minutesAgo: number } | null;
    className?: string;
}

/**
 * The Western Cape as a live wind map: land and sea tinted and streaming with the wind blended between the spots, every
 * spot marked by its name and (from sm) its wind. The timeline along the bottom sweeps the whole map through the next two
 * days, and pointing anywhere (tapping, on a phone) reads off the wind there. The map frames the spots, so a phone gets a
 * closer, taller view than a wide screen.
 */
export const MapCard = ({ entries, pick, live, hovered, onHover, className = "" }: MapCardProps) => {
    const reliefShade = useTerrainShade(terrain);
    const depthShade = useTerrainShade(depth);

    // --- Time: the hour on the map, counted from midnight today; null follows the current hour -----------------------
    const base = entries.find((e) => e.status)?.status ?? null;
    const nowIndex = base ? Math.max(base.hours.indexOf(base.now), 0) : 0;
    const lastIndex = base ? base.hours.length - 1 : 0;
    const [chosenHour, setChosenHour] = useState<number | null>(null);
    const hour = Math.min(chosenHour ?? nowIndex, lastIndex);
    // Live readings are of now, so they only show while the map is
    const atNow = Math.round(hour) === nowIndex;

    const timeline = useMemo<TimelineHour[]>(() => {
        if (!base) return [];
        const statuses = entries.flatMap((e) => (e.status ? [e.status] : []));
        const [sunrise, sunset] = [clockHours(base.sunrise), clockHours(base.sunset)];
        return base.hours.slice(nowIndex).map((point, i) => {
            const index = nowIndex + i;
            const clock = index % 24;
            return {
                index,
                time: new Date(point.time),
                speed: averageWind(statuses.map((s) => windAt(s.hours, index))).speed,
                // Dark for the whole hour: over before sunrise, or starting after sunset
                night: clock + 1 <= sunrise || clock >= sunset,
            };
        });
    }, [entries, base, nowIndex]);

    const night = base ? darkness(hour, clockHours(base.sunrise), clockHours(base.sunset)) : 0;

    // Every spot's wind at the hour on show, and the field blended from them
    const winds = useMemo(
        () => entries.flatMap(({ spot, status }) => (status ? [{ ...windAt(status.hours, hour), coordinates: spot.coordinates, url: spot.url }] : [])),
        [entries, hour],
    );
    const landMask = useMemo(() => getLandMask(), []);
    // Each whole forecast hour's field, built once: playing or scrubbing the timeline then only blends cached hours
    const fieldAt = useMemo(() => {
        const cache = new Map<number, WindField | null>();
        return (h: number) => {
            if (!cache.has(h)) {
                const hourWinds = entries.flatMap(({ spot, status }) => (status ? [{ ...windAt(status.hours, h), coordinates: spot.coordinates }] : []));
                cache.set(h, buildWindField(hourWinds, { inland: landMask?.inland, hour: h }));
            }
            return cache.get(h) as WindField | null;
        };
    }, [entries, landMask]);
    // The nearest whole hour's field: the sign there's wind to draw at all
    const field = fieldAt(Math.round(hour));

    // --- Frame: measured, so the artwork can be fitted around the spots -------------------------------------------------
    const frameRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<Size | null>(null);
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const el = frameRef.current;
        if (!el) return;
        const update = (width: number, height: number) =>
            setSize((prev) => (!width || !height || (prev?.width === width && prev.height === height) ? prev : { width, height }));
        // Measured straight away too, rather than waiting on the observer's first report
        update(el.clientWidth, el.clientHeight);
        const resize = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
        resize.observe(el);
        // The particles and playback only run while the map is on screen
        const intersect = "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)) : null;
        intersect?.observe(el);
        return () => {
            resize.disconnect();
            intersect?.disconnect();
        };
    }, []);
    const hasTimeline = timeline.length > 1;
    // The spots fitted into the frame, clear of the timeline along its foot
    const box = useMemo(() => (size ? fitArtwork(size, { bottom: hasTimeline ? TIMELINE_ROOM : 0 }) : null), [size, hasTimeline]);

    // --- Playback: glides through the hours, so the map moves like a film rather than stepping ------------------------
    const [playing, setPlaying] = useState(false);
    const hourRef = useRef(hour);
    useEffect(() => {
        hourRef.current = hour;
    }, [hour]);
    useEffect(() => {
        if (!playing || !visible) return;
        let frame = 0;
        let last: number | null = null;
        const tick = (now: number) => {
            const next = hourRef.current + (Math.max(now - (last ?? now), 0) / 1000) * PLAY_RATE;
            last = now;
            if (next >= lastIndex) {
                setChosenHour(lastIndex);
                setPlaying(false);
                return;
            }
            hourRef.current = next;
            setChosenHour(next);
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing, visible, lastIndex]);

    const togglePlay = () => {
        // From the end, play starts over from now
        if (!playing && Math.round(hour) >= lastIndex) setChosenHour(nowIndex);
        setPlaying(!playing);
    };
    const scrub = (to: number) => {
        setPlaying(false);
        setChosenHour(to === nowIndex ? null : to);
    };

    // --- Peek: a spot's card, with its window and wind, while its label is pointed at, focused or tapped --------------
    const [peek, setPeek] = useState<string | null>(null);
    const lastPointer = useRef("mouse");
    const peekTimer = useRef(0);
    const keepPeek = () => window.clearTimeout(peekTimer.current);
    const dropPeek = () => {
        keepPeek();
        peekTimer.current = window.setTimeout(() => setPeek(null), PEEK_LINGER);
    };
    const showPeek = (url: string) => {
        keepPeek();
        setPeek(url);
    };
    useEffect(() => () => window.clearTimeout(peekTimer.current), []);
    // On touch the first tap on a label shows its card (which links on); a second tap opens the spot
    const onLabelClick = (e: MouseEvent, url: string) => {
        if (lastPointer.current !== "mouse" && peek !== url) {
            e.preventDefault();
            showPeek(url);
        }
    };

    // --- Pointer: a press on open map (not a spot or the map's own controls) puts a spot's card away -----------------
    const overMapUi = (e: PointerEvent) => !!(e.target as Element).closest("a, [data-map-ui]");
    const onPointerDown = (e: PointerEvent) => {
        lastPointer.current = e.pointerType;
        if (!overMapUi(e)) setPeek(null);
    };

    return (
        // A card like the spot page's, headed the same way, with the map inset in it
        <section aria-labelledby="map-title" className={`card animate-enter flex flex-col p-4 md:p-5 ${className}`} style={{ "--i": 1 } as CSSProperties}>
            <header className="mb-3 md:mb-4">
                <h2 id="map-title" className="text-sm font-semibold text-zinc-100">Wind map</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Every spot's forecast, blended between them. Play or drag the timeline to see what's coming</p>
            </header>
            <div
                ref={frameRef}
                onPointerDown={onPointerDown}
                // A little taller than wide on phones so the coast gets its height; wider from sm, and a landscape frame
                // beside the best window on large screens
                className="relative aspect-[4/5] select-none overflow-hidden rounded-xl bg-canvas ring-1 ring-inset ring-white/[0.04] sm:aspect-[4/3] lg:aspect-[16/11]"
            >
                {size && box && (
                    <>
                        {/* The wind colours, over land and sea alike. Until there's a forecast, the sea gets a faint dot grid that
                            the land covers instead, so the water has texture and the coast an edge */}
                        {field ? (
                            <WindColours fieldAt={fieldAt as FieldAt} hour={hour} lastHour={lastIndex} size={size} box={box} />
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1.5px)] bg-[length:14px_14px]" />
                        )}

                        {/* The artwork, placed in the box the spots were fitted into */}
                        <div className="absolute" style={boxStyle(box)}>
                            {/* overflow-visible: the outline runs past its frame inland, so a taller card shows more land, not a cut edge */}
                            <svg viewBox={`0 0 ${OUTLINE.width} ${OUTLINE.height}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                                {/* A light shade over the wind colours: the wind is what matters, so it reads on land almost as strongly
                                    as at sea, the land just a step darker. The rest of the artwork is drawn on the canvas below */}
                                <path d={OUTLINE.land} fill="#141417" fillOpacity={field ? 0.38 : 1} />
                                <path d={OUTLINE.borders} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            </svg>
                        </div>

                        {field && <MapArtwork size={size} box={box} relief={reliefShade} depth={depthShade} landMask={landMask} />}
                        {field && <WindParticles fieldAt={fieldAt as FieldAt} hour={hour} lastHour={lastIndex} size={size} box={box} paused={!visible} />}

                        {/* Night falls over the map (not its labels) as the hour on show passes sunset. Left out by day, so it
                            costs nothing to composite then */}
                        {night > 0 && <div
                            className="pointer-events-none absolute inset-0 bg-[#05070d] transition-opacity duration-300 ease-[ease]"
                            style={{ opacity: night * NIGHT_DIM }}
                            aria-hidden="true"
                        />}


                        {/* Spots share the artwork's box, so their percentages land on the coastline */}
                        <div className="absolute" style={boxStyle(box)}>
                            {entries.map(({ spot, status }) => {
                                const { x, y } = projectSpot(spot.coordinates);
                                const side = LABELS[getSpotSlug(spot)] ?? "left";
                                const lit = hovered === spot.url || peek === spot.url;
                                // While one spot has the focus (pointed at, or its card open), the others step back
                                const receded = !!(peek ?? hovered) && !lit;
                                const best = pick?.spot.url === spot.url;
                                // A window today: what the old spot list answered at a glance
                                const kiteable = status?.window && status.windowDay === "Today";
                                const liveHere = atNow && live?.url === spot.url ? live : null;
                                const tone = lit ? "bg-zinc-800/95 text-zinc-50" : "bg-surface/85 text-zinc-200";

                                return (
                                    // The map is the home page's list of spots now, so every label is a real link
                                    <a
                                        key={spot.url}
                                        href={spot.url}
                                        aria-label={`${spot.name}${best ? ", your best window" : kiteable ? ", kiteable today" : ""}: ${describeWindow(status)}${liveHere ? `. Live ${Math.round(liveHere.speed)} knots` : ""}`}
                                        draggable={false}
                                        onPointerEnter={(e) => {
                                            onHover(spot.url);
                                            if (e.pointerType === "mouse") showPeek(spot.url);
                                        }}
                                        onPointerLeave={() => {
                                            onHover(null);
                                            if (lastPointer.current === "mouse") dropPeek();
                                        }}
                                        onFocus={() => {
                                            onHover(spot.url);
                                            showPeek(spot.url);
                                        }}
                                        onBlur={() => {
                                            onHover(null);
                                            dropPeek();
                                        }}
                                        onClick={(e) => onLabelClick(e, spot.url)}
                                        // Lit, it lifts a little, growing out of its pin; receded, it fades back
                                        className={`group absolute rounded-full transition-[transform,opacity] duration-150 ease-[var(--ease-out)] focus-visible:outline-none motion-reduce:transition-none ${
                                            lit ? "z-10 scale-[1.04]" : receded ? "opacity-60" : ""
                                        }`}
                                        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                                    >
                                        {/* The pin: exactly where the spot is, its label beside it */}
                                        <span className="absolute z-10 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgb(9_9_11/0.7),0_1px_3px_rgb(0_0_0/0.5)]" />
                                        {/* The label is the marker. Its tap area reaches past it on touch screens, toward the 44px a finger needs */}
                                        <span
                                            className={`absolute flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-md transition-[background-color,box-shadow,color] duration-150 ease-[ease] before:absolute before:-inset-1 before:content-[''] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-rose-500 sm:px-2.5 sm:py-1 sm:text-xs [@media(pointer:coarse)]:before:-inset-y-3 ${tone}`}
                                            style={{ transform: LABEL_PLACEMENT[side], boxShadow: lit ? LABEL_SHADOW.lit : LABEL_SHADOW.rest }}
                                        >
                                            {/* The best window gets a star; any other spot kiteable today, a check */}
                                            {best ? (
                                                <Star className="-ml-0.5 mr-1 size-3 shrink-0 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                                            ) : (
                                                kiteable && <Check className="-ml-0.5 mr-1 size-3 shrink-0 text-emerald-400" strokeWidth={3} aria-hidden="true" />
                                            )}
                                            {spot.name}
                                            {/* The spot has a station reading live (its knots are in the spot's card): a small broadcasting
                                                ring rather than a solid dot, which would read as a notification */}
                                            {liveHere && (
                                                <span className="ml-1.5 grid size-2 shrink-0 place-items-center rounded-full ring-1 ring-rose-400/70" aria-hidden="true">
                                                    <span className="live-dot size-1" />
                                                </span>
                                            )}
                                        </span>
                                    </a>
                                );
                            })}
                        </div>


                        {(() => {
                            const entry = peek ? entries.find((e) => e.spot.url === peek) : undefined;
                            if (!entry) return null;
                            const { x, y } = projectSpot(entry.spot.coordinates);
                            return (
                                <SpotPeek
                                    key={entry.spot.url}
                                    spot={entry.spot}
                                    status={entry.status}
                                    wind={winds.find((w) => w.url === entry.spot.url)}
                                    best={pick?.spot.url === entry.spot.url}
                                    live={atNow && live?.url === entry.spot.url ? live : undefined}
                                    x={box.left + x * box.width}
                                    y={box.top + y * box.height}
                                    frameWidth={size.width}
                                    frameHeight={size.height}
                                    others={entries
                                        .filter((e) => e.spot.url !== entry.spot.url)
                                        .map((e) => {
                                            const p = projectSpot(e.spot.coordinates);
                                            return { x: box.left + p.x * box.width, y: box.top + p.y * box.height };
                                        })}
                                    onPointerEnter={keepPeek}
                                    onPointerLeave={() => lastPointer.current === "mouse" && dropPeek()}
                                    onFocus={keepPeek}
                                    onBlur={dropPeek}
                                />
                            );
                        })()}

                        {/* What the colours mean, in the corner the coast leaves empty */}
                        <div
                            data-map-ui
                            className="pointer-events-none absolute right-2.5 top-2.5 w-36 rounded-lg bg-surface/80 px-2 pb-1 pt-2 ring-1 ring-inset ring-white/[0.06] backdrop-blur-md sm:w-40"
                            aria-hidden="true"
                        >
                            <WindLegend />
                        </div>

                        {hasTimeline && (
                            <div data-map-ui className="absolute inset-x-2.5 bottom-2.5">
                                <MapTimeline hours={timeline} value={hour} onChange={scrub} playing={playing} onTogglePlay={togglePlay} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

/** What the colours mean: the footer's wind scale, condensed */
const WindLegend = () => (
    <div title="Wind in knots. Between the spots the colours are blended from their forecasts.">
        <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-px">
            {WIND_SCALE.map((knots) => (
                <div key={knots} className={`h-1.5 first:rounded-l-sm last:rounded-r-sm ${getWindBackgroundColor(knots)}`} />
            ))}
        </div>
        <div className="mt-1 grid grid-cols-[repeat(15,minmax(0,1fr))] font-mono text-[10px] tabular-nums leading-4 text-zinc-500">
            {WIND_SCALE.map((knots, i) => (i % 4 === 0 ? <span key={knots} style={{ gridColumnStart: i + 1 }}>{knots}</span> : null))}
            <span className="justify-self-end" style={{ gridColumnStart: WIND_SCALE.length }}>kn</span>
        </div>
    </div>
);

/** A spot's kite window in a few words, like the old spot list had it: "11:00–19:00 · 14 m²", or why there's none */
const describeWindow = (status: SpotStatus | null) => {
    if (!status) return "No forecast right now";
    if (!status.window) return status.reason ?? "No window today";
    const kite = status.window.plan[0]?.size;
    return `${status.windowDay === "Today" ? "" : "Tomorrow "}${status.windowLabel}${kite ? ` · ${kite} m²` : ""}`;
};

interface SpotPeekProps {
    spot: Spot;
    status: SpotStatus | null;
    /** At the hour on the map */
    wind?: Wind;
    best: boolean;
    /** The weather station's latest reading there, while the map is on now */
    live?: { speed: number; minutesAgo: number };
    /** The spot, in frame px */
    x: number;
    y: number;
    frameWidth: number;
    frameHeight: number;
    /** The other spots, in frame px: the card opens on whichever side keeps their labels in view */
    others: { x: number; y: number }[];
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
}

/**
 * A spot's card over the map: its kite window (what the old spot list showed), the wind there at the hour on the map, and
 * the way on to its page. It rises above the spot, or hangs below one near the top, and keeps inside the frame.
 */
// The card's size, near enough, and the gap it keeps from its spot, in px, for choosing the side it opens on
const PEEK = { width: 256, height: 128, gap: 26 };
// Room a neighbouring spot's label takes around it, in px
const NEIGHBOUR = { x: 70, y: 18 };

const SpotPeek = ({ spot, status, wind, best, live, x, y, frameWidth, frameHeight, others, ...handlers }: SpotPeekProps) => {
    const shiftX = x > frameWidth - 140 ? "-100% + 20px" : x < 140 ? "-20px" : "-50%";
    const left = x > frameWidth - 140 ? x - PEEK.width + 20 : x < 140 ? x - 20 : x - PEEK.width / 2;
    // Above by default, below near the top; but whichever of the two covers no other spot wins
    const covers = (top: number) =>
        others.some((o) => o.x > left - NEIGHBOUR.x && o.x < left + PEEK.width + NEIGHBOUR.x && o.y > top - NEIGHBOUR.y && o.y < top + PEEK.height + NEIGHBOUR.y);
    const aboveTop = y - PEEK.gap - PEEK.height, belowTop = y + PEEK.gap;
    const aboveFits = aboveTop > 8, belowFits = belowTop + PEEK.height < frameHeight - 90;
    const preferBelow = !aboveFits;
    const below = preferBelow
        ? !(covers(belowTop) && aboveFits && !covers(aboveTop))
        : covers(aboveTop) && belowFits && !covers(belowTop);
    const shiftY = below ? `${PEEK.gap}px` : `-100% - ${PEEK.gap}px`;

    return (
        <a
            href={spot.url}
            data-map-ui
            tabIndex={-1}
            {...handlers}
            className="spot-peek pressable absolute z-20 flex w-64 flex-col rounded-xl bg-zinc-900/95 p-3 shadow-xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-md active:scale-[0.98]"
            style={{ left: x, top: y, "--peek": `translate(calc(${shiftX}), calc(${shiftY}))`, "--peek-from": `translate(calc(${shiftX}), calc(${shiftY} + ${below ? "-4px" : "4px"}))` } as CSSProperties}
        >
            <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-50">{spot.name}</span>
                    {best && <span className="shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">Best</span>}
                </span>
                {wind && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
                        <DirectionArrow degrees={wind.direction} className="size-3 fill-zinc-400 stroke-none" />
                        {getDegreesToCompass(wind.direction)}
                        <WindChip speed={wind.speed} className="h-5 min-w-7 rounded-[5px]" />
                    </span>
                )}
            </span>
            <span className={`mt-1 text-xs tabular-nums ${status?.window ? "text-zinc-300" : "text-zinc-500"}`}>{describeWindow(status)}</span>
            {live && (
                // The station's own reading, apart from the forecast above it, in the spot page's words
                <span className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="live-dot" aria-hidden="true" />
                    Live <span className="font-medium tabular-nums text-zinc-100">{Math.round(live.speed)} kn</span> · {Math.round(live.minutesAgo)} min ago
                </span>
            )}
            <span className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2 text-xs font-medium text-zinc-400">
                Spot forecast
                <ChevronRight className="size-3.5" aria-hidden="true" />
            </span>
        </a>
    );
};
