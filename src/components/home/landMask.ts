import { OUTLINE } from "./spotStatus";

/*
 * The coastline rasterised once, in the browser, into a coarse grid over the artwork and well past it (the map shows
 * land and sea beyond the artwork's frame on wide and tall screens). Two things are read from it:
 * - how far inland a place is, so the wind field can slow over land the way friction does;
 * - a soft shadow the land casts onto the sea, drawn once as an image, so the land reads as raised.
 */

// Artwork units per cell (the artwork is 1000 wide): the inland grid is coarse, as friction has no fine detail, and is
// blurred in code; the shadow is drawn finer, by the canvas's own shadow blur, so it hugs the coast crisply
const CELL = 4;
const SHADOW_CELL = 1.25;
// The grid's reach, in artwork units: half a width either side, up past the land drawn north of the frame, and south
const LEFT = -500;
const TOP = -OUTLINE.height;
const WIDTH = 2000;
const HEIGHT = OUTLINE.height * 2.6;
// How far the wind takes to slow fully inland, in artwork units (about 45 km, so it eases off rather than stopping at the
// beach), and the shadow's softness and offset:
// the light comes from the north-west, so the shadow falls south-east
const INLAND_BLUR = 100;
const SHADOW_BLUR = 4;
const SHADOW_OFFSET = { x: 2.5, y: 3.5 };
const SHADOW_ALPHA = 0.55;

export interface LandMask {
    /** 0 at the coast and out at sea, rising gently to 1 about 45 km inland */
    inland: (x: number, y: number) => number;
    /** The land's shadow on the sea, as a canvas to draw from, and where it goes on the artwork (artwork units) */
    shadow: { canvas: HTMLCanvasElement; x: number; y: number; width: number; height: number };
}

/** Three passes of a separable box blur, which is close to a Gaussian, over a cols × rows grid, in place */
const blur = (grid: Float32Array, cols: number, rows: number, radius: number) => {
    const r = Math.max(1, Math.round(radius));
    const tmp = new Float32Array(grid.length);
    for (let pass = 0; pass < 3; pass++) {
        for (let y = 0; y < rows; y++) {
            let sum = 0;
            const row = y * cols;
            for (let x = -r; x <= r; x++) sum += grid[row + Math.min(cols - 1, Math.max(0, x))];
            for (let x = 0; x < cols; x++) {
                tmp[row + x] = sum / (2 * r + 1);
                sum += grid[row + Math.min(cols - 1, x + r + 1)] - grid[row + Math.max(0, x - r)];
            }
        }
        for (let x = 0; x < cols; x++) {
            let sum = 0;
            for (let y = -r; y <= r; y++) sum += tmp[Math.min(rows - 1, Math.max(0, y)) * cols + x];
            for (let y = 0; y < rows; y++) {
                grid[y * cols + x] = sum / (2 * r + 1);
                sum += tmp[Math.min(rows - 1, y + r + 1) * cols + x] - tmp[Math.max(0, y - r) * cols + x];
            }
        }
    }
};

const smoothstep = (a: number, b: number, t: number) => {
    const k = Math.min(Math.max((t - a) / (b - a), 0), 1);
    return k * k * (3 - 2 * k);
};

let made: LandMask | null | undefined;

/** The land mask, made on first use; null where there's no 2D canvas to draw it with */
export const getLandMask = (): LandMask | null => {
    if (made !== undefined) return made;
    made = null;
    const cols = Math.round(WIDTH / CELL);
    const rows = Math.round(HEIGHT / CELL);
    const canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return made;

    ctx.setTransform(1 / CELL, 0, 0, 1 / CELL, -LEFT / CELL, -TOP / CELL);
    ctx.fill(new Path2D(OUTLINE.land));
    const pixels = ctx.getImageData(0, 0, cols, rows).data;
    const land = new Float32Array(cols * rows);
    for (let i = 0; i < land.length; i++) land[i] = pixels[i * 4 + 3] / 255;

    // Inland: the land blurred wide, so it's a half at the coast and climbs to one inland; only the land side counts
    const inlandGrid = land.slice();
    blur(inlandGrid, cols, rows, INLAND_BLUR / CELL / 2);
    const inland = (x: number, y: number) => {
        const i = Math.min(cols - 1, Math.max(0, Math.round((x - LEFT) / CELL)));
        const j = Math.min(rows - 1, Math.max(0, Math.round((y - TOP) / CELL)));
        return smoothstep(0.5, 1, inlandGrid[j * cols + i]);
    };

    // Shadow: the land drawn off-canvas with the canvas's own blurred shadow falling onto it south-east, then the land
    // itself cut out, so the shadow lies on the sea only. Native, so it's quick even at this resolution
    const shadow = document.createElement("canvas");
    shadow.width = Math.round(WIDTH / SHADOW_CELL);
    shadow.height = Math.round(HEIGHT / SHADOW_CELL);
    const sctx = shadow.getContext("2d");
    if (sctx) {
        const land = new Path2D(OUTLINE.land);
        const lift = shadow.width * 4;
        sctx.setTransform(1 / SHADOW_CELL, 0, 0, 1 / SHADOW_CELL, -LEFT / SHADOW_CELL - lift, -TOP / SHADOW_CELL);
        // The shape is drawn far to the left, out of sight, and only its shadow is thrown back into view
        sctx.shadowColor = `rgba(0,0,0,${SHADOW_ALPHA})`;
        sctx.shadowBlur = SHADOW_BLUR / SHADOW_CELL;
        sctx.shadowOffsetX = lift + SHADOW_OFFSET.x / SHADOW_CELL;
        sctx.shadowOffsetY = SHADOW_OFFSET.y / SHADOW_CELL;
        sctx.fill(land);
        sctx.shadowColor = "transparent";
        sctx.setTransform(1 / SHADOW_CELL, 0, 0, 1 / SHADOW_CELL, -LEFT / SHADOW_CELL, -TOP / SHADOW_CELL);
        sctx.globalCompositeOperation = "destination-out";
        sctx.fill(land);
    }

    made = { inland, shadow: { canvas: shadow, x: LEFT, y: TOP, width: WIDTH, height: HEIGHT } };
    return made;
};
