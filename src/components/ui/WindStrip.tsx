import { getWindBackgroundColor } from "../../utils/colorUtils";
import { getDegreesToCompass } from "../../utils/dataUtils";
import { formatClock } from "../../utils/timeUtils";
import { KiteHour, KiteWindow } from "../../utils/kiteUtils";

interface WindStripProps {
    /** One day's daylight hours */
    hours: KiteHour[];
    /** Lit up at full colour; without one the strip is drawn thin, as a quiet day */
    window: KiteWindow | null;
    /** Clock times for the labels and tooltips; pass one bound to the spot's timezone when several are on screen */
    formatTime?: (date: Date) => string;
}

/**
 * A day's wind as a row of hours in the wind colours: the kite window at full strength, the rest of the day faded,
 * hours already gone fainter still. Shared by the spot page's Kite windows card and the home page.
 */
export const WindStrip = ({ hours, window, formatTime = formatClock }: WindStripProps) => {
    if (hours.length === 0) return null;
    const inWindow = (time: Date) => !!window && time >= window.start && time < window.end;
    const last = hours[hours.length - 1];

    return (
        <div>
            <div className={`flex gap-px ${window ? "h-5" : "h-2.5"}`} aria-hidden="true">
                {hours.map((hour) => (
                    <div
                        key={hour.time.getTime()}
                        title={`${formatTime(hour.time)} · ${Math.round(hour.speed)} kn ${getDegreesToCompass(hour.direction)}${hour.offshore ? " (offshore)" : ""}`}
                        className={`flex-1 first:rounded-l-md last:rounded-r-md ${getWindBackgroundColor(Math.round(hour.speed))} ${
                            hour.past ? "opacity-10" : inWindow(hour.time) ? "" : "opacity-25"
                        }`}
                    />
                ))}
            </div>
            {window && (
                <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-500">
                    <span>{formatTime(hours[0].time)}</span>
                    <span>{formatTime(new Date(last.time.getTime() + 60 * 60 * 1000))}</span>
                </div>
            )}
        </div>
    );
};
