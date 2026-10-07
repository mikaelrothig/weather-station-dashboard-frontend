/*
 * The backend's response format, the same whichever provider supplies the data.
 * Units: knots, degrees the wind or swell comes from, °C, metres, seconds. Times are ISO 8601.
 * Mirrors api/providers/types.ts in weather-station-dashboard-backend.
 */

/** hires: the region's high-resolution model · global: the long-range model */
export type ForecastKind = "hires" | "global";

export interface ModelRun {
    /** Short model name for display, e.g. "WRF 9 km" */
    name: string;
    /** When the run started */
    runAt: string;
    /** When the provider published this run, and when it expects the next; null if it doesn't say */
    updatedAt: string | null;
    nextUpdateAt: string | null;
}

export interface ForecastPoint {
    time: string;
    speed: number;
    gust: number;
    direction: number;
    temperature: number | null;
}

export interface Forecast {
    model: ModelRun;
    /** The model grid point the forecast is for */
    location: { lat: number; lon: number };
    /** Spot-local clock times, "HH:MM" */
    sunrise: string;
    sunset: string;
    /** In time order. Steps can widen further out, e.g. 3-hourly beyond five days */
    hours: ForecastPoint[];
}

export interface WavePoint {
    time: string;
    height: number | null;
    period: number | null;
    direction: number | null;
}

export interface WaveForecast {
    model: ModelRun;
    hours: WavePoint[];
}

export interface TideDatums {
    msl: number;
    lat: number;
    mhw: number;
    mlw: number;
}

/** Spot data that doesn't depend on a model run */
export interface SpotInfo {
    tz: string;
    /** Sea surface temperature in °C */
    sst: number | null;
    /** Spot-local clock times, "HH:MM" */
    sunrise: string;
    sunset: string;
    /** Harmonic constituents: name -> [amplitude (cm), phase (deg, UTC)] */
    tide: Record<string, [number, number]> | null;
    /** Datums in cm */
    tide_datums: TideDatums | null;
}

export type LiveInterval = "1min" | "15min";

/** One station reading, averaged over the interval */
export interface LiveReading {
    time: string;
    /** Average, strongest and lightest wind over the interval */
    speed: number;
    gust: number;
    lull: number;
    /** null when the station can't name a direction, which happens in calm conditions */
    direction: number | null;
}

/** One spot's wind for the home page: hourly from the start of today to the end of tomorrow, spot time */
export interface SpotSummary {
    /** The spot's URL name, e.g. "mistycliffs" (see getSpotSlug) */
    spot: string;
    /** Name of the high-resolution model the hours come from */
    model: string;
    /** Spot-local clock times, "HH:MM" */
    sunrise: string;
    sunset: string;
    hours: ForecastPoint[];
}

/** A spot whose forecast couldn't be loaded; the rest of the summary still comes back */
export interface SpotSummaryError {
    spot: string;
    error: string;
}

/** GET /summary: every spot at once, so the home page needs one small request instead of one forecast per spot */
export interface Summary {
    spots: (SpotSummary | SpotSummaryError)[];
}
