import { useEffect, useMemo, useRef } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ArtworkBox, Size, toArtwork } from "./mapFrame";
import { noise, windColour, WindField } from "./windField";

/*
 * Both layers cover the map's whole frame, which the artwork usually runs past: a frame pixel's place on the artwork
 * comes from where the map has put the artwork (its box).
 */

/** The wind field at a whole forecast hour; the map builds each once and caches it */
export type FieldAt = (hour: number) => WindField;

interface LayerProps {
    fieldAt: FieldAt;
    /** The hour on the map, fractional while the timeline plays: the layers blend the two whole hours either side */
    hour: number;
    /** The forecast's last hour */
    lastHour: number;
    /** The frame, in CSS px */
    size: Size;
    box: ArtworkBox;
}

/**
 * Something made from each whole hour's field (a colour grid, a sampled wind grid), made once per hour and kept while
 * the frame and forecast stay the same. Playing or scrubbing the timeline then only reads from it. The next few hours
 * are made ahead in idle time, so crossing into an hour never stalls a frame.
 */
const useHourCache = <T,>(make: (field: WindField) => T, { fieldAt, hour, lastHour, size, box }: LayerProps) => {
    const makeRef = useRef(make);
    makeRef.current = make;
    const get = useMemo(() => {
        const cache = new Map<number, T>();
        return (h: number) => {
            let made = cache.get(h);
            if (made === undefined) {
                made = makeRef.current(fieldAt(h));
                cache.set(h, made);
            }
            return made;
        };
        // A new frame or box makes everything in the cache stale, though `make` reads them rather than this
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldAt, size, box]);

    const base = Math.floor(hour);
    useEffect(() => {
        const ahead = [base + 1, base + 2, base + 3, base - 1].filter((h) => h >= 0 && h <= lastHour);
        const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 16));
        const cancel = window.cancelIdleCallback ?? window.clearTimeout;
        let handle = 0;
        const step = () => {
            const h = ahead.shift();
            if (h === undefined) return;
            get(h);
            handle = idle(step);
        };
        handle = idle(step);
        return () => cancel(handle);
    }, [get, base, lastHour]);

    return get;
};

/** The two whole hours either side of `hour`, and how far it is from the first to the second */
const between = (hour: number, lastHour: number) => {
    const a = Math.max(0, Math.floor(hour));
    const b = Math.min(a + 1, lastHour);
    return { a, b, t: b === a ? 0 : hour - a };
};

// The colours are worked out on a coarse grid and scaled up smoothly; the field has no detail finer than this. On a big
// frame (a 4K screen) the cells grow so the grid stays around 60k cells, quick enough to redraw while the timeline plays
const MIN_COLOUR_CELL = 8;
const MAX_COLOUR_CELLS = 60_000;

/** One hour's colours on a coarse grid, to be scaled up smoothly over the frame */
const renderColourGrid = (field: WindField, box: ArtworkBox, size: Size) => {
    const cell = Math.max(MIN_COLOUR_CELL, Math.ceil(Math.sqrt((size.width * size.height) / MAX_COLOUR_CELLS)));
    const cols = Math.ceil(size.width / cell) + 1;
    const rows = Math.ceil(size.height / cell) + 1;
    const canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        const image = ctx.createImageData(cols, rows);
        const place = toArtwork(box);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const [r, g, b] = windColour(field(...place(col * cell, row * cell)).speed);
                const i = (row * cols + col) * 4;
                image.data[i] = r;
                image.data[i + 1] = g;
                image.data[i + 2] = b;
                image.data[i + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
    }
    return { canvas, width: cols * cell, height: rows * cell };
};

/**
 * The whole map tinted in the wind scale's colours, like a forecast map; the land's relief is shaded over it. Each hour
 * is coloured once, on a coarse grid that CSS scales up smoothly. Between hours (the timeline playing or scrubbing) the
 * next hour's grid sits on top at the share of the way there as its opacity: a compositor-only change, so a frame
 * repaints nothing. The grids themselves are only redrawn when the hour crosses a whole hour.
 */
export const WindColours = (props: LayerProps) => {
    const { hour, lastHour, size, box } = props;
    const firstRef = useRef<HTMLCanvasElement>(null);
    const secondRef = useRef<HTMLCanvasElement>(null);
    const grids = useHourCache((field) => renderColourGrid(field, box, size), props);
    const { a, b, t } = between(hour, lastHour);

    // Which hour each canvas shows; redrawn only when that changes
    const shown = useRef<{ grids: unknown; a: number; b: number }>({ grids: null, a: -1, b: -1 });
    useEffect(() => {
        const first = firstRef.current, second = secondRef.current;
        if (!first || !second) return;
        const was = shown.current;
        const copy = (canvas: HTMLCanvasElement, grid: ReturnType<typeof renderColourGrid>) => {
            if (canvas.width !== grid.canvas.width || canvas.height !== grid.canvas.height) {
                Object.assign(canvas, { width: grid.canvas.width, height: grid.canvas.height });
            }
            Object.assign(canvas.style, { width: `${grid.width}px`, height: `${grid.height}px` });
            canvas.getContext("2d")?.drawImage(grid.canvas, 0, 0);
        };
        if (was.grids !== grids || was.a !== a) copy(first, grids(a));
        if (was.grids !== grids || was.b !== b) copy(second, grids(b));
        shown.current = { grids, a, b };
    }, [grids, a, b]);

    return (
        <div className="absolute inset-0 overflow-hidden opacity-60" aria-hidden="true">
            <canvas ref={firstRef} className="absolute left-0 top-0" />
            <canvas ref={secondRef} className="absolute left-0 top-0" style={{ opacity: t }} />
        </div>
    );
};

// One particle for this much of the map, in CSS px², where the wind is strongest. Dense like Windy's, so the flow reads
// as a texture, not as dots. Capped, so a 4K screen draws a sensible number rather than tens of thousands
const AREA_PER_PARTICLE = 320;
const MAX_PARTICLES = 5000;
// Most backing-store pixels the particle canvas redraws each frame: past this (a 4K screen) it draws at a lower
// resolution, which thin, fading lines hide, rather than clearing and redrawing tens of millions of pixels a second
const MAX_PARTICLE_PIXELS = 4_000_000;
// Share of the particles shown where the wind is this many knots: a few even in a calm so it still shows a direction,
// rising to about half at 12 kn. Past that the lines are already faster and longer, so their count tapers off a little,
// or strong wind would crowd the map with white
const KNEE = 12;
const density = (knots: number) => (0.12 + Math.min(knots, KNEE) / 28) * Math.sqrt(KNEE / Math.max(knots, KNEE));
// How far a particle travels for each knot, as a share of the map's width per second: 20 kn crosses it in about 5 s.
// Widths past PACE_WIDTH count as that, so a panoramic map doesn't draw longer, faster lines than a smaller one
const PACE = 0.0095;
const PACE_WIDTH = 840;
// The particles move in fixed steps, so trails are the same length at 60 Hz and 120 Hz
const STEP = 1 / 60;
// Steps a particle lives for (1.5–3 s) before its trail draws in and it starts again somewhere else
const LIFE = [90, 180];
// Positions kept per trail: about a quarter of a second of travel, so stronger wind draws longer lines
const TRAIL = 16;
// Speed tiers, lightest first: a line's opacity and width follow the wind where it is, so calm air shows as faint hairlines
// and strong wind as bright strokes. Drawn a tier at a time, every particle in a tier in one stroke per trail segment
const TIERS = [
    { below: 8, alpha: 0.35, width: 0.7 },
    { below: 16, alpha: 0.55, width: 0.85 },
    { below: 26, alpha: 0.72, width: 1 },
    { below: Infinity, alpha: 0.85, width: 1.15 },
];
// Air doesn't run on rails: each line turns gently either side of the wind, by up to this much (radians), following a
// slowly changing pattern about this many px across, so neighbouring lines curl together
const CURL = 0.4;
const CURL_SIZE = 180;
const CURL_DRIFT = 0.12;
// The particles read the wind from a grid sampled this many px apart, made once per field: thousands of particles asking
// the full field every step is the costliest thing on a 4K screen, and the field has no detail this fine anyway
const WIND_GRID = 12;

/** The field sampled on a grid over the frame, read back by nearest cell */
const sampleGrid = (field: WindField, box: ArtworkBox, { width, height }: Size) => {
    const cols = Math.ceil(width / WIND_GRID) + 1, rows = Math.ceil(height / WIND_GRID) + 1;
    const speed = new Float32Array(cols * rows), dx = new Float32Array(cols * rows), dy = new Float32Array(cols * rows);
    const place = toArtwork(box);
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const w = field(...place(i * WIND_GRID, j * WIND_GRID));
            const k = j * cols + i;
            speed[k] = w.speed;
            dx[k] = w.dx;
            dy[k] = w.dy;
        }
    }
    return (x: number, y: number) => {
        const i = Math.min(cols - 1, Math.max(0, Math.round(x / WIND_GRID)));
        const k = Math.min(rows - 1, Math.max(0, Math.round(y / WIND_GRID))) * cols + i;
        return { speed: speed[k], dx: dx[k], dy: dy[k] };
    };
};

interface Particle {
    /** Newest position last */
    trail: { x: number; y: number }[];
    age: number;
    life: number;
    /** Sitting this life out, unseen, because it started where the wind is light */
    hidden: boolean;
    /** Speed tier at the head, for its opacity and width */
    tier: number;
}

/**
 * Wind particles flowing along the field, like Windy's: thin white lines that follow the wind where they are, at a pace
 * that follows the knots, each with a trail that tapers from a bright head to nothing. The stronger the wind, the more of
 * them there are. They keep flowing as the field changes under them (the timeline playing), rather than starting over.
 * Paused off screen and left out for reduced motion; the colours still tell the story.
 */
export const WindParticles = ({ paused, ...props }: LayerProps & { paused: boolean }) => {
    const { hour, lastHour, size, box } = props;
    const ref = useRef<HTMLCanvasElement>(null);
    const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
    const running = !paused && !reducedMotion;
    // Each hour's wind sampled once; read on every step, blending the hours either side, so the timeline playing steers
    // the particles already in flight
    const grids = useHourCache((field) => sampleGrid(field, box, size), props);
    const { a, b, t } = between(hour, lastHour);
    const windRef = useRef({ first: grids(a), second: t > 0.001 ? grids(b) : null, t });
    useEffect(() => {
        windRef.current = { first: grids(a), second: t > 0.001 ? grids(b) : null, t };
    }, [grids, a, b, t]);

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !running) return;
        const { width, height } = size;
        const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_PARTICLE_PIXELS / (width * height)));
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.scale(dpr, dpr);

        const wind = (x: number, y: number) => {
            const { first, second, t } = windRef.current;
            const one = first(x, y);
            if (!second) return one;
            const two = second(x, y);
            return { speed: one.speed + (two.speed - one.speed) * t, dx: one.dx + (two.dx - one.dx) * t, dy: one.dy + (two.dy - one.dy) * t };
        };
        const pxPerStep = PACE * Math.min(width, PACE_WIDTH) * STEP;
        const reset = (p: Particle, age = 0) => {
            const start = { x: Math.random() * width, y: Math.random() * height };
            p.trail = [start];
            p.age = age;
            p.life = LIFE[0] + Math.random() * (LIFE[1] - LIFE[0]);
            // Skipping a whole life rather than trying again elsewhere, so light wind thins the lines out overall, not
            // only moves them to windier places
            p.hidden = Math.random() > density(wind(start.x, start.y).speed);
        };
        const particles = Array.from({ length: Math.min(Math.round((width * height) / AREA_PER_PARTICLE), MAX_PARTICLES) }, () => {
            const p: Particle = { trail: [], age: 0, life: 0, hidden: false, tier: 0 };
            // Started part-way through their lives, so they don't all die and respawn together
            reset(p, Math.random() * LIFE[0]);
            return p;
        });

        // Lines thin out on dense screens, where a CSS pixel is two device pixels and 1 px reads heavy
        const widthScale = dpr >= 1.5 ? 0.8 : 1;
        let time = 0;
        const advance = () => {
            time += STEP;
            for (const p of particles) {
                if (p.hidden) {
                    if (++p.age > p.life) reset(p);
                    continue;
                }
                const head = p.trail[p.trail.length - 1];
                const dying = ++p.age > p.life || head.x < 0 || head.x > width || head.y < 0 || head.y > height;
                if (dying) {
                    // The head stops and the tail catches up with it, so the line draws in rather than vanishing
                    p.trail.shift();
                    if (p.trail.length < 2) reset(p);
                    continue;
                }
                const here = wind(head.x, head.y);
                // A small floor, so a near calm still creeps rather than freezes
                const distance = Math.max(here.speed, 0.5) * pxPerStep;
                const turn = noise(head.x / CURL_SIZE + time * CURL_DRIFT, head.y / CURL_SIZE) * CURL;
                const cos = Math.cos(turn), sin = Math.sin(turn);
                const dx = here.dx * cos - here.dy * sin, dy = here.dx * sin + here.dy * cos;
                p.trail.push({ x: head.x + dx * distance, y: head.y + dy * distance });
                p.tier = TIERS.findIndex((t) => here.speed < t.below);
                if (p.trail.length > TRAIL) p.trail.shift();
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.lineCap = "round";
            // Per place along the trail (segment 0 at the head), every particle goes into its tier's path in one pass,
            // then each tier is stroked once: few strokes, and each particle visited once a segment
            for (let segment = 0; segment < TRAIL - 1; segment++) {
                const paths = TIERS.map(() => new Path2D());
                const used = TIERS.map(() => false);
                for (const p of particles) {
                    if (p.hidden) continue;
                    const to = p.trail.length - 1 - segment;
                    if (to < 1) continue;
                    const path = paths[p.tier];
                    path.moveTo(p.trail[to - 1].x, p.trail[to - 1].y);
                    path.lineTo(p.trail[to].x, p.trail[to].y);
                    used[p.tier] = true;
                }
                const fade = (1 - segment / (TRAIL - 1)) ** 1.4;
                TIERS.forEach((tier, t) => {
                    if (!used[t]) return;
                    ctx.lineWidth = tier.width * widthScale;
                    ctx.strokeStyle = `rgba(255,255,255,${tier.alpha * fade})`;
                    ctx.stroke(paths[t]);
                });
            }
        };

        // Run a trail's worth of steps before the first frame, so the lines are already flowing when the map appears
        // rather than growing out of dots
        for (let i = 0; i < TRAIL; i++) advance();

        let frame = 0;
        // Timed from the first frame: a frame's timestamp can be earlier than performance.now() was when this started
        let last: number | null = null;
        let pending = 0;
        const tick = (now: number) => {
            // Capped, so coming back to a throttled tab doesn't fling every particle across the map
            pending = Math.min(pending + Math.max(now - (last ?? now), 0) / 1000, STEP * 3);
            last = now;
            while (pending >= STEP) {
                advance();
                pending -= STEP;
            }
            draw();
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [size, running]);

    return <canvas ref={ref} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true" />;
};
