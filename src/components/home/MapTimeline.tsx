import { Pause, Play, RotateCcw } from "lucide-react";
import { getWindBackgroundColor } from "../../utils/colorUtils";
import { formatClock, formatDate } from "../../utils/timeUtils";

export interface TimelineHour {
    /** Hours from midnight today */
    index: number;
    time: Date;
    /** Average over every spot, in knots */
    speed: number;
    night: boolean;
}

interface MapTimelineProps {
    /** From the current hour to the end of the forecast */
    hours: TimelineHour[];
    /** The hour on the map, fractional while playing */
    value: number;
    onChange: (hour: number) => void;
    playing: boolean;
    onTogglePlay: () => void;
    className?: string;
}

// Bars are drawn up to this many knots tall; anything windier fills the strip
const TALLEST_KNOTS = 30;

/** "Today", "Tomorrow" or the weekday, for the hour at `index` */
const dayName = (index: number, time: Date) => (index < 24 ? "Today" : index < 48 ? "Tomorrow" : formatDate(time, { weekday: "long" }));

/**
 * The map's time control, Windy-style: the coming hours as a little chart of the average wind in the wind colours
 * (night faded), a play button that sweeps the map through them, and a readout of the hour on show. It's a native range
 * input underneath, so it drags, taps and takes arrow keys (Home jumps back to now). A button beside it takes it back to now.
 */
export const MapTimeline = ({ hours, value, onChange, playing, onTogglePlay, className = "" }: MapTimelineProps) => {
    if (hours.length < 2) return null;
    const first = hours[0].index;
    const last = hours[hours.length - 1].index;
    const shown = hours[Math.min(Math.max(Math.round(value) - first, 0), hours.length - 1)];
    const isNow = Math.round(value) === first;
    // Each bar's centre, as a share of the strip, so the thumb lines up with the hour it's on
    const at = (index: number) => `${((index - first + 0.5) / hours.length) * 100}%`;

    return (
        <div className={`rounded-xl bg-surface/80 px-2.5 py-1.5 ring-1 ring-inset ring-white/[0.06] backdrop-blur-md ${className}`}>
            <div className="flex items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onTogglePlay}
                    aria-label={playing ? "Pause the forecast" : "Play the forecast"}
                    className="btn-icon size-8 rounded-lg"
                >
                    {playing ? <Pause className="size-3.5 fill-current" aria-hidden="true" /> : <Play className="size-3.5 translate-x-px fill-current" aria-hidden="true" />}
                </button>

                {/* The outline shows on the strip when its (invisible) range input has keyboard focus */}
                <div className="relative min-w-0 flex-1 rounded-md has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-rose-500">
                    <div className="flex h-6 items-end gap-px" aria-hidden="true">
                        {hours.map((hour) => (
                            <div
                                key={hour.index}
                                className={`flex-1 rounded-[2px] ${getWindBackgroundColor(Math.round(hour.speed))} ${hour.night ? "opacity-30" : "opacity-80"}`}
                                style={{ height: `${Math.min(Math.max(hour.speed / TALLEST_KNOTS, 0.15), 1) * 100}%` }}
                            />
                        ))}
                    </div>

                    {/* Day breaks and every six hours (from sm, where there's room) */}
                    <div className="relative mt-1 h-3 text-[10px] leading-3 tabular-nums text-zinc-500" aria-hidden="true">
                        {hours.map((hour) => {
                            const midnight = hour.index % 24 === 0;
                            // Clear of "Now" at the start
                            if (hour.index - first < 3 || (!midnight && hour.index % 6 !== 0)) return null;
                            return (
                                <span
                                    key={hour.index}
                                    className={`absolute -translate-x-1/2 whitespace-nowrap ${midnight ? "font-medium text-zinc-300" : "hidden sm:block"}`}
                                    style={{ left: at(hour.index) }}
                                >
                                    {midnight ? formatDate(hour.time, { weekday: "short" }) : formatClock(hour.time).slice(0, 2)}
                                </span>
                            );
                        })}
                        <span className="absolute left-0 font-medium text-zinc-300">Now</span>
                    </div>

                    {/* Midnight: a hairline through the bars, so the days read apart */}
                    {hours.filter((h) => h.index % 24 === 0 && h.index !== first).map((h) => (
                        <div
                            key={h.index}
                            className="absolute top-0 h-6 w-px -translate-x-1/2 bg-white/25"
                            style={{ left: `${((h.index - first) / hours.length) * 100}%` }}
                            aria-hidden="true"
                        />
                    ))}

                    {/* The thumb: a bright line through the bars at the hour on show */}
                    <div
                        className="pointer-events-none absolute -top-1 h-8 w-0.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgb(9_9_11/0.6)]"
                        style={{ left: at(Math.min(Math.max(value, first), last)) }}
                        aria-hidden="true"
                    />

                    <input
                        type="range"
                        min={first}
                        max={last}
                        step={1}
                        value={Math.round(value)}
                        onChange={(e) => onChange(Number(e.target.value))}
                        aria-label="Forecast hour"
                        aria-valuetext={`${isNow ? "Now, " : ""}${dayName(shown.index, shown.time)} ${formatClock(shown.time)}, ${Math.round(shown.speed)} knots on average`}
                        className="absolute -inset-y-1.5 inset-x-0 w-full cursor-pointer opacity-0"
                    />
                </div>

                {/* Always there, so nothing shifts when it's needed; at now there's nowhere to go back to */}
                <button
                    type="button"
                    onClick={() => onChange(first)}
                    disabled={isNow}
                    aria-label="Back to now"
                    title="Back to now"
                    className="btn-icon size-7 rounded-md transition-opacity duration-150 disabled:opacity-30"
                >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                </button>

                <p className="w-14 shrink-0 text-right leading-tight" aria-hidden="true">
                    <span className="block text-[10px] text-zinc-500">{isNow ? "Now" : dayName(shown.index, shown.time)}</span>
                    <span className="block text-xs font-semibold tabular-nums text-zinc-100">{formatClock(shown.time)}</span>
                </p>

            </div>
        </div>
    );
};
