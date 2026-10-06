import { Forecast, ModelRun, WaveForecast } from "../api/types";
import { getDayKey, getDayLabel, getZonedHour, parseClockMinutes, startOfHour } from "./TimeUtils";

export interface ForecastHour {
    time: Date;
    dayKey: string;
    speed: number;
    gust: number;
    direction: number;
    temp: number | null;
    night: boolean;
    isNow: boolean;
    wave?: number;
    wavePeriod?: number;
    waveDirection?: number;
}

export interface ForecastDay {
    key: string;
    label: string;
    hours: ForecastHour[];
}

const HOUR_MS = 60 * 60 * 1000;

/** "06 UTC run": model runs are named by their start hour in UTC */
export const getRunLabel = (model: ModelRun): string => `${String(new Date(model.runAt).getUTCHours()).padStart(2, "0")} UTC run`;

/** The point closest to now, e.g. for "current" air temperature */
export const getNearestPoint = <T extends { time: string }>(points: T[], now = Date.now()): T | null =>
    points.reduce<T | null>((nearest, point) =>
        !nearest || Math.abs(Date.parse(point.time) - now) < Math.abs(Date.parse(nearest.time) - now) ? point : nearest, null);

/**
 * Flattens a model run into future hours, joined with wave data by timestamp.
 * `minStep` thins long runs (GFS) so the table stays readable; gaps wider than it are kept as-is.
 */
export const buildForecastHours = (model: Forecast, waves: WaveForecast | null, minStep = 1): ForecastHour[] => {
    const sunrise = parseClockMinutes(model.sunrise);
    const sunset = parseClockMinutes(model.sunset);
    const wavesByTime = new Map(waves?.hours.map((w) => [Date.parse(w.time), w]));

    const currentHour = startOfHour();

    const result: ForecastHour[] = [];
    let lastTime = -Infinity;

    for (const point of model.hours) {
        const time = new Date(point.time);
        // Start at the current hour; anything earlier in the run is history
        if (time < currentHour) continue;
        const isNow = time.getTime() === currentHour.getTime();
        const gap = time.getTime() - lastTime;
        // Thin to clock-aligned steps (00, 02, 04…), but keep "now" and any wider gaps the model already has
        const onGrid = getZonedHour(time) % minStep === 0 || gap > minStep * HOUR_MS;
        if (!isNow && (!onGrid || gap < HOUR_MS)) continue;
        lastTime = time.getTime();

        const minutes = getZonedHour(time) * 60;
        const wave = wavesByTime.get(time.getTime());

        result.push({
            time,
            dayKey: getDayKey(time),
            speed: point.speed,
            gust: point.gust,
            direction: point.direction,
            temp: point.temperature,
            night: minutes + 60 <= sunrise || minutes >= sunset,
            isNow,
            wave: wave?.height ?? undefined,
            wavePeriod: wave?.period ?? undefined,
            waveDirection: wave?.direction ?? undefined,
        });
    }

    return result;
};

export const groupByDay = (hours: ForecastHour[]): ForecastDay[] => {
    const days: ForecastDay[] = [];
    for (const hour of hours) {
        const last = days[days.length - 1];
        if (last?.key === hour.dayKey) last.hours.push(hour);
        else days.push({ key: hour.dayKey, label: getDayLabel(hour.time), hours: [hour] });
    }
    return days;
};

export const getRelativeDayName = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * HOUR_MS);
    if (getDayKey(date) === getDayKey(today)) return "Today";
    if (getDayKey(date) === getDayKey(tomorrow)) return "Tomorrow";
    // Include the date: a 16-day run repeats weekday names
    return getDayLabel(date);
};
