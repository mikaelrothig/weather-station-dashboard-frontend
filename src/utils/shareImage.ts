import { ShareDayData } from "./shareUtils";
import { getGraphStrokeColor } from "./ColorUtils";
import { getDegreesToCompass } from "./DataUtils";
import { formatClock, getHourLabel } from "./TimeUtils";

/**
 * Draws a day's forecast as a 1080×1350 PNG (4:5, the shape WhatsApp and Instagram show largest).
 * Plain canvas rather than a DOM-screenshot library: crisp text, the app's own font, and the same
 * result on every device.
 */

const W = 1080;
const H = 1350;
const P = 64;
const FONT = "Geist, system-ui, -apple-system, sans-serif";
const SITE = "kitebeachforecast.vercel.app";

const C = {
    canvas: "#09090b",
    surface: "#111113",
    ring: "rgba(255, 255, 255, 0.07)",
    chipNeutral: "rgba(255, 255, 255, 0.06)",
    z50: "#fafafa",
    z200: "#e4e4e7",
    z300: "#d4d4d8",
    z400: "#a1a1aa",
    z500: "#71717a",
    rose: "#e11d48",
    dark: "#09090b",
};

type Ctx = CanvasRenderingContext2D;

const font = (ctx: Ctx, size: number, weight = 500) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
};

// Shrinks text until it fits, then ellipsizes as a last resort; long spot names and wetsuit notes need it
const fitText = (ctx: Ctx, text: string, maxWidth: number, size: number, weight: number, minScale = 0.6): number => {
    let current = size;
    font(ctx, current, weight);
    while (ctx.measureText(text).width > maxWidth && current > size * minScale) {
        current -= 2;
        font(ctx, current, weight);
    }
    return current;
};

const drawText = (ctx: Ctx, text: string, x: number, y: number, opts: { size: number; weight?: number; color: string; align?: CanvasTextAlign; maxWidth?: number; tracking?: number }) => {
    const weight = opts.weight ?? 500;
    if (opts.maxWidth) fitText(ctx, text, opts.maxWidth, opts.size, weight);
    else font(ctx, opts.size, weight);
    ctx.fillStyle = opts.color;
    ctx.textAlign = opts.align ?? "left";
    ctx.textBaseline = "alphabetic";
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${opts.tracking ?? 0}px`;
    let output = text;
    if (opts.maxWidth && ctx.measureText(output).width > opts.maxWidth) {
        while (output.length > 1 && ctx.measureText(`${output}…`).width > opts.maxWidth) output = output.slice(0, -1);
        output = `${output}…`;
    }
    ctx.fillText(output, x, y);
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px";
};

const card = (ctx: Ctx, x: number, y: number, w: number, h: number, radius = 32) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = C.surface;
    ctx.fill();
    ctx.strokeStyle = C.ring;
    ctx.lineWidth = 2;
    ctx.stroke();
};

const eyebrow = (ctx: Ctx, text: string, x: number, y: number, align: CanvasTextAlign = "left") =>
    drawText(ctx, text.toUpperCase(), x, y, { size: 22, weight: 500, color: C.z500, align, tracking: 2 });

// Wind direction is where the wind comes from; the arrow points where it blows to (like the app's arrows)
const arrow = (ctx: Ctx, cx: number, cy: number, size: number, degrees: number, color: string) => {
    if (!Number.isFinite(degrees)) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((degrees + 180) * Math.PI) / 180);
    const s = size / 2;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.72, s * 0.9);
    ctx.lineTo(0, s * 0.45);
    ctx.lineTo(-s * 0.72, s * 0.9);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
};

// Lucide's "radio" icon (lucide-react 0.475), the same paths the navigation logo renders
const RADIO_ICON_PATHS = [
    "M4.9 19.1C1 15.2 1 8.8 4.9 4.9",
    "M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5",
    "M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5",
    "M19.1 4.9C23 8.8 23 15.1 19.1 19",
];

/**
 * The navigation logo, scaled: a rose-600 square with rounded-lg corners (8px on 32px) and a 1px
 * top highlight, holding the radio icon at half its size with Lucide's 2px round strokes.
 */
const logo = (ctx: Ctx, x: number, y: number, size: number) => {
    const unit = size / 32; // the nav logo is 32px; everything below is in those units

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 8 * unit);
    ctx.fillStyle = C.rose;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // inset 0 1px 0 rgb(255 255 255 / 0.2)
    ctx.fillRect(x, y, size, unit);
    ctx.restore();

    // 16px icon centred in 32px, drawn on Lucide's 24-unit grid
    const iconSize = 16 * unit;
    ctx.save();
    ctx.translate(x + (size - iconSize) / 2, y + (size - iconSize) / 2);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const d of RADIO_ICON_PATHS) ctx.stroke(new Path2D(d));
    ctx.beginPath();
    ctx.arc(12, 12, 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};

const pill = (ctx: Ctx, text: string, rightX: number, centerY: number) => {
    font(ctx, 24, 500);
    const width = ctx.measureText(text).width + 36;
    ctx.beginPath();
    ctx.roundRect(rightX - width, centerY - 24, width, 48, 24);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();
    drawText(ctx, text, rightX - width / 2, centerY + 8, { size: 24, weight: 500, color: C.z200, align: "center" });
};

// Word-wraps into at most `maxLines`, so notes like "5/4 mm, boots and hood" stay readable instead of shrinking
const wrapLines = (ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] => {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width <= maxWidth || !line) line = next;
        else {
            lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    return lines.length > maxLines ? [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")] : lines;
};

const STAT_H = 196;

const statCell = (ctx: Ctx, x: number, y: number, w: number, label: string, value: string, sub: string) => {
    card(ctx, x, y, w, STAT_H, 28);
    eyebrow(ctx, label, x + 28, y + 48);
    drawText(ctx, value, x + 28, y + 108, { size: 42, weight: 600, color: C.z50, maxWidth: w - 56 });
    font(ctx, 22, 500);
    wrapLines(ctx, sub, w - 56, 2).forEach((line, i) =>
        drawText(ctx, line, x + 28, y + 146 + i * 28, { size: 22, weight: 500, color: C.z400, maxWidth: w - 56 }),
    );
};

const loadFonts = async () => {
    try {
        await Promise.all(["600 96px Geist", "500 24px Geist", "400 24px Geist"].map((f) => document.fonts.load(f)));
    } catch {
        // Falls back to the system font
    }
};

export const renderShareImage = async (data: ShareDayData): Promise<Blob> => {
    await loadFonts();
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = C.canvas;
    ctx.fillRect(0, 0, W, H);

    // Header: app mark, and which model this is so friends know what they're looking at
    logo(ctx, P, 60, 56);
    drawText(ctx, "Kite Beach Forecast", P + 76, 98, { size: 26, weight: 600, color: C.z200 });
    pill(ctx, data.modelName, W - P, 88);

    // Spot and day
    eyebrow(ctx, data.region, P, 186);
    drawText(ctx, data.spotName, P - 4, 278, { size: 104, weight: 600, color: C.z50, maxWidth: W - 2 * P, tracking: -3 });
    drawText(ctx, data.dateLabel, P, 334, { size: 36, weight: 500, color: C.z300 });

    // Wind summary: the answer to "is it on?"
    const heroY = 378;
    card(ctx, P, heroY, W - 2 * P, 232);
    eyebrow(ctx, "Wind", P + 40, heroY + 56);
    const [low, high] = data.windRange.map(Math.round);
    drawText(ctx, low === high ? `${high}` : `${low}–${high}`, P + 36, heroY + 154, { size: 96, weight: 600, color: C.z50, tracking: -2 });
    font(ctx, 96, 600);
    const rangeWidth = ctx.measureText(low === high ? `${high}` : `${low}–${high}`).width;
    drawText(ctx, "kn", P + 36 + rangeWidth + 18, heroY + 154, { size: 36, weight: 500, color: C.z500 });

    ctx.beginPath();
    ctx.arc(P + 52, heroY + 194, 8, 0, Math.PI * 2);
    ctx.fillStyle = getGraphStrokeColor(data.peak.speed);
    ctx.fill();
    drawText(ctx, `Gusts up to ${Math.round(data.maxGust)} kn · peak ${Math.round(data.peak.speed)} kn at ${formatClock(data.peak.time)}`, P + 72, heroY + 203, {
        size: 28, weight: 500, color: C.z300, maxWidth: W - 2 * P - 260,
    });

    const dirX = W - P - 120;
    ctx.beginPath();
    ctx.arc(dirX, heroY + 104, 58, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fill();
    ctx.strokeStyle = C.ring;
    ctx.stroke();
    arrow(ctx, dirX, heroY + 104, 54, data.direction, C.z50);
    drawText(ctx, getDegreesToCompass(data.direction), dirX, heroY + 202, { size: 30, weight: 600, color: C.z200, align: "center" });

    // Hourly: the readable version of the table people usually screenshot
    const tableY = 638;
    const tableH = 376;
    card(ctx, P, tableY, W - 2 * P, tableH);
    eyebrow(ctx, "Hourly · daylight", P + 40, tableY + 56);
    eyebrow(ctx, "knots", W - P - 40, tableY + 56, "right");

    const labelW = 92;
    const left = P + 40 + labelW;
    const width = W - P - 40 - left;
    const columns = data.hours.slice(0, 14);
    const colW = width / columns.length;
    const chipW = Math.min(colW - 12, 96);
    const rows = { time: tableY + 124, chip: tableY + 150, gust: tableY + 226, dir: tableY + 334 };

    for (const [label, y] of [["Time", rows.time], ["Wind", rows.chip + 47], ["Gusts", rows.gust + 47], ["Dir", rows.dir + 8]] as const) {
        drawText(ctx, label, P + 40, y, { size: 22, weight: 500, color: C.z500 });
    }

    columns.forEach((hour, i) => {
        const cx = left + colW * i + colW / 2;
        const speed = Math.round(hour.speed);
        drawText(ctx, getHourLabel(hour.time), cx, rows.time, { size: 26, weight: 500, color: C.z400, align: "center" });

        ctx.beginPath();
        ctx.roundRect(cx - chipW / 2, rows.chip, chipW, 64, 14);
        ctx.fillStyle = getGraphStrokeColor(speed);
        ctx.fill();
        drawText(ctx, `${speed}`, cx, rows.chip + 44, { size: 32, weight: 600, color: C.dark, align: "center" });

        // Gusts get the same chip and colour scale as the wind, like the app's table
        const gust = Math.round(hour.gust);
        ctx.beginPath();
        ctx.roundRect(cx - chipW / 2, rows.gust, chipW, 64, 14);
        ctx.fillStyle = getGraphStrokeColor(gust);
        ctx.fill();
        drawText(ctx, `${gust}`, cx, rows.gust + 44, { size: 32, weight: 600, color: C.dark, align: "center" });
        arrow(ctx, cx, rows.dir, 28, hour.direction, C.z300);
    });

    // Conditions: four small reading cards
    const statY = 1038;
    const gap = 16;
    const statW = (W - 2 * P - gap * 3) / 4;
    const tideDay = data.tides?.filter((t) => {
        const hour = Number(getHourLabel(new Date(t.time)));
        return hour >= 5 && hour <= 21;
    }) ?? [];

    statCell(ctx, P, statY, statW, "Waves",
        data.waves ? `${data.waves.height.toFixed(1)} m` : "–",
        data.waves ? `${Math.round(data.waves.period)} s period` : "No swell data");
    statCell(ctx, P + (statW + gap), statY, statW, "Tide",
        tideDay[0] ? `${tideDay[0].high ? "High" : "Low"} ${formatClock(tideDay[0].time)}` : "–",
        tideDay[1] ? `${tideDay[1].high ? "High" : "Low"} ${formatClock(tideDay[1].time)}` : data.tides ? "" : "No tide");
    statCell(ctx, P + (statW + gap) * 2, statY, statW, "Water",
        data.water ? `${Math.round(data.water.celsius)}°C` : "–",
        data.water ? data.water.wetsuit : "No data");
    statCell(ctx, P + (statW + gap) * 3, statY, statW, "Sunset", data.sunset, `Sunrise ${data.sunrise}`);

    // Footer
    drawText(ctx, `${data.modelName} · ${data.runLabel}`, P, H - 64, { size: 22, weight: 500, color: C.z500 });
    drawText(ctx, SITE, W - P, H - 64, { size: 22, weight: 500, color: C.z400, align: "right" });

    return new Promise((resolve, reject) =>
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create the image"))), "image/png"),
    );
};
