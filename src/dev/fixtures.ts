import type { Forecast, ForecastPoint, LiveReading, SpotInfo, Summary, WaveForecast } from "../api/types";

/**
 * Dev-only data scenarios for stress-testing the UI without calling the backend.
 * Add ?data=showcase | demo | storm | calm | glassy | worst to any URL. Never included in production builds:
 * the only calls are behind `import.meta.env.DEV`, which Vite strips from the bundle.
 */

export const SCENARIOS = ["showcase", "demo", "storm", "calm", "glassy", "worst"] as const;
export type Scenario = (typeof SCENARIOS)[number];

const HOUR_MS = 60 * 60 * 1000;

interface ScenarioShape {
    /** Wind speed by hour index: base + diurnal sea breeze peaking mid-afternoon */
    base: number;
    breeze: number;
    gustSpread: number;
    direction: number;
    directionWobble: number;
    waves: number | null;
    period: number;
    airTemp: number;
    sst: number | null;
    tide: boolean;
    /** Minutes since the latest station reading; large values make the live data stale */
    liveAgeMinutes: number;
    /** Latest reading's direction in degrees; null is a station that can't name one (calm) */
    liveDirection: number | null;
    /** Extra knots from this many hours into the forecast: a quiet few days, then the wind arrives */
    buildsAfter?: { hours: number; knots: number };
    /** Wind by time of day; forecast hours and live readings both follow it, so they agree */
    curve?: (time: Date) => number;
}

// South African clock helpers for the curves (the showcase is at Blouberg)
const sastHour = (time: Date) => (((time.getTime() / HOUR_MS + 2) % 24) + 24) % 24;
const sastDay = (time: Date) => Math.floor((time.getTime() / HOUR_MS + 2) / 24);
const smoothstep = (x: number) => {
    const t = Math.min(Math.max(x, 0), 1);
    return t * t * (3 - 2 * t);
};

/**
 * A perfect Blouberg day: a south-easter that builds from ~10 kn in the morning to ~30 kn by late afternoon,
 * then eases after sunset. The next days are good but lighter, so the kite windows have something to compare.
 */
const perfectDay = (time: Date) => {
    const offset = sastDay(time) - sastDay(new Date());
    const peak = [30, 30, 20][offset] ?? 13 + (Math.abs(offset) % 3) * 4;
    const hour = sastHour(time);
    if (hour < 7.5) return 9;
    if (hour < 17) return 10 + (peak - 10) * smoothstep((hour - 7.5) / 9.5);
    if (hour < 19) return peak - (hour - 17) * 0.8;
    return peak - 1.6 - (peak - 13) * smoothstep((hour - 19) / 5);
};

const SHAPES: Record<Scenario, ScenarioShape> = {
    // For screenshots: Blouberg at its best, everything present and consistent
    showcase: { base: 0, breeze: 0, gustSpread: 6, direction: 155, directionWobble: 6, waves: 1.4, period: 12, airTemp: 22, sst: 15, tide: true, liveAgeMinutes: 1, liveDirection: 157.5, curve: perfectDay },
    // A normal Cape Town south-easter afternoon
    demo: { base: 10, breeze: 12, gustSpread: 6, direction: 150, directionWobble: 15, waves: 1.6, period: 11, airTemp: 21, sst: 14, tide: true, liveAgeMinutes: 2, liveDirection: 157.5 },
    // Full-on Cape Doctor: 35+ kn gusting mid-40s, big swell
    storm: { base: 28, breeze: 12, gustSpread: 9, direction: 145, directionWobble: 8, waves: 4.2, period: 14, airTemp: 24, sst: 12, tide: true, liveAgeMinutes: 1, liveDirection: 135 },
    // Windless for three days, variable direction the station can't name, then a south-easter fills in
    calm: { base: 1, breeze: 4, gustSpread: 2, direction: 150, directionWobble: 20, waves: null, period: 0, airTemp: 16, sst: 9, tide: true, liveAgeMinutes: 3, liveDirection: null, buildsAfter: { hours: 108, knots: 13 } },
    // Flat for the whole 16-day outlook
    glassy: { base: 1, breeze: 3, gustSpread: 2, direction: 270, directionWobble: 120, waves: null, period: 0, airTemp: 15, sst: 10, tide: true, liveAgeMinutes: 4, liveDirection: null },
    // Partial and awkward data: stale live readings, no tide, no sea temp, freezing air, offshore wind
    worst: { base: 14, breeze: 10, gustSpread: 14, direction: 80, directionWobble: 40, waves: null, period: 0, airTemp: -3, sst: null, tide: false, liveAgeMinutes: 135, liveDirection: 67.5 },
};

// Blouberg's main tidal constituents (amplitude cm, phase deg) from Windguru, enough for a realistic curve
const TIDE: Record<string, [number, number]> = {
    M2: [50.37, 33.4], S2: [22.19, 53.39], N2: [11.13, 25.56], K2: [6.16, 50.96], K1: [5.75, 108.7],
    O1: [1.56, -128.4], P1: [1.46, 103.96], Q1: [0.94, -140.81], M4: [0.43, 45.57], MS4: [0.29, 128.81],
    MU2: [1.91, 9.66], NU2: [1.99, 25.43], "2N2": [1.68, 5.25], L2: [1.31, 36.35], T2: [1.34, 50.22],
};
const TIDE_DATUMS = { msl: 0, mhw: 54.23, mlw: -53.52, mhhw: 58.84, mllw: -57.14, lat: -96.55, hat: 101.48, mtl: 0.36 };

// Deterministic noise so a scenario looks the same on every reload
const noise = (i: number) => Math.sin(i * 12.9898) * 0.5 + Math.sin(i * 4.1414) * 0.5;

const windAt = (shape: ScenarioShape, time: Date, i: number) => {
    // South African hour drives the sea breeze; close enough for every spot in a fixture
    const hour = (time.getUTCHours() + 2) % 24;
    const breeze = Math.max(0, Math.sin(((hour - 9) / 12) * Math.PI)) * shape.breeze;
    const day = Math.floor(i / 24);
    const build = shape.buildsAfter && i >= shape.buildsAfter.hours ? shape.buildsAfter.knots : 0;
    // Curves key their small wobble on the clock (15-minute steps), so the station and forecast match up
    const speed = shape.curve
        ? Math.max(0, shape.curve(time) + noise(Math.floor(time.getTime() / (15 * 60 * 1000))) * 1.2)
        : Math.max(0, shape.base + breeze + build + noise(i) * 2 - (day === 2 ? 6 : 0));
    return {
        speed: Math.round(speed * 10) / 10,
        gust: Math.round((speed + shape.gustSpread * (0.6 + 0.4 * Math.abs(noise(i + 7)))) * 10) / 10,
        direction: (shape.direction + noise(i + 3) * shape.directionWobble + 360) % 360,
    };
};

// Start from the latest 6-hourly run before now, like a real model
const latestRun = () => new Date(Math.floor(Date.now() / (6 * HOUR_MS)) * 6 * HOUR_MS - 6 * HOUR_MS);

const modelRun = (shape: ScenarioShape, name: string, runAt: Date) => ({
    name,
    runAt: runAt.toISOString(),
    updatedAt: new Date(runAt.getTime() + 5 * HOUR_MS).toISOString(),
    // "worst" pretends the next run is two hours overdue
    nextUpdateAt: new Date(shape === SHAPES.worst ? runAt.getTime() + 4 * HOUR_MS : Date.now() + 2 * HOUR_MS).toISOString(),
});

// Like the real models: WRF hourly for 78h; GFS hourly to 120h, then 3-hourly out to 16 days
const runOffsets = (model: "hires" | "global") => model === "hires"
    ? Array.from({ length: 79 }, (_, i) => i)
    : [...Array.from({ length: 121 }, (_, i) => i), ...Array.from({ length: 88 }, (_, i) => 123 + i * 3)];

const buildForecast = (shape: ScenarioShape, model: "hires" | "global"): Forecast => {
    const runAt = latestRun();
    return {
        model: modelRun(shape, model === "hires" ? "WRF 9 km" : "GFS 13 km", runAt),
        location: { lat: -33.82, lon: 18.47 },
        sunrise: "06:20",
        sunset: "18:48",
        hours: runOffsets(model).map((h) => {
            const time = new Date(runAt.getTime() + h * HOUR_MS);
            return {
                time: time.toISOString(),
                ...windAt(shape, time, h),
                temperature: Math.round((shape.airTemp + Math.sin(((h % 24) - 6) / 24 * 2 * Math.PI) * 4) * 10) / 10,
            };
        }),
    };
};

const buildWaves = (shape: ScenarioShape): WaveForecast | null => {
    if (shape.waves === null) return null;
    const runAt = latestRun();
    return {
        model: modelRun(shape, "GFS-Wave 25 km", runAt),
        hours: runOffsets("global").map((h) => ({
            time: new Date(runAt.getTime() + h * HOUR_MS).toISOString(),
            height: Math.round((shape.waves! + noise(h) * 0.4) * 10) / 10,
            period: Math.round(shape.period + noise(h + 2) * 1.5),
            direction: (230 + noise(h + 5) * 10 + 360) % 360,
        })),
    };
};

const buildLive = (shape: ScenarioShape, stepMinutes: 1 | 15): LiveReading[] => {
    const count = stepMinutes === 1 ? 60 : 48;
    const latest = Date.now() - shape.liveAgeMinutes * 60 * 1000;
    return Array.from({ length: count }, (_, i) => {
        const time = new Date(Math.floor(latest / (stepMinutes * 60000)) * stepMinutes * 60000 - i * stepMinutes * 60000);
        // Negative indexes: the station's past readings never pick up the forecast's later wind build
        const wind = windAt(shape, time, -1 - i);
        return {
            time: time.toISOString(),
            speed: Math.round(wind.speed * 10) / 10,
            gust: Math.round(wind.gust * 10) / 10,
            lull: Math.round(Math.max(0, wind.speed - shape.gustSpread * 0.6) * 10) / 10,
            // The latest reading uses the scenario's direction; a calm station names none at all
            direction: i === 0 || shape.liveDirection === null ? shape.liveDirection : Math.round(wind.direction),
        };
    });
};

const spotInfo = (shape: ScenarioShape): SpotInfo => ({
    tz: "Africa/Johannesburg",
    sst: shape.sst,
    sunrise: "06:20",
    sunset: "18:48",
    tide: shape.tide ? TIDE : null,
    tide_datums: shape.tide ? TIDE_DATUMS : null,
});

// --- Home page summary ---------------------------------------------------------------------------

/** Each spot's own character, so the home page has a real mix: a nuking peninsula, a lagoon in the teens, a light town */
const SPOT_WINDS: Record<string, { morning: number; peak: number; peakAt: number; direction: number; gustSpread: number }> = {
    blouberg: { morning: 9, peak: 26, peakAt: 15, direction: 155, gustSpread: 7 },
    melkbos: { morning: 9, peak: 24, peakAt: 15, direction: 160, gustSpread: 6 },
    langebaan: { morning: 6, peak: 19, peakAt: 14, direction: 170, gustSpread: 5 },
    mistycliffs: { morning: 14, peak: 34, peakAt: 14, direction: 140, gustSpread: 12 },
    hermanus: { morning: 4, peak: 11, peakAt: 15, direction: 120, gustSpread: 4 },
    witsand: { morning: 7, peak: 17, peakAt: 16, direction: 95, gustSpread: 5 },
};

// How hard each scenario blows across the board
const SUMMARY_SCALE: Record<Scenario, number> = { showcase: 1, demo: 1, storm: 1.4, calm: 0.35, glassy: 0.15, worst: 1 };

const buildSummary = (scenario: Scenario): Summary => {
    const scale = SUMMARY_SCALE[scenario];
    // Today and tomorrow from midnight in South Africa (UTC+2), like the real summary
    const midnight = Math.floor((Date.now() + 2 * HOUR_MS) / (24 * HOUR_MS)) * 24 * HOUR_MS - 2 * HOUR_MS;

    return {
        spots: Object.entries(SPOT_WINDS).map(([spot, w], s) => {
            // "worst": one spot without a forecast
            if (scenario === "worst" && spot === "witsand") return { spot, error: "Forecast unavailable" };
            const hours: ForecastPoint[] = Array.from({ length: 48 }, (_, i) => {
                const hour = i % 24;
                const peak = (i < 24 ? w.peak : w.peak * 0.85) * scale;
                const morning = w.morning * scale;
                const base = hour < 8 ? morning
                    : hour < w.peakAt ? morning + (peak - morning) * smoothstep((hour - 8) / (w.peakAt - 8))
                    : hour < 18 ? peak
                    : peak - (peak - morning) * smoothstep((hour - 18) / 5);
                const speed = Math.max(0, base + noise(s * 100 + i) * 1.4);
                return {
                    time: new Date(midnight + i * HOUR_MS).toISOString(),
                    speed: Math.round(speed * 10) / 10,
                    gust: Math.round((speed + w.gustSpread * (0.6 + 0.4 * Math.abs(noise(s * 100 + i + 7)))) * 10) / 10,
                    direction: (w.direction + noise(s * 100 + i + 3) * 10 + 360) % 360,
                    temperature: Math.round((19 + Math.sin(((hour - 8) / 24) * 2 * Math.PI) * 5) * 10) / 10,
                };
            });
            return { spot, model: "WRF 9 km", sunrise: "06:36", sunset: "19:10", hours };
        }),
    };
};

export const getScenario = (): Scenario | null => {
    const value = new URLSearchParams(window.location.search).get("data");
    return SCENARIOS.includes(value as Scenario) ? (value as Scenario) : null;
};

/** Answers API requests with the scenario's data; anything unknown falls through to the network */
export const installDevFixtures = (): void => {
    const scenario = getScenario();
    if (!scenario) return;
    const shape = SHAPES[scenario];
    const base = import.meta.env.VITE_API_BASE_URL;
    const realFetch = window.fetch.bind(window);

    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

    window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (!url.startsWith(base)) return realFetch(input, init);
        const path = url.slice(base.length);

        // A little latency so loading states are visible
        await new Promise((resolve) => setTimeout(resolve, 400));

        if (path === "/summary") return json(buildSummary(scenario));

        const route = path.match(/^\/(forecast|spots|live)\/([^/]+)(?:\/([^/]+))?$/);
        const [, resource, first, second] = route ?? [];

        if (resource === "forecast" && (second === "hires" || second === "global")) return json(buildForecast(shape, second));
        if (resource === "forecast" && second === "waves") {
            const waves = buildWaves(shape);
            return waves ? json(waves) : json({ error: "No wave forecast for this spot" }, 404);
        }
        if (resource === "spots") return json(spotInfo(shape));
        if (resource === "live" && first === "15min") return json(buildLive(shape, 15));
        if (resource === "live" && first === "1min") return json(buildLive(shape, 1));
        return realFetch(input, init);
    };
};
