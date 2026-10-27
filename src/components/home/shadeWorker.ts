/// <reference lib="webworker" />
// Turns a grey relief image into light and shade off the main thread (see terrainShade.ts), and hands back a bitmap

self.onmessage = async (event: MessageEvent<{ src: string }>) => {
    try {
        const blob = await (await fetch(event.data.src)).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("No 2D canvas");
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // One 32-bit write a pixel (little-endian RGBA): white or black, at the alpha of how far the grey is from mid grey
        const px = image.data;
        const out = new Uint32Array(px.buffer);
        for (let i = 0; i < out.length; i++) {
            const lift = px[i * 4] * 2 - 255;
            out[i] = lift > 0 ? ((lift << 24) | 0xffffff) >>> 0 : (-lift << 24) >>> 0;
        }
        ctx.putImageData(image, 0, 0);
        const shade = canvas.transferToImageBitmap();
        (self as unknown as DedicatedWorkerGlobalScope).postMessage({ shade }, [shade]);
    } catch (error) {
        self.postMessage({ error: String(error) });
    }
};
