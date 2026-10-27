import { useEffect, useState } from "react";

/*
 * The relief is a grey shaded-relief image meant to be blended hard-light over the land: lighter than mid grey lights a
 * slope, darker shades it. A mix-blend-mode under the moving wind lines makes the browser re-blend the whole map every
 * frame, which halves the frame rate on a 4K screen. Hard-light with a grey layer is the same as laying white over the
 * base where the layer is light and black where it's dark, at an opacity of how far it is from mid grey, so the image is
 * turned into exactly that once, in a worker, into a bitmap the map draws from directly (no re-encoding to an image file),
 * and then drawn with plain alpha.
 */

type Shade = HTMLCanvasElement | ImageBitmap;

const shades = new Map<string, Promise<Shade>>();
// Finished ones, so a map mounting after the work is done draws them on its first frame
const ready = new Map<string, Shade>();

/** On the main thread, where a worker can't do it (no OffscreenCanvas) */
const toShadeHere = (src: string) =>
    new Promise<Shade>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return reject(new Error("No 2D canvas"));
            ctx.drawImage(img, 0, 0);
            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const px = image.data;
            const out = new Uint32Array(px.buffer);
            for (let i = 0; i < out.length; i++) {
                const lift = px[i * 4] * 2 - 255;
                out[i] = lift > 0 ? ((lift << 24) | 0xffffff) >>> 0 : (-lift << 24) >>> 0;
            }
            ctx.putImageData(image, 0, 0);
            resolve(canvas);
        };
        img.onerror = () => reject(new Error(`Couldn't load ${src}`));
        img.decoding = "async";
        img.src = src;
    });

/** In a worker, so the large images' pixel work never holds up the page (or the map's first frame) */
const toShade = (src: string): Promise<Shade> => {
    if (typeof OffscreenCanvas === "undefined" || typeof Worker === "undefined") return toShadeHere(src);
    return new Promise<Shade>((resolve, reject) => {
        const worker = new Worker(new URL("./shadeWorker.ts", import.meta.url), { type: "module" });
        worker.onmessage = ({ data }: MessageEvent<{ shade?: ImageBitmap; error?: string }>) => {
            worker.terminate();
            if (data.shade) resolve(data.shade);
            else toShadeHere(src).then(resolve, reject);
        };
        worker.onerror = () => {
            worker.terminate();
            toShadeHere(src).then(resolve, reject);
        };
        worker.postMessage({ src: new URL(src, document.baseURI).href });
    });
};

/**
 * Starts turning an image into light and shade, once. The home map calls this as its code loads, so the work runs while
 * the forecast is still on its way rather than after the map appears
 */
export const prepareTerrainShade = (src: string) => {
    if (!shades.has(src)) {
        shades.set(src, toShade(src).then((made) => {
            ready.set(src, made);
            return made;
        }));
    }
    return shades.get(src)!;
};

/** The image as light and shade, to draw with plain alpha; null until it's ready (or if it couldn't be made) */
export const useTerrainShade = (src: string) => {
    const [shade, setShade] = useState<Shade | null>(() => ready.get(src) ?? null);
    useEffect(() => {
        let live = true;
        prepareTerrainShade(src).then((made) => live && setShade(made), () => live && setShade(null));
        return () => {
            live = false;
        };
    }, [src]);
    return shade;
};
