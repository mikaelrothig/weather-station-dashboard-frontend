import { useState } from "react";
import { ChevronDown, Share2 } from "lucide-react";
import { getWindBackgroundColor } from "../../utils/colorUtils";
import { getDegreesToCompass } from "../../utils/dataUtils";
import { getHourLabel } from "../../utils/timeUtils";
import { ForecastDay, getRelativeDayName } from "../../utils/forecastUtils";
import { DirectionArrow } from "./DirectionArrow";

interface ForecastDayListProps {
    days: ForecastDay[];
    showWaves: boolean;
    onShareDay?: (dayKey: string) => void;
}

// "Today"/"Tomorrow" read naturally mid-sentence in lower case; dated days ("Wed 7") stay as they are
const shareName = (name: string) => (name === "Today" || name === "Tomorrow" ? name.toLowerCase() : name);

// Phone layout: one row per hour reads top to bottom, days collapse to a one-line summary
export const ForecastDayList = ({ days, showWaves, onShareDay }: ForecastDayListProps) => {
    const [open, setOpen] = useState<Set<string>>(() => new Set(days.slice(0, 1).map((d) => d.key)));

    const toggle = (key: string) =>
        setOpen((previous) => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    const columns = showWaves
        ? "grid-cols-[2.5rem_2.5rem_2.5rem_minmax(0,1fr)_4.75rem_2rem]"
        : "grid-cols-[2.5rem_2.5rem_2.5rem_minmax(0,1fr)_2rem]";

    return (
        <div className="border-t border-white/[0.06]">
            {days.map((day) => {
                const isOpen = open.has(day.key);
                const daylight = day.hours.filter((h) => !h.night);
                const strip = daylight.length > 0 ? daylight : day.hours;
                const speeds = day.hours.map((h) => Math.round(h.speed));
                const regionId = `forecast-day-${day.key.replace(/\s+/g, "-")}`;

                return (
                    <section key={day.key} className="border-b border-white/[0.06] last:border-b-0">
                        <button
                            type="button"
                            onClick={() => toggle(day.key)}
                            aria-expanded={isOpen}
                            aria-controls={regionId}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-white/[0.03]"
                        >
                            <span className="w-24 shrink-0">
                                <span className="block text-sm font-medium text-zinc-100">{getRelativeDayName(day.hours[0].time)}</span>
                                <span className="block text-xs tabular-nums text-zinc-500">
                                    {Math.min(...speeds) === Math.max(...speeds) ? Math.max(...speeds) : `${Math.min(...speeds)}–${Math.max(...speeds)}`} kn
                                </span>
                            </span>
                            <span className="flex h-3 min-w-0 flex-1 gap-px overflow-hidden rounded-full" aria-hidden="true">
                                {strip.map((h) => (
                                    <span key={h.time.getTime()} className={`flex-1 ${getWindBackgroundColor(Math.round(h.speed))}`} />
                                ))}
                            </span>
                            <ChevronDown
                                className={`size-4 shrink-0 text-zinc-500 transition-transform duration-200 ease-out ${isOpen ? "rotate-180" : ""}`}
                                aria-hidden="true"
                            />
                        </button>

                        {isOpen && (
                            <div id={regionId} className="animate-fade pb-3">
                                <div className={`grid ${columns} gap-1.5 px-4 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500`}>
                                    <span>Time</span>
                                    <span className="text-center">Wind</span>
                                    <span className="text-center">Gust</span>
                                    <span>Dir</span>
                                    {showWaves && <span>Waves</span>}
                                    <span className="text-right">°C</span>
                                </div>
                                <ul>
                                    {day.hours.map((h) => (
                                        <li
                                            key={h.time.getTime()}
                                            className={`grid ${columns} items-center gap-1.5 px-4 py-0.5 ${h.night && !h.isNow ? "opacity-45" : ""}`}
                                        >
                                            <span className={`text-xs font-medium tabular-nums ${h.isNow ? "text-rose-300" : "text-zinc-400"}`}>
                                                {h.isNow ? "Now" : `${getHourLabel(h.time)}:00`}
                                            </span>
                                            <span className={`grid h-7 place-items-center rounded text-xs font-semibold tabular-nums text-zinc-950 ${getWindBackgroundColor(Math.round(h.speed))}`}>
                                                {Math.round(h.speed)}
                                            </span>
                                            <span className={`grid h-7 place-items-center rounded text-xs font-semibold tabular-nums text-zinc-950 ${getWindBackgroundColor(Math.round(h.gust))}`}>
                                                {Math.round(h.gust)}
                                            </span>
                                            <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-zinc-300">
                                                <DirectionArrow degrees={h.direction} className="size-3.5 shrink-0 fill-zinc-200 stroke-none" />
                                                {getDegreesToCompass(h.direction)}
                                            </span>
                                            {showWaves && (
                                                <span className="flex items-center gap-1 text-xs tabular-nums text-zinc-300">
                                                    {h.wave !== undefined ? (
                                                        <>
                                                            {h.waveDirection !== undefined && (
                                                                <DirectionArrow degrees={h.waveDirection} className="size-3 shrink-0 fill-sky-300 stroke-none" />
                                                            )}
                                                            {h.wave.toFixed(1)}m
                                                            <span className="text-zinc-500">{Math.round(h.wavePeriod ?? 0)}s</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-zinc-600">–</span>
                                                    )}
                                                </span>
                                            )}
                                            <span className="text-right text-xs tabular-nums text-zinc-400">{h.temp === null ? "–" : `${Math.round(h.temp)}°`}</span>
                                        </li>
                                    ))}
                                </ul>
                                {onShareDay && (
                                    <div className="px-4 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => onShareDay(day.key)}
                                            className="pressable flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] text-sm font-medium text-zinc-200 ring-1 ring-inset ring-white/[0.06] active:bg-white/[0.08]"
                                        >
                                            <Share2 className="size-4" aria-hidden="true" />
                                            Share {shareName(getRelativeDayName(day.hours[0].time))} as image
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
};
