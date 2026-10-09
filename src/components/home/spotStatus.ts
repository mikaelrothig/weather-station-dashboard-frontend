import { ForecastPoint, SpotSummary } from "../../api/types";
import { Spot } from "../../utils/spotUtils";
import { ExperienceProfile, findKiteWindows, KiteHour, KiteWindow } from "../../utils/kiteUtils";
import { formatClock } from "../../utils/timeUtils";
import outline from "./outline.json";

export interface SpotStatus {
    spot: Spot;
    /** The hour that's on right now */
    now: ForecastPoint;
    /** Today's kite window, or tomorrow's once today has none left */
    window: KiteWindow | null;
    windowDay: "Today" | "Tomorrow" | null;
    /** Why there's no window today, e.g. "Too light" */
    reason: string | null;
    /** "13:00–18:00" */
    windowLabel: string | null;
    /** Daylight hours of the window's day (or today's, without a window), for the hour strip; past ones are flagged */
    dayHours: KiteHour[];
}

/** A spot on the home page, with its wind when the summary has it */
export interface SpotEntry {
    spot: Spot;
    status: SpotStatus | null;
}

/** Links the map, the list and the best window: pointing at a spot in one lights it up in the others */
export interface SpotHover {
    hovered: string | null;
    onHover: (url: string | null) => void;
}

export const hoverProps = (url: string, onHover: SpotHover["onHover"]) => ({
    onPointerEnter: () => onHover(url),
    onPointerLeave: () => onHover(null),
    onFocus: () => onHover(url),
    onBlur: () => onHover(null),
});

interface Rider {
    profile: ExperienceProfile;
    weight: number;
    kites: number[];
}

export const getSpotStatus = (spot: Spot, summary: SpotSummary, rider: Rider): SpotStatus | null => {
    // The hours start at midnight; "now" is the last one that has begun
    const time = Date.now();
    const now = summary.hours.filter((h) => Date.parse(h.time) <= time).pop() ?? summary.hours[0];
    if (!now) return null;

    // Kite windows use the same rules (and the rider's own settings) as the spot page
    const [today, tomorrow] = findKiteWindows(summary, summary.sunrise, summary.sunset, spot.offshore, rider.profile, rider.weight, rider.kites, 2);
    const day = today?.window ? today : tomorrow?.window ? tomorrow : null;
    return {
        spot,
        now,
        window: day?.window ?? null,
        windowDay: day ? (day === today ? "Today" : "Tomorrow") : null,
        reason: today?.reason ?? null,
        windowLabel: day?.window ? `${formatClock(day.window.start)}–${formatClock(day.window.end)}` : null,
        dayHours: (day ?? today)?.hours ?? [],
    };
};

/** How good a spot's window is: today's beats any of tomorrow's, then the longest and windiest. -1 without one */
export const windowScore = (status: SpotStatus): number =>
    status.window ? (status.windowDay === "Today" ? 1e6 : 0) + status.window.duration * status.window.avgSpeed : -1;

/** The rider's best window anywhere: today's longest, windiest one, or tomorrow's once today has none */
export const pickBestWindow = (statuses: SpotStatus[]): SpotStatus | null =>
    statuses.reduce<SpotStatus | null>((best, s) => (s.window && (!best || windowScore(s) > windowScore(best)) ? s : best), null);

/** The spot with the most wind right now, for when there's no window anywhere */
export const pickWindiest = (statuses: SpotStatus[]): SpotStatus | null =>
    statuses.reduce<SpotStatus | null>((best, s) => (!best || s.now.speed > best.now.speed ? s : best), null);

/** Average wind over every spot, for the streaks drifting across the map */
export const averageWind = (statuses: SpotStatus[]): { speed: number; direction: number } => {
    const rad = Math.PI / 180;
    const x = statuses.reduce((sum, s) => sum + Math.cos(s.now.direction * rad) * s.now.speed, 0);
    const y = statuses.reduce((sum, s) => sum + Math.sin(s.now.direction * rad) * s.now.speed, 0);
    return {
        speed: statuses.reduce((sum, s) => sum + s.now.speed, 0) / (statuses.length || 1),
        direction: ((Math.atan2(y, x) / rad) + 360) % 360,
    };
};

// --- Coastline artwork -------------------------------------------------------------------------

/** The map's coastline (scripts/build-outline.mjs): [west, south, east, north] it frames, in degrees, and SVG paths */
export const OUTLINE = outline;

const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const [WEST, SOUTH, EAST, NORTH] = outline.bbox;

/** Where a spot sits on the map's artwork, as fractions of its width and height (same projection as the outline) */
export const projectSpot = ([lon, lat]: [number, number]) => ({
    x: (lon - WEST) / (EAST - WEST),
    y: (mercatorY(NORTH) - mercatorY(lat)) / (mercatorY(NORTH) - mercatorY(SOUTH)),
});
