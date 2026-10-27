import { getGraphStrokeColor, WIND_SCALE } from "../../utils/colorUtils";
import { OUTLINE, projectSpot, Wind } from "./spotStatus";

export interface WindSample {
    /** Knots */
    speed: number;
    /** Unit vector the air moves along, in screen axes (+y is south) */
    dx: number;
    dy: number;
}

/** Wind at a point of the artwork, given as fractions of its width and height (they may run past 0–1) */
export type WindField = (x: number, y: number) => WindSample;

// Distances are measured in the artwork's own units, where its width is 1000 (about 440 km). The softening keeps the
// field from pinching into a point at each spot: within about 25 km of one, it's mostly that spot's wind.
const SOFTENING = 60 ** 2;
// Wind is streaky along the way it blows, not round: distance along a spot's wind counts this much less than across it
const STRETCH = 2.2;
// Friction: fully inland the wind is this much lighter (the spots, on the coast, keep their own forecast)
const LAND_SLOWDOWN = 0.3;
// Gentle variation, so the field has structure rather than perfect gradients: up to this many knots (and a share of the
// speed, so a calm doesn't go negative), over features about this many artwork units across (about 60 km)
const VARIATION_KNOTS = 1.5;
const VARIATION_SIZE = 140;

/** Repeatable value noise in [-1, 1], smooth between whole-number lattice points */
const hash = (x: number, y: number) => {
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return (h - Math.floor(h)) * 2 - 1;
};
export const noise = (x: number, y: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

interface FieldOptions {
    /** How far inland a place is (artwork units in), 0 at the coast and at sea to 1 inland; none leaves land alone */
    inland?: (x: number, y: number) => number;
    /** Moves the variation with the timeline, in hours, so playing it doesn't show the same pattern each hour */
    hour?: number;
}

/**
 * The wind between the spots, blended from their forecasts by inverse distance, stretched along the wind, slowed over
 * land and given a little variation. It is only an estimate: the spots all sit on the coast, so out to sea and inland
 * it's shaped from the nearest ones, not a forecast of its own.
 */
export const buildWindField = (winds: (Wind & { coordinates: [number, number] })[], { inland, hour = 0 }: FieldOptions = {}): WindField | null => {
    if (winds.length === 0) return null;
    const rad = Math.PI / 180;
    const points = winds.map((w) => {
        const { x, y } = projectSpot(w.coordinates);
        // The forecast gives where the wind comes from; the air moves the opposite way
        return { x: x * OUTLINE.width, y: y * OUTLINE.height, speed: w.speed, dx: -Math.sin(w.direction * rad), dy: Math.cos(w.direction * rad) };
    });
    // The variation drifts downwind of the average wind as the hours pass
    const drift = { x: hour * 0.35, y: hour * 0.2 };

    return (fx, fy) => {
        const x = fx * OUTLINE.width;
        const y = fy * OUTLINE.height;
        let total = 0, speed = 0, dx = 0, dy = 0;
        for (const p of points) {
            const ox = x - p.x, oy = y - p.y;
            const along = ox * p.dx + oy * p.dy;
            const across = ox * p.dy - oy * p.dx;
            const w = 1 / ((along / STRETCH) ** 2 + across ** 2 + SOFTENING);
            total += w;
            speed += w * p.speed;
            // Directions blend weighted by strength too, so a calm spot barely turns its neighbours' wind
            dx += w * p.dx * (p.speed + 1);
            dy += w * p.dy * (p.speed + 1);
        }
        const length = Math.hypot(dx, dy) || 1;
        let knots = speed / total;
        knots *= 1 - LAND_SLOWDOWN * (inland?.(x, y) ?? 0);
        knots += noise(x / VARIATION_SIZE + drift.x, y / VARIATION_SIZE + drift.y) * Math.min(VARIATION_KNOTS, knots * 0.15);
        return { speed: Math.max(knots, 0), dx: dx / length, dy: dy / length };
    };
};

const hexToRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

// The wind scale's colours, each pinned to the middle of its band, so the field fades smoothly from one to the next
const STOPS = WIND_SCALE.map((knots) => ({ knots: knots + 1.5, rgb: hexToRgb(getGraphStrokeColor(knots)) }));

/** The wind scale's colour for any speed, blended between bands */
export const windColour = (knots: number): [number, number, number] => {
    const next = STOPS.findIndex((s) => s.knots > knots);
    if (next === 0) return STOPS[0].rgb;
    if (next === -1) return STOPS[STOPS.length - 1].rgb;
    const a = STOPS[next - 1], b = STOPS[next];
    const t = (knots - a.knots) / (b.knots - a.knots);
    return [0, 1, 2].map((i) => Math.round(a.rgb[i] + (b.rgb[i] - a.rgb[i]) * t)) as [number, number, number];
};
