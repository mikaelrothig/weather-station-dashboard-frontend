import { CSSProperties, ReactNode, useId } from "react";
import { CalendarDays, ChevronDown, ChevronRight, Wind } from "lucide-react";
import { useRiderSettings } from "../../hooks/useRiderSettings";
import { formatDate } from "../../utils/timeUtils";
import { leadKite, windRange } from "../../utils/kiteUtils";
import { getWindBackgroundColor } from "../../utils/colorUtils";
import { RiderSettingsMenu } from "../RiderSettings";
import { KiteWindowBody, KiteWindowSummary } from "../ui/KiteWindowDetails";
import { WindStrip } from "../ui/WindStrip";
import { hoverProps, SpotHover, SpotStatus } from "./spotStatus";

// Other kiteable spots shown as cards under the best window: three fill the card beside the map without crowding the best
const MAX_ALSO = 3;

interface TodayPanelProps {
    /** "Kiteable at 5 of 6 spots today." */
    summary: ReactNode;
    /** The rider's best window, today or tomorrow */
    best: SpotStatus | null;
    /** Shown instead when there's no window today or tomorrow */
    windiest: SpotStatus | null;
    /** Whether the best window's details are open; its one-line summary always shows */
    open: boolean;
    onToggle: () => void;
    onHover: SpotHover["onHover"];
    /** Every other spot with a window today, best first, listed under the best window from md */
    alsoToday?: SpotStatus[];
    /** With the page's title on top (phones, where this card leads the page); without, just the best window (from md,
     * where the page has its own title, as the spot pages do) */
    intro?: boolean;
    className?: string;
}

/**
 * The rider's best kite window, laid out like the spot page's Kite windows card (the same heading, rules line, rider
 * settings, rose "Best" panel and disclaimer), with the page's own title on top where it leads the page. The window's
 * summary (where, when, what to rig) is always there and opens onto the rest: the day's strip and the wind.
 */
export const TodayPanel = ({ summary, best, windiest, alsoToday = [], open, onToggle, onHover, intro = true, className = "" }: TodayPanelProps) => {
    const titleId = useId();
    const { weight, kites, profile } = useRiderSettings();
    const detailsId = useId();
    const kiteWindow = best?.window ?? null;
    const shown = kiteWindow ? best : windiest;


    // The same line the spot page's best window opens with: "Tomorrow · Misty Cliffs"
    const dayLabel = shown && (
        <span className="min-w-0 truncate text-xs font-medium text-zinc-400">
            {shown.windowDay ?? "Today"} · <span className="text-zinc-100">{shown.spot.name}</span>
        </span>
    );

    return (
        <section
            aria-labelledby={titleId}
            // z-20: the settings popover opens over the map card after it, which animates in with a transform
            className={`card animate-enter relative z-20 flex flex-col p-4 md:p-5 ${className}`}
            style={{ "--i": intro ? 0 : 2 } as CSSProperties}
        >
            {intro && (
                // The page's title, set like the spot page's "Right now" card on phones: eyebrow, title, the answer, the date
                <div className="mb-4 border-b border-white/[0.06] pb-4">
                    <p className="eyebrow">
                        <Wind className="size-3.5" aria-hidden="true" />
                        Kite & wind forecast
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">Today's conditions</h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{summary}</p>
                    {/* The date, and the rider settings beside it: every window on the page follows them */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="flex items-center gap-1.5 text-sm text-zinc-400">
                            <CalendarDays className="size-3.5 text-zinc-500" aria-label="Date" />
                            {formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <RiderSettingsMenu />
                    </div>
                </div>
            )}

            <div className="flex flex-1 flex-col">
                {/* As the spot page's Kite windows card heads it: the title and the rules (their settings are by the date) */}
                <header>
                    <div className="min-w-0">
                        {/* Plural where the other kiteable spots' windows are listed under the best one */}
                        <h2 id={titleId} className="text-sm font-semibold text-zinc-100">
                            {!intro && alsoToday.length > 0 ? "Your best kite windows" : "Your best kite window"}
                        </h2>
                        <p className="mt-0.5 text-xs text-zinc-500">
                            Daylight, {profile.minWind}–{profile.maxWind} kn, gusts under {profile.maxGust}, not offshore
                            {kites.length > 0 && ", with your kites"}
                        </p>
                    </div>
                </header>

                {kiteWindow && best ? (
                    <div
                        {...hoverProps(best.spot.url, onHover)}
                        className="mt-3 flex flex-col rounded-xl bg-rose-500/[0.06] p-3 ring-1 ring-inset ring-rose-500/25 md:p-3.5"
                    >
                        {/* The summary is the toggle: always there, it opens onto the strip and the wind */}
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-expanded={open}
                            aria-controls={detailsId}
                            className="pressable -m-1.5 flex items-start gap-2 rounded-lg p-1.5 text-left hover:bg-rose-500/[0.05]"
                        >
                            <span className="min-w-0 flex-1">
                                <KiteWindowSummary
                                    heading={false}
                                    window={kiteWindow}
                                    weight={weight}
                                    profile={profile}
                                    label={
                                        <>
                                            {dayLabel}
                                            <span className="shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">Best</span>
                                        </>
                                    }
                                />
                            </span>
                            <ChevronDown
                                className={`mt-0.5 size-4 shrink-0 text-zinc-500 transition-transform duration-200 ease-[var(--ease-out)] ${open ? "rotate-180" : ""}`}
                                aria-hidden="true"
                            />
                        </button>

                        {/* Opens by growing its row from 0fr to 1fr, so the height animates without being measured */}
                        <div
                            id={detailsId}
                            inert={!open}
                            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-[var(--ease-out)] motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                        >
                            <div className="min-h-0 overflow-hidden">
                                <div className="flex flex-col gap-3 pt-3">
                                    <KiteWindowBody window={kiteWindow} hours={best.dayHours} profile={profile} />
                                    <a
                                        href={best.spot.url}
                                        // No negative margins: the opening row clips its overflow, which cut the hover's edges off
                                        className="pressable flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-zinc-100 active:scale-[0.98]"
                                    >
                                        {best.spot.name} forecast
                                        <ChevronRight className="size-3.5 text-zinc-500" aria-hidden="true" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    shown && (
                        // No window today or tomorrow: the spot page's quiet panel, for the windiest spot
                        <a
                            href={shown.spot.url}
                            {...hoverProps(shown.spot.url, onHover)}
                            className="pressable mt-3 flex flex-col gap-2.5 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.04] hover:bg-white/[0.04] active:scale-[0.98] md:p-3.5"
                        >
                            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                {dayLabel}
                                <span className="text-sm font-medium text-zinc-500">{shown.reason ?? "No windows today"}</span>
                            </span>
                            <WindStrip hours={shown.dayHours} window={null} />
                        </a>
                    )
                )}

                {/* The other spots worth going to today, as compact kite window cards in the best window's layout: where and
                    when, what to rig, and the day's wind with the window lit. A few at most, so they never crowd out the
                    best one; the rest are checked on the map. On phones the map below answers this, so the card stays short */}
                {!intro && alsoToday.length > 0 && (
                    <div className="mt-2">
                        <ul className="flex flex-col gap-2" aria-label="Also kiteable today">
                            {alsoToday.slice(0, MAX_ALSO).map((status) => {
                                const spotWindow = status.window!;
                                return (
                                    <li key={status.spot.url}>
                                        <a
                                            href={status.spot.url}
                                            {...hoverProps(status.spot.url, onHover)}
                                            className="pressable flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.04] active:scale-[0.98] md:p-3.5"
                                        >
                                            <span className="flex items-start justify-between gap-3">
                                                <span className="min-w-0">
                                                    <span className="block truncate text-xs font-medium text-zinc-100">{status.spot.name}</span>
                                                    <span className="mt-0.5 flex items-baseline gap-1.5">
                                                        <span className="text-sm font-semibold tabular-nums text-zinc-50">{status.windowLabel}</span>
                                                        <span className="text-[11px] text-zinc-500">{spotWindow.duration}h</span>
                                                    </span>
                                                </span>
                                                <span className="shrink-0 text-right">
                                                    <span className="block text-sm font-semibold tabular-nums text-zinc-50">{leadKite(spotWindow, weight, profile)} m²</span>
                                                    <span className="block text-[11px] tabular-nums text-zinc-500">{windRange(spotWindow.minSpeed, spotWindow.maxSpeed)} kn</span>
                                                </span>
                                            </span>
                                            {/* The day's wind as a slim strip, the window at full colour */}
                                            <span className="flex h-1.5 gap-px" aria-hidden="true">
                                                {status.dayHours.map((h) => {
                                                    const inWindow = h.time >= spotWindow.start && h.time < spotWindow.end;
                                                    return (
                                                        <span
                                                            key={h.time.getTime()}
                                                            className={`flex-1 first:rounded-l-full last:rounded-r-full ${getWindBackgroundColor(Math.round(h.speed))} ${h.past ? "opacity-10" : inWindow ? "" : "opacity-25"}`}
                                                        />
                                                    );
                                                })}
                                            </span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                        {alsoToday.length > MAX_ALSO && (
                            <p className="mt-2 text-xs text-zinc-500">
                                +{alsoToday.length - MAX_ALSO} more, checked on the map
                            </p>
                        )}
                    </div>
                )}

                {/* At the card's foot, however tall the map beside it makes the card */}
                <p className="mt-auto pt-3 text-[11px] leading-relaxed text-zinc-500">
                    A forecast-based suggestion. Always check conditions before you ride.
                </p>
            </div>
        </section>
    );
};
