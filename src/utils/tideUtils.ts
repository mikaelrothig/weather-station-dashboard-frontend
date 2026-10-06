import { createTidePredictor } from "@neaps/tide-predictor";
import { SpotInfo } from "../api/types";

export interface TidePoint {
    time: number;
    /** Metres above chart datum (lowest astronomical tide), or above mean sea level when no datum is known */
    level: number;
}

export interface TideExtreme extends TidePoint {
    high: boolean;
}

export interface TidePrediction {
    timeline: TidePoint[];
    extremes: TideExtreme[];
    now: number;
    rising: boolean;
    datum: "LAT" | "MSL";
}

// A turning point less than this far from both neighbours is a wobble, not a tide
const MIN_TIDE_STEP_M = 0.15;

/**
 * The Dutch coast has a "double low water": the level dips, rises a few cm and dips again.
 * Tide tables report that as one low, so the wobble is folded into the deeper of the two lows.
 */
const mergeShallowExtremes = (extremes: TideExtreme[]): TideExtreme[] => {
    const result = [...extremes];
    for (let i = 1; i < result.length - 1; i++) {
        const [before, middle, after] = [result[i - 1], result[i], result[i + 1]];
        if (Math.abs(middle.level - before.level) < MIN_TIDE_STEP_M && Math.abs(middle.level - after.level) < MIN_TIDE_STEP_M) {
            const keepBefore = middle.high ? before.level <= after.level : before.level >= after.level;
            result.splice(i, 2, keepBefore ? before : after);
            result.splice(i - 1, 1);
            i -= 1;
        }
    }
    return result;
};

// Windguru's constituents are amplitudes in cm and phases in degrees relative to UTC.
// Checked against published tide tables: Cape Town within ~10 min and ~10 cm;
// Scheveningen within ~20–45 min and ~20 cm, so treat Dutch times as approximate.
export const predictTides = (spot: SpotInfo, start: Date, end: Date): TidePrediction | null => {
    if (!spot.tide) return null;

    const constituents = Object.entries(spot.tide).map(([name, [amplitude, phase]]) => ({ name, amplitude, phase }));
    const datumOffset = spot.tide_datums ? -spot.tide_datums.lat : 0;
    const predictor = createTidePredictor(constituents, { offset: datumOffset });
    const toMetres = (cm: number) => Math.round(cm) / 100;

    const timeline = predictor
        .getTimelinePrediction({ start, end, timeFidelity: 900 })
        .map((p) => ({ time: p.time.getTime(), level: toMetres(p.level) }));

    const extremes = mergeShallowExtremes(
        predictor
            .getExtremesPrediction({ start, end })
            .map((e) => ({ time: e.time.getTime(), level: toMetres(e.level), high: e.high })),
    );

    const now = new Date();
    const current = predictor.getWaterLevelAtTime({ time: now }).level;
    const soon = predictor.getWaterLevelAtTime({ time: new Date(now.getTime() + 10 * 60 * 1000) }).level;

    return {
        timeline,
        extremes,
        now: toMetres(current),
        rising: soon > current,
        datum: spot.tide_datums ? "LAT" : "MSL",
    };
};
