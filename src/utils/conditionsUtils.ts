import { Forecast, LiveReading } from "../api/types";
import { getNearestPoint } from "./forecastUtils";
import { formatClock, formatDuration, getMinutesOfDay, parseClockMinutes } from "./timeUtils";
import { isInSector } from "./spotUtils";

const MINUTE_MS = 60 * 1000;
export const LIVE_STALE_AFTER_MINUTES = 20;

export const getReadingTime = (reading: LiveReading): Date => new Date(reading.time);

/** The reading's clock time at the spot */
export const formatReadingTime = (reading: LiveReading): string => formatClock(getReadingTime(reading));

export const getMinutesSince = (date: Date, now = Date.now()): number => Math.max(0, (now - date.getTime()) / MINUTE_MS);

export interface CurrentWind {
    speed: number;
    gust: number;
    /** null when the station can't name one, in calm conditions */
    direction: number | null;
    source: "live" | "forecast";
    time: Date;
}

/** Prefers a fresh station reading and falls back to the forecast for the current hour */
export const getCurrentWind = (live: LiveReading[] | null | undefined, forecast: Forecast | null): CurrentWind | null => {
    const latest = live?.[0];
    if (latest && getMinutesSince(getReadingTime(latest)) <= LIVE_STALE_AFTER_MINUTES) {
        return {
            speed: latest.speed,
            gust: latest.gust,
            direction: latest.direction,
            source: "live",
            time: getReadingTime(latest),
        };
    }

    const point = forecast && getNearestPoint(forecast.hours);
    if (!point) return null;
    return {
        speed: point.speed,
        gust: point.gust,
        direction: point.direction,
        source: "forecast",
        time: new Date(),
    };
};

export type ShoreRelation = "onshore" | "side-shore" | "offshore";

export const getShoreRelation = (direction: number, offshore: [number, number]): ShoreRelation => {
    if (isInSector(direction, offshore)) return "offshore";
    const onshore: [number, number] = [(offshore[0] + 180) % 360, (offshore[1] + 180) % 360];
    return isInSector(direction, onshore) ? "onshore" : "side-shore";
};

export interface Daylight {
    sunrise: string;
    sunset: string;
    /** Minutes of light left today, 0 once the sun is down */
    minutesLeft: number;
    status: string;
}

export const getDaylight = (sunrise: string, sunset: string, now = new Date()): Daylight => {
    const rise = parseClockMinutes(sunrise);
    const set = parseClockMinutes(sunset);
    const current = getMinutesOfDay(now);

    if (current < rise) {
        return { sunrise, sunset, minutesLeft: 0, status: `Sunrise in ${formatDuration(rise - current)}` };
    }
    if (current < set) {
        return { sunrise, sunset, minutesLeft: set - current, status: `${formatDuration(set - current)} of light left` };
    }
    return { sunrise, sunset, minutesLeft: 0, status: "After sunset" };
};

export const getWetsuit = (celsius: number): string => {
    if (celsius >= 23) return "Boardshorts or lycra";
    if (celsius >= 20) return "Shorty or 3/2 mm";
    if (celsius >= 17) return "3/2 mm wetsuit";
    if (celsius >= 14) return "4/3 mm wetsuit";
    if (celsius >= 11) return "5/4 mm, boots";
    return "5/4 mm, boots and hood";
};
