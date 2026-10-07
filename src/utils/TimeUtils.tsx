import { TIME_ZONE } from "../config/spots";

// --- Spot-local time ------------------------------------------------------------------------
// All clock times, days and daylight logic follow South African time rather than the viewer's device,
// so planning a trip from abroad shows the times you'll kite at.

const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
});

const getParts = (date: Date) => {
    const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour) % 24,
        minute: Number(parts.minute),
        weekday: parts.weekday,
    };
};

export const getZonedHour = (date: Date): number => getParts(date).hour;

/** Minutes since midnight at the spot */
export const getMinutesOfDay = (date: Date): number => {
    const { hour, minute } = getParts(date);
    return hour * 60 + minute;
};

/** The same spot-local day as `date`, at a wall-clock time given in minutes since midnight */
export const atMinutesOfDay = (date: Date, minutes: number): Date => {
    const sameMinute = new Date(date);
    sameMinute.setUTCSeconds(0, 0);
    return new Date(sameMinute.getTime() + (minutes - getMinutesOfDay(date)) * 60 * 1000);
};

/** Start of the current hour. South African time is a whole-hour offset, so UTC hour boundaries line up. */
export const startOfHour = (date = new Date()): Date => {
    const start = new Date(date);
    start.setUTCMinutes(0, 0, 0);
    return start;
};

export const formatClock = (date: Date | number): string =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });

export const formatDate = (date: Date | number, options: Intl.DateTimeFormatOptions): string =>
    new Date(date).toLocaleDateString([], { ...options, timeZone: TIME_ZONE });

/** True when the viewer's device clock currently reads the same as the spot's */
export const isDeviceOnSpotTime = (date = new Date()): boolean =>
    date.toLocaleString("en-US", { timeZone: deviceTimeZone }) === date.toLocaleString("en-US", { timeZone: TIME_ZONE });

export const getDayKey = (date: Date): string => {
    const { year, month, day } = getParts(date);
    return `${year}-${month}-${day}`;
};

export const getDayLabel = (date: Date): string => {
    const { weekday, day } = getParts(date);
    return `${weekday} ${day}`;
};

export const getHourLabel = (date: Date): string => getParts(date).hour.toString().padStart(2, "0");

// "07:37" -> minutes since midnight
export const parseClockMinutes = (value: string): number => {
    const [h, m] = String(value).split(":").map((n) => parseInt(n, 10));
    return (h || 0) * 60 + (m || 0);
};

export const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
};
