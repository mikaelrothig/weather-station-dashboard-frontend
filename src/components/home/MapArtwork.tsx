import { useEffect, useRef } from "react";
import { ArtworkBox, Size } from "./mapFrame";
import { LandMask } from "./landMask";
import { OUTLINE } from "./spotStatus";

interface MapArtworkProps {
    size: Size;
    box: ArtworkBox;
    /** The relief and the sea floor as light and shade (terrainShade.ts); either may still be on its way */
    relief: CanvasImageSource | null;
    depth: CanvasImageSource | null;
    landMask: LandMask | null;
}

// How strongly each layer shows: the sea floor and the relief are kept soft, a texture under the wind rather than
// pictures of their own; the coast is a fine, quiet line, enough to hold the shape where land and sea share a colour
const DEPTH_ALPHA = 0.85;
const RELIEF_ALPHA = 0.22;
const COAST = "rgb(255 255 255 / 0.15)";

const LAND = typeof Path2D === "undefined" ? null : new Path2D(OUTLINE.land);

/**
 * The map's static artwork over the wind colours, drawn on one canvas straight from the prepared light-and-shade
 * canvases: the sea floor (lit over the shelf, shaded over deep water), the land's soft shadow on the sea, the shaded
 * relief kept to the land, and the coastline. Redrawn only when the map resizes or a layer arrives.
 */
export const MapArtwork = ({ size, box, relief, depth, landMask }: MapArtworkProps) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !LAND) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(size.width * dpr);
        canvas.height = Math.round(size.height * dpr);
        // Draw in artwork units: the artwork is OUTLINE.width wide, placed at the box
        const scale = box.width / OUTLINE.width;
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * box.left, dpr * box.top);
        ctx.imageSmoothingQuality = "high";

        if (depth) {
            ctx.globalAlpha = DEPTH_ALPHA;
            ctx.drawImage(depth, OUTLINE.depth.x, OUTLINE.depth.y, OUTLINE.depth.width, OUTLINE.depth.height);
        }
        if (landMask) {
            const { canvas: shadow, x, y, width, height } = landMask.shadow;
            ctx.globalAlpha = 1;
            ctx.drawImage(shadow, x, y, width, height);
        }
        if (relief) {
            // Drawn up past the frame like the land is, and kept to the coastline
            ctx.save();
            ctx.clip(LAND);
            ctx.globalAlpha = RELIEF_ALPHA;
            ctx.drawImage(relief, 0, -OUTLINE.height * OUTLINE.terrainAbove, OUTLINE.width, OUTLINE.height * (1 + OUTLINE.terrainAbove));
            ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COAST;
        ctx.lineWidth = 1 / scale;
        ctx.lineJoin = "round";
        ctx.stroke(LAND);
    }, [size, box, relief, depth, landMask]);

    // Fades in once the relief is there, so it settles onto the map rather than popping in a beat after it
    return (
        <canvas
            ref={ref}
            className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-300 ease-[ease] motion-reduce:transition-none ${relief ? "opacity-100" : "opacity-0"}`}
            aria-hidden="true"
        />
    );
};
