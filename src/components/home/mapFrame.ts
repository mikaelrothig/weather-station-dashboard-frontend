import { OUTLINE } from "./spotStatus";

export interface Size {
    width: number;
    height: number;
}

/** Where the artwork sits in the map's frame, in CSS px; it's usually larger than the frame and runs past its edges */
export interface ArtworkBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

// The part of the artwork the map is about, as fractions of it: every spot, with room for their labels (Melkbos's hangs
// out to the west, Hermanus's and Witsand's below). The frame zooms in to fit this and shows whatever else fits around it.
const FOCUS = { left: 0.07, right: 0.91, top: 0.13, bottom: 0.86 };

/** Px along the frame's edges that the spots should stay clear of: panels and controls floating over the map */
export interface Reserved {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

/** An area of the frame, in px */
export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** Spots (as fractions of the artwork) that must stay out of `areas`, with room around each for its label, in px */
export interface KeepClear {
    points: { x: number; y: number }[];
    areas: Rect[];
    margin: { x: number; y: number };
}

// When a spot would land under a panel, the zoom is nudged by this step, in or out, up to these limits of the plain fit
const NUDGE = 1.04;
const FURTHEST_OUT = 0.45;
const FURTHEST_IN = 1.35;

/**
 * Fits the spots into the room the frame has left once `reserved` is taken off, centred there. With `keepClear`, the zoom
 * is nudged (around the same centre) to the nearest one where none of those spots lands under a panel or outside the
 * room: out pulls a spot towards the middle, in can push it past a panel's end. The artwork's west and
 * south are open sea, which the wind colours fill anyway, so it may stop short of those sides; its east edge cuts
 * through land, so the artwork is kept running past the frame's right side.
 */
export const fitArtwork = ({ width, height }: Size, { top = 0, right = 0, bottom = 0, left = 0 }: Reserved = {}, keepClear?: KeepClear): ArtworkBox => {
    const focusWidth = (FOCUS.right - FOCUS.left) * OUTLINE.width;
    const focusHeight = (FOCUS.bottom - FOCUS.top) * OUTLINE.height;
    const roomWidth = Math.max(width - left - right, 1);
    const roomHeight = Math.max(height - top - bottom, 1);
    const fit = Math.min(roomWidth / focusWidth, roomHeight / focusHeight);

    const place = (scale: number): ArtworkBox => {
        const box = { width: OUTLINE.width * scale, height: OUTLINE.height * scale };
        const boxLeft = left + roomWidth / 2 - ((FOCUS.left + FOCUS.right) / 2) * box.width;
        const boxTop = top + roomHeight / 2 - ((FOCUS.top + FOCUS.bottom) / 2) * box.height;
        return { ...box, left: Math.max(boxLeft, width - box.width), top: boxTop };
    };
    if (!keepClear) return place(fit);
    const { points, areas, margin } = keepClear;
    const clear = (box: ArtworkBox) =>
        points.every(({ x, y }) => {
            const px = box.left + x * box.width;
            const py = box.top + y * box.height;
            const inRoom = px > left && px < width - right && py > top && py < height - bottom - margin.y;
            const underPanel = areas.some((a) => px > a.left - margin.x && px < a.right + margin.x && py > a.top - margin.y && py < a.bottom + margin.y);
            return inRoom && !underPanel;
        });

    // Nearest first: the plain fit, then a step out and a step in, and so on
    for (let factor = 1; factor <= Math.max(1 / FURTHEST_OUT, FURTHEST_IN); factor *= NUDGE) {
        for (const scale of [fit / factor, fit * factor]) {
            if (scale < fit * FURTHEST_OUT || scale > fit * FURTHEST_IN) continue;
            const box = place(scale);
            if (clear(box)) return box;
        }
    }
    return place(fit);
};

/** Turns a frame pixel into a place on the artwork, as fractions of its width and height */
export const toArtwork = (box: ArtworkBox) => (px: number, py: number) => [(px - box.left) / box.width, (py - box.top) / box.height] as const;

/** A box as absolute-positioning styles */
export const boxStyle = (box: ArtworkBox) => ({ left: box.left, top: box.top, width: box.width, height: box.height });
