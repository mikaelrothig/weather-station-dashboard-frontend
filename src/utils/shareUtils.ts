import { Forecast, SpotInfo, WaveForecast } from "../api/types";
import { buildForecastHours, ForecastHour, getRunLabel } from "./forecastUtils";
import { atMinutesOfDay, formatClock, formatDate } from "./TimeUtils";
import { predictTides, TideExtreme } from "./tideUtils";
import { getWetsuit } from "./conditionsUtils";
import { getDegreesToCompass } from "./DataUtils";

/**
 * One day of one forecast model, condensed for a share image. Deliberately nothing rider-specific
 * (no kite windows or sizes): the image goes to a group chat where everyone rides differently.
 */
export interface ShareDayData {
    spotName: string;
    region: string;
    dateLabel: string;
    fileSlug: string;
    modelName: string;
    runLabel: string;
    /** Daylight hours only, at the step the forecast table shows */
    hours: ForecastHour[];
    windRange: [number, number];
    maxGust: number;
    peak: { speed: number; time: Date };
    direction: number;
    waves: { height: number; period: number } | null;
    tides: TideExtreme[] | null;
    water: { celsius: number; wetsuit: string } | null;
    sunrise: string;
    sunset: string;
}

interface ShareInputs {
    dayKey: string;
    spotName: string;
    region: string;
    model: Forecast;
    /** Hours between columns, matching the forecast table (1 for high-res, 2 for GFS) */
    step: number;
    waves: WaveForecast | null;
    spotData: SpotInfo | null;
}

const HOUR_MS = 60 * 60 * 1000;

// Mean of unit vectors, so 350° and 10° average to 0° rather than 180°
const meanDirection = (degrees: number[]): number => {
    const rad = Math.PI / 180;
    const x = degrees.reduce((sum, d) => sum + Math.cos(d * rad), 0);
    const y = degrees.reduce((sum, d) => sum + Math.sin(d * rad), 0);
    return ((Math.atan2(y, x) / rad) + 360) % 360;
};

export const buildShareDay = ({ dayKey, spotName, region, model, step, waves, spotData }: ShareInputs): ShareDayData | null => {
    const allHours = buildForecastHours(model, waves, step).filter((h) => h.dayKey === dayKey);
    // Daylight is what matters for a session; a night-only day (e.g. late tonight) still shows what's left
    const hours = allHours.some((h) => !h.night) ? allHours.filter((h) => !h.night) : allHours;
    if (hours.length === 0) return null;

    const first = hours[0].time;
    const speeds = hours.map((h) => h.speed);
    const peakHour = hours.reduce((best, h) => (h.speed > best.speed ? h : best));
    const waveHours = hours.filter((h) => h.wave !== undefined);
    const peakWave = waveHours.reduce<ForecastHour | null>((best, h) => (!best || h.wave! > best.wave! ? h : best), null);

    const dayStart = atMinutesOfDay(first, 0);
    const tides = spotData ? predictTides(spotData, dayStart, new Date(dayStart.getTime() + 24 * HOUR_MS))?.extremes ?? null : null;
    const sst = spotData?.sst;

    return {
        spotName,
        region,
        dateLabel: formatDate(first, { weekday: "long", day: "numeric", month: "long" }),
        fileSlug: `${spotName}-${formatDate(first, { weekday: "short", day: "numeric", month: "short" })}`
            .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        modelName: model.model.name,
        runLabel: getRunLabel(model.model),
        hours,
        windRange: [Math.min(...speeds), Math.max(...speeds)],
        maxGust: Math.max(...hours.map((h) => h.gust)),
        peak: { speed: peakHour.speed, time: peakHour.time },
        direction: meanDirection(hours.map((h) => h.direction)),
        waves: peakWave ? { height: peakWave.wave!, period: peakWave.wavePeriod ?? 0 } : null,
        tides,
        water: sst != null ? { celsius: sst, wetsuit: getWetsuit(sst) } : null,
        sunrise: model.sunrise,
        sunset: model.sunset,
    };
};

/** The line that goes with the image in the share sheet or chat */
export const getShareText = (data: ShareDayData): string =>
    `${data.spotName}, ${data.dateLabel}: ${Math.round(data.windRange[0])}–${Math.round(data.windRange[1])} kn, ` +
    `gusts ${Math.round(data.maxGust)}, ${getDegreesToCompass(data.direction)}, peak at ${formatClock(data.peak.time)} (${data.modelName})`;
