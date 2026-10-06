import { Forecast } from "../api/types";
import { atMinutesOfDay, getDayKey, parseClockMinutes, getZonedHour, startOfHour } from "./TimeUtils";
import { isInSector } from "./spotUtils";

const HOUR_MS = 60 * 60 * 1000;
const MIN_WINDOW_HOURS = 2;
/** Kite sizes the app works with: what riders can list as owned, and what it suggests without a list */
export const OWNABLE_KITE_SIZES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const KITE_SIZES = OWNABLE_KITE_SIZES;

// A kite works for roughly ±25% around its ideal wind; beyond that it's under- or overpowered
const MIN_FIT_RATIO = 0.8;
const MAX_FIT_RATIO = 1.25;

export type Experience = "beginner" | "intermediate" | "advanced";

export interface ExperienceProfile {
    label: string;
    minWind: number;
    maxWind: number;
    maxGust: number;
    /** Gust spread over the average that earns a "gusty" warning */
    gustyAt: number;
    /** Multiplier in the kite size rule; experienced riders hold more power, so they size up */
    sizeFactor: number;
}

export const EXPERIENCE_PROFILES: Record<Experience, ExperienceProfile> = {
    beginner: { label: "Beginner", minWind: 12, maxWind: 22, maxGust: 26, gustyAt: 6, sizeFactor: 2.0 },
    intermediate: { label: "Intermediate", minWind: 12, maxWind: 28, maxGust: 34, gustyAt: 8, sizeFactor: 2.2 },
    // Cape Town sessions regularly run at 35+ kn gusting around 40, so advanced riders keep going well past that
    advanced: { label: "Advanced", minWind: 11, maxWind: 40, maxGust: 48, gustyAt: 10, sizeFactor: 2.4 },
};

export interface KiteChoice {
    size: number;
    /** The size the rule of thumb asks for in this wind */
    ideal: number;
    /** "suggested" when the rider hasn't listed their kites, so any size goes */
    fit: "good" | "underpowered" | "overpowered" | "suggested";
}

export interface KitePlanStep {
    size: number;
    from: Date;
}

export interface KiteHour {
    time: Date;
    /** Hours this forecast point covers: 1 for hourly models, 3 for GFS beyond ~5 days */
    span: number;
    speed: number;
    gust: number;
    direction: number;
    offshore: boolean;
    past: boolean;
    kite: KiteChoice;
    kiteable: boolean;
}

export interface KiteWindow {
    start: Date;
    end: Date;
    hours: KiteHour[];
    /** Length in hours, which isn't the number of points once a model goes 3-hourly */
    duration: number;
    avgSpeed: number;
    minSpeed: number;
    maxSpeed: number;
    maxGust: number;
    direction: number;
    /** Kite to rig, and when to switch if the wind changes enough to need another one */
    plan: KitePlanStep[];
}

export interface KiteDay {
    key: string;
    date: Date;
    hours: KiteHour[];
    window: KiteWindow | null;
    reason: string | null;
}

// Mean of unit vectors, so 350° and 10° average to 0° rather than 180°
const meanDirection = (degrees: number[]): number => {
    const rad = Math.PI / 180;
    const x = degrees.reduce((sum, d) => sum + Math.cos(d * rad), 0);
    const y = degrees.reduce((sum, d) => sum + Math.sin(d * rad), 0);
    return ((Math.atan2(y, x) / rad) + 360) % 360;
};

const describeNoWindow = (hours: KiteHour[], profile: ExperienceProfile, quiver: number[]): string => {
    const upcoming = hours.filter((h) => !h.past);
    if (upcoming.length === 0) return "No daylight left";

    const maxSpeed = Math.max(...upcoming.map((h) => h.speed));
    if (maxSpeed < profile.minWind) return `Too light, max ${Math.round(maxSpeed)} kn`;

    const windy = upcoming.filter((h) => h.speed >= profile.minWind);
    if (windy.every((h) => h.offshore)) return "Wind is offshore";
    if (windy.filter((h) => h.offshore).length > windy.length / 2) return "Mostly offshore";
    if (windy.every((h) => h.speed > profile.maxWind || h.gust > profile.maxGust)) return "Too strong";

    // Rideable wind, but nothing in the rider's bag suits it
    const rideable = windy.filter((h) => !h.offshore && h.speed <= profile.maxWind && h.gust <= profile.maxGust);
    if (quiver.length > 0 && rideable.length > 0) {
        if (rideable.every((h) => h.kite.fit === "underpowered")) return `Too light for your ${Math.max(...quiver)} m²`;
        if (rideable.every((h) => h.kite.fit === "overpowered")) return `Too strong for your ${Math.min(...quiver)} m²`;
    }

    return "Only short gaps";
};

/** Splits the forecast into daylight days and finds the longest run of kiteable hours in each */
export const findKiteWindows = (
    forecast: Forecast,
    sunrise: string,
    sunset: string,
    offshore: [number, number],
    profile: ExperienceProfile,
    weight: number,
    quiver: number[],
    maxDays = 3,
): KiteDay[] => {
    const sunriseMinutes = parseClockMinutes(sunrise);
    const sunsetMinutes = parseClockMinutes(sunset);
    const currentHour = startOfHour();

    const days = new Map<string, KiteDay>();

    forecast.hours.forEach((point, i) => {
        const time = new Date(point.time);
        const next = forecast.hours[i + 1];
        const span = next === undefined ? 1 : Math.min(Math.max((Date.parse(next.time) - time.getTime()) / HOUR_MS, 1), 6);
        const startMinutes = getZonedHour(time) * 60;
        if (startMinutes < sunriseMinutes || startMinutes + 60 > sunsetMinutes + 15) return;

        const { speed, gust, direction } = point;
        const isOffshore = isInSector(direction, offshore);
        const past = time < currentHour;

        const key = getDayKey(time);
        if (!days.has(key)) days.set(key, { key, date: time, hours: [], window: null, reason: null });

        const kite = chooseKite(weight, speed, profile, quiver);
        const fits = kite.fit === "good" || kite.fit === "suggested";

        days.get(key)!.hours.push({
            time, span, speed, gust, direction, past, kite,
            offshore: isOffshore,
            kiteable: !past && !isOffshore && fits && speed >= profile.minWind && speed <= profile.maxWind && gust <= profile.maxGust,
        });
    });

    // Today stays until midnight (after dark it reads "No daylight left"), so the card keeps the same days all evening.
    // Later days need the model to cover most of their daylight, or a run that ends at 09:00 reads as "too light".
    const daylightHours = (sunsetMinutes - sunriseMinutes) / 60;
    const today = getDayKey(new Date());
    return [...days.values()]
        .filter((day) => day.key === today || (day.hours.some((h) => !h.past) && day.hours.reduce((sum, h) => sum + h.span, 0) >= daylightHours * 0.75))
        .slice(0, maxDays)
        .map((day) => {
            let best: KiteHour[] = [];
            let run: KiteHour[] = [];

            for (const hour of [...day.hours, null]) {
                if (hour?.kiteable) {
                    run.push(hour);
                    continue;
                }
                const avg = (hours: KiteHour[]) => hours.reduce((s, h) => s + h.speed, 0) / (hours.length || 1);
                const length = (hours: KiteHour[]) => hours.reduce((s, h) => s + h.span, 0);
                if (length(run) > length(best) || (length(run) === length(best) && avg(run) > avg(best))) best = run;
                run = [];
            }

            if (best.reduce((s, h) => s + h.span, 0) < MIN_WINDOW_HOURS) {
                return { ...day, reason: describeNoWindow(day.hours, profile, quiver) };
            }

            const speeds = best.map((h) => h.speed);
            // Forecast hours cover the hour that follows them, but nobody kites past sunset
            const last = best[best.length - 1];
            const lastHourEnd = new Date(last.time.getTime() + last.span * 60 * 60 * 1000);
            const sunsetTime = atMinutesOfDay(lastHourEnd, sunsetMinutes);
            const end = lastHourEnd > sunsetTime ? sunsetTime : lastHourEnd;

            return {
                ...day,
                window: {
                    start: best[0].time,
                    end,
                    hours: best,
                    duration: Math.round((end.getTime() - best[0].time.getTime()) / (60 * 60 * 1000)),
                    avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
                    minSpeed: Math.min(...speeds),
                    maxSpeed: Math.max(...speeds),
                    maxGust: Math.max(...best.map((h) => h.gust)),
                    direction: meanDirection(best.map((h) => h.direction)),
                    plan: best.reduce<KitePlanStep[]>((steps, h) => {
                        if (steps[steps.length - 1]?.size !== h.kite.size) steps.push({ size: h.kite.size, from: h.time });
                        return steps;
                    }, []),
                },
            };
        });
};

// Common rule of thumb for a twin-tip: size (m²) ≈ weight (kg) × 2.2 / wind (kn),
// with the 2.2 nudged down for beginners and up for advanced riders
const getIdealSize = (weightKg: number, windKnots: number, sizeFactor: number): number =>
    (weightKg * sizeFactor) / Math.max(windKnots, 1);

const closest = (sizes: number[], target: number): number =>
    // Compare ratios, not differences: 1 m² matters more on a 5 m² than on a 15 m²
    sizes.reduce((best, size) => (Math.abs(Math.log(size / target)) < Math.abs(Math.log(best / target)) ? size : best));

/** The kite to rig in this wind: from the rider's own kites when they've listed them, otherwise a suggested size */
export const chooseKite = (weightKg: number, windKnots: number, profile: ExperienceProfile, quiver: number[]): KiteChoice => {
    const ideal = getIdealSize(weightKg, windKnots, profile.sizeFactor);
    if (quiver.length === 0) return { size: closest(KITE_SIZES, ideal), ideal, fit: "suggested" };

    const size = closest(quiver, ideal);
    const ratio = size / ideal;
    const fit = ratio < MIN_FIT_RATIO ? "underpowered" : ratio > MAX_FIT_RATIO ? "overpowered" : "good";
    return { size, ideal, fit };
};

export const describeKites = (kites: number[]): string =>
    kites.length === 0 ? "No kites added" : kites.length <= 3 ? `${kites.join(", ")} m²` : `${kites.length} kites`;
