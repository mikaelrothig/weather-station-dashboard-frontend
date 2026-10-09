import { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { getDegreesToCompass } from "../../utils/dataUtils";
import { formatClock } from "../../utils/timeUtils";
import { chooseKite, ExperienceProfile, KiteHour, KiteWindow, windRange } from "../../utils/kiteUtils";
import { DirectionArrow } from "./DirectionArrow";
import { WindStrip } from "./WindStrip";

interface KiteWindowDetailsProps {
    /** The line above the times, e.g. the day name and a "Best" badge */
    label: ReactNode;
    window: KiteWindow;
    /** The day's daylight hours, for the strip */
    hours: KiteHour[];
    weight: number;
    profile: ExperienceProfile;
    /** Clock times; pass one bound to the spot's timezone when several are on screen */
    formatTime?: (date: Date) => string;
}

/**
 * A kite window laid out the same way everywhere: when and what to rig first, the day's strip, the wind in the
 * window, then any kite switches or a gust warning. Used by the spot page's Kite windows card and the home page.
 */
export const KiteWindowDetails = ({ label, window, hours, weight, profile, formatTime = formatClock }: KiteWindowDetailsProps) => {
    // With the rider's kites: lead with the one you rig first, and list switches as the wind changes.
    // Without them: one suggested size for the average wind plus the range, since every 1 m² step isn't a real switch.
    const suggestedOnly = window.hours[0]?.kite.fit === "suggested";
    const plan = window.plan;
    const mainKite = suggestedOnly ? chooseKite(weight, window.avgSpeed, profile, []).size : plan[0].size;
    const switches = suggestedOnly ? [] : plan.slice(1, 3);
    const sizes = window.hours.map((h) => h.kite.size);
    const range = suggestedOnly && Math.min(...sizes) !== Math.max(...sizes) ? `${Math.min(...sizes)}–${Math.max(...sizes)} m²` : null;
    const gusty = window.maxGust - window.avgSpeed >= profile.gustyAt;

    return (
        <>
            {/* The answer first: when, and what to rig */}
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">{label}</div>
                    <h3 className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-semibold tabular-nums tracking-tight text-zinc-50">
                            {formatTime(window.start)}–{formatTime(window.end)}
                        </span>
                        <span className="text-xs text-zinc-500">{window.duration}h</span>
                    </h3>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-[11px] text-zinc-500">{suggestedOnly ? "Suggested" : "Your kite"}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-50">{mainKite} m²</p>
                </div>
            </header>

            <WindStrip hours={hours} window={window} formatTime={formatTime} />

            {/* Phones: one line. Desktop: the labelled breakdown for planning. */}
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-400 md:hidden">
                <span className="font-medium tabular-nums text-zinc-100">{windRange(window.minSpeed, window.maxSpeed)} kn</span>
                · gusts <span className="font-medium tabular-nums text-zinc-100">{Math.round(window.maxGust)}</span>
                ·
                <DirectionArrow degrees={window.direction} className="size-3 fill-zinc-300 stroke-none" />
                <span className="font-medium text-zinc-100">{getDegreesToCompass(window.direction)}</span>
            </p>
            <dl className="hidden grid-cols-3 gap-2 text-xs md:grid">
                <div>
                    <dt className="text-zinc-500">Wind</dt>
                    <dd className="font-medium tabular-nums text-zinc-100">{windRange(window.minSpeed, window.maxSpeed)} kn</dd>
                </div>
                <div>
                    <dt className="text-zinc-500">Gusts</dt>
                    <dd className="font-medium tabular-nums text-zinc-100">{Math.round(window.maxGust)} kn</dd>
                </div>
                <div>
                    <dt className="text-zinc-500">Direction</dt>
                    <dd className="flex items-center gap-1 font-medium text-zinc-100">
                        <DirectionArrow degrees={window.direction} className="size-3 fill-zinc-300 stroke-none" />
                        {getDegreesToCompass(window.direction)}
                    </dd>
                </div>
            </dl>

            {(switches.length > 0 || range || gusty) && (
                <ul className="space-y-1 border-t border-white/[0.06] pt-2.5 text-[11px] text-zinc-400">
                    {range && <li>Size range over the window: <span className="font-medium tabular-nums text-zinc-200">{range}</span></li>}
                    {switches.map((step) => (
                        <li key={step.from.getTime()}>
                            Switch to <span className="font-medium tabular-nums text-zinc-200">{step.size} m²</span> at{" "}
                            <span className="tabular-nums">{formatTime(step.from)}</span>
                        </li>
                    ))}
                    {gusty && (
                        <li className="flex items-center gap-1.5 text-amber-300">
                            <TriangleAlert className="size-3 shrink-0" aria-hidden="true" />
                            Gusty, consider sizing down
                        </li>
                    )}
                </ul>
            )}
        </>
    );
};
