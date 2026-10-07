/**
 * Builds the coastline artwork for the home page's map: src/components/home/outline.json.
 *
 * Frames the spots (plus a margin) at the map's aspect ratio, cuts the land, lakes and land borders out of
 * Natural Earth's 1:10m data (public domain), rounds the shapes off with Chaikin smoothing and writes them as SVG
 * paths in a Web Mercator projection. The map plots the spots with the same projection
 * (projectSpot in src/components/home/spotStatus.ts), so dots and coastline line up.
 *
 * Land is drawn well past the frame to the north (NORTH_EXTRA), so when the map card is taller than the artwork it
 * shows more of the land instead of a cut edge.
 *
 * The terrain is shaded relief (a hillshade) from the public Terrarium elevation tiles on AWS (elevation-tiles-prod),
 * lit from the north-west as maps conventionally are, so the eye reads ridges as ridges rather than valleys. It's
 * written as a grayscale JPEG beside the outline: mid grey is flat, lighter is a slope facing the light, darker one
 * facing away. The map lays it over the land with a hard-light blend, clipped to the coastline.
 *
 * Run after adding a spot: npm run outlines
 * (downloads ~10 MB from naciscdn.org and ~25 MB of elevation tiles into a temp folder; the output is committed)
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

const require = createRequire(import.meta.url);
const mapshaper = require.resolve("mapshaper/bin/mapshaper");

// Card artwork size in SVG units; keep in step with the aspect ratio of the card's art area
const WIDTH = 1000;
const HEIGHT = 625;
// Space around the outermost spots, as a share of the spots' own extent (and at least MIN_MARGIN degrees)
const MARGIN = 0.35;
const MIN_MARGIN = 0.4;
// Degrees of land drawn beyond the frame to the north, inland
const NORTH_EXTRA = 2.5;

// Shaded relief: the tile zoom it's computed from (about 125 m a pixel here), the image's width, how far it reaches
// above the frame (as a share of the frame's height, for cards taller than the artwork), how much the hills are
// exaggerated, and where the light comes from (degrees clockwise from north, and above the horizon)
const TERRAIN_ZOOM = 10;
const TERRAIN_WIDTH = 1600;
const TERRAIN_ABOVE = 0.4;
const TERRAIN_EXAGGERATION = 2;
const LIGHT_AZIMUTH = 315;
const LIGHT_ALTITUDE = 45;
// JPEG suits smooth shading far better than PNG: about a third of the size, with no visible difference at this quality
const TERRAIN_QUALITY = 80;
const TERRAIN_OUT = new URL("../src/components/home/terrain.jpg", import.meta.url).pathname;

// Islands too small for Natural Earth's 1:10m land, traced from OpenStreetMap (ODbL) and simplified by hand.
// Robben Island's harbour is left out: at this size it only reads as a notch.
const ISLANDS = {
    "Robben Island": [[18.3566, -33.8019], [18.3603, -33.809], [18.3602, -33.8144], [18.3638, -33.8178], [18.3706, -33.8209],
        [18.3816, -33.8177], [18.383, -33.8139], [18.3813, -33.8117], [18.382, -33.8089], [18.3761, -33.8023], [18.3739, -33.7964],
        [18.3732, -33.7917], [18.3689, -33.7896], [18.3631, -33.7902], [18.3616, -33.7946], [18.358, -33.7967], [18.3566, -33.8019]],
};

const OUT = new URL("../src/components/home/outline.json", import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), "outlines-"));

// The spot list is the source of truth for where spots are; read it rather than repeating coordinates here
const spotSource = readFileSync(new URL("../src/config/spots.ts", import.meta.url), "utf8");
const points = [...spotSource.matchAll(/coordinates: \[(-?[\d.]+), (-?[\d.]+)\]/g)].map(([, lon, lat]) => [Number(lon), Number(lat)]);

const mercatorY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const latFromMercatorY = (y) => (Math.atan(Math.exp(y)) * 360) / Math.PI - 90;

/** Spots' extent plus margin, widened on one axis so it has the card's aspect ratio in Mercator space */
const frame = (points) => {
    const lons = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    const padLon = Math.max((Math.max(...lons) - Math.min(...lons)) * MARGIN, MIN_MARGIN);
    const padLat = Math.max((Math.max(...lats) - Math.min(...lats)) * MARGIN, MIN_MARGIN);
    let west = Math.min(...lons) - padLon, east = Math.max(...lons) + padLon;
    let south = mercatorY(Math.min(...lats) - padLat), north = mercatorY(Math.max(...lats) + padLat);

    const toRad = Math.PI / 180;
    const width = (east - west) * toRad;
    const height = north - south;
    if (width / height < WIDTH / HEIGHT) {
        const grow = (height * (WIDTH / HEIGHT) - width) / toRad / 2;
        west -= grow;
        east += grow;
    } else {
        const grow = (width / (WIDTH / HEIGHT) - height) / 2;
        south -= grow;
        north += grow;
    }
    return [west, latFromMercatorY(south), east, latFromMercatorY(north)];
};

const download = (path) => {
    const name = path.split("/").pop();
    execFileSync("curl", ["-sSL", "-o", join(tmp, `${name}.zip`), `https://naciscdn.org/naturalearth/${path}.zip`]);
    execFileSync("unzip", ["-oq", join(tmp, `${name}.zip`), "-d", join(tmp, name)]);
    return join(tmp, name, `${name}.shp`);
};

const run = (...args) => execFileSync(process.execPath, [mapshaper, "-quiet", ...args], { stdio: "inherit" });
const geojson = ["format=geojson", "geojson-type=FeatureCollection"];

// Chaikin corner cutting: each pass replaces every corner with two points a quarter of the way along its edges
const chaikin = (points, closed, passes = 2) => {
    let pts = points;
    for (let pass = 0; pass < passes; pass++) {
        const ring = closed ? pts.slice(0, -1) : pts;
        if (ring.length < 3) return pts;
        const next = closed ? [] : [ring[0]];
        const count = closed ? ring.length : ring.length - 1;
        for (let i = 0; i < count; i++) {
            const [ax, ay] = ring[i];
            const [bx, by] = ring[(i + 1) % ring.length];
            next.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
        }
        if (closed) next.push(next[0]);
        else next.push(ring[ring.length - 1]);
        pts = next;
    }
    return pts;
};

/** GeoJSON file → one SVG path string, projected into the WIDTH × HEIGHT frame */
const toPath = (path, [west, south, east, north], closed) => {
    const top = mercatorY(north), bottom = mercatorY(south);
    const project = ([lon, lat]) => [
        Math.round(((lon - west) / (east - west)) * WIDTH * 10) / 10,
        Math.round(((top - mercatorY(lat)) / (top - bottom)) * HEIGHT * 10) / 10,
    ];
    const lines = [];
    for (const { geometry } of JSON.parse(readFileSync(path, "utf8")).features) {
        if (!geometry) continue;
        const parts = geometry.type === "Polygon" ? geometry.coordinates
            : geometry.type === "MultiPolygon" ? geometry.coordinates.flat()
            : geometry.type === "LineString" ? [geometry.coordinates]
            : geometry.type === "MultiLineString" ? geometry.coordinates : [];
        for (const part of parts) {
            const points = chaikin(part, closed).map(project)
                .filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
            if (points.length < 2) continue;
            lines.push(`M${points.map((p) => p.join(" ")).join("L")}${closed ? "Z" : ""}`);
        }
    }
    return lines.join("");
};

/** Elevation in metres over Web Mercator global pixels at `z`, from the Terrarium tiles covering [x0, x1] × [y0, y1] */
const elevationTiles = async (z, x0, x1, y0, y1) => {
    const cols = (x1 - x0 + 1) * 256, rows = (y1 - y0 + 1) * 256;
    const grid = new Float32Array(cols * rows);
    const tiles = [];
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) tiles.push([tx, ty]);

    // A few at a time: quick, without hammering the bucket
    for (let i = 0; i < tiles.length; i += 8) {
        await Promise.all(tiles.slice(i, i + 8).map(async ([tx, ty]) => {
            const response = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${tx}/${ty}.png`);
            if (!response.ok) throw new Error(`Elevation tile ${z}/${tx}/${ty}: HTTP ${response.status}`);
            const { data } = PNG.sync.read(Buffer.from(await response.arrayBuffer()));
            for (let py = 0; py < 256; py++) {
                for (let px = 0; px < 256; px++) {
                    const k = (py * 256 + px) * 4;
                    // Terrarium: metres = R × 256 + G + B / 256 − 32768
                    grid[((ty - y0) * 256 + py) * cols + (tx - x0) * 256 + px] = data[k] * 256 + data[k + 1] + data[k + 2] / 256 - 32768;
                }
            }
        }));
    }
    return { grid, cols, rows, originX: x0 * 256, originY: y0 * 256 };
};

/**
 * Writes the shaded relief for the frame [west, south, east, north] to TERRAIN_OUT, and returns how far above the frame
 * it starts. Both the tiles and the map are Web Mercator, so each image pixel is a plain rectangle of tile pixels:
 * the elevations are averaged into the image's pixels first, then shaded at that size, so the light falls on the
 * shapes the map can actually show.
 */
const terrain = async ([west, south, east, north]) => {
    const z = TERRAIN_ZOOM;
    const worldPx = 256 * 2 ** z;
    const top = mercatorY(north) + (mercatorY(north) - mercatorY(south)) * TERRAIN_ABOVE;
    const bottom = mercatorY(south);
    const width = TERRAIN_WIDTH;
    const height = Math.round(width * ((top - bottom) / ((east - west) * (Math.PI / 180))));

    // Global pixel edges of the image, in tile pixels
    const left = ((west + 180) / 360) * worldPx, right = ((east + 180) / 360) * worldPx;
    const upper = ((1 - top / Math.PI) / 2) * worldPx, lower = ((1 - bottom / Math.PI) / 2) * worldPx;
    const dem = await elevationTiles(z, Math.floor(left / 256), Math.floor((right - 1e-9) / 256), Math.floor(upper / 256), Math.floor((lower - 1e-9) / 256));

    // Box-average the tile pixels under each image pixel
    const elevation = new Float32Array(width * height);
    const stepX = (right - left) / width, stepY = (lower - upper) / height;
    for (let j = 0; j < height; j++) {
        const ya = Math.floor(upper + j * stepY - dem.originY), yb = Math.max(ya + 1, Math.floor(upper + (j + 1) * stepY - dem.originY));
        for (let i = 0; i < width; i++) {
            const xa = Math.floor(left + i * stepX - dem.originX), xb = Math.max(xa + 1, Math.floor(left + (i + 1) * stepX - dem.originX));
            let sum = 0, count = 0;
            for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) { sum += dem.grid[y * dem.cols + x]; count++; }
            elevation[j * width + i] = Math.max(sum / count, 0);
        }
    }

    // Hillshade (Horn's slope; the usual GIS formula). Mercator is conformal, so a pixel is square on the ground: its
    // size is the width's ground distance at that row's latitude.
    const rad = Math.PI / 180;
    const zenith = (90 - LIGHT_ALTITUDE) * rad;
    const azimuth = ((360 - LIGHT_AZIMUTH + 90) % 360) * rad;
    const flat = Math.cos(zenith);
    const at = (i, j) => elevation[Math.min(height - 1, Math.max(0, j)) * width + Math.min(width - 1, Math.max(0, i))];
    const pixels = Buffer.alloc(width * height * 4, 255);
    for (let j = 0; j < height; j++) {
        const lat = latFromMercatorY(top - ((j + 0.5) / height) * (top - bottom));
        const cell = ((east - west) / width) * 111_320 * Math.cos(lat * rad);
        for (let i = 0; i < width; i++) {
            const e = elevation[j * width + i];
            const out = (j * width + i) * 4;
            if (e <= 0) { pixels.fill(128, out, out + 3); continue; }
            const [a, b, c, d, f, g, h, k] = [at(i - 1, j - 1), at(i, j - 1), at(i + 1, j - 1), at(i - 1, j), at(i + 1, j), at(i - 1, j + 1), at(i, j + 1), at(i + 1, j + 1)];
            const dzdx = ((c + 2 * f + k) - (a + 2 * d + g)) / (8 * cell);
            const dzdy = ((g + 2 * h + k) - (a + 2 * b + c)) / (8 * cell);
            const slope = Math.atan(TERRAIN_EXAGGERATION * Math.hypot(dzdx, dzdy));
            const aspect = Math.atan2(dzdy, -dzdx);
            const shade = Math.cos(zenith) * Math.cos(slope) + Math.sin(zenith) * Math.sin(slope) * Math.cos(azimuth - aspect);
            // Flat land stays mid grey; high ground gets a touch lighter, so a lit plateau still reads as high
            const value = 128 + (shade - flat) * 200 + Math.min(e, 1600) / 1600 * 18;
            pixels.fill(Math.max(0, Math.min(255, Math.round(value))), out, out + 3);
        }
    }

    writeFileSync(TERRAIN_OUT, jpeg.encode({ data: pixels, width, height }, TERRAIN_QUALITY).data);
    console.log(`Terrain: ${width}×${height}, ${(statSync(TERRAIN_OUT).size / 1024).toFixed(0)} KB`);
    return TERRAIN_ABOVE;
};

console.log("Downloading Natural Earth…");
const land = download("10m/physical/ne_10m_land");
const lakes = download("10m/physical/ne_10m_lakes");
const borders = download("10m/cultural/ne_10m_admin_0_boundary_lines_land");

const bbox = frame(points);
// Clip a little wider than the frame so smoothing never pulls a shape's edge inside the map, and far wider to the north
const [w, s, e, n] = bbox;
const clip = `bbox=${[w - 0.3, s - 0.3, e + 0.3, n + NORTH_EXTRA].join(",")}`;
// About 250 segments across the map: detailed enough to recognise, soft enough to read as artwork
const interval = `interval=${Math.round(((e - w) * 111_000 * Math.cos(((s + n) / 2) * (Math.PI / 180))) / 250)}`;
const file = (name) => join(tmp, `${name}.json`);

run("-i", lakes, "-clip", clip, "-filter", "this.area > 2e7", "-o", file("lakes"), ...geojson);
// mapshaper fails on an empty erase layer, and plenty of coasts have no sizeable lake nearby
const hasLakes = JSON.parse(readFileSync(file("lakes"), "utf8")).features.length > 0;
run("-i", land, "-clip", clip, ...(hasLakes ? ["-erase", file("lakes")] : []), "-filter-islands", "min-area=4km2", "remove-empty",
    "-simplify", interval, "keep-shapes", "-explode", "-o", file("land"), ...geojson);
run("-i", borders, "-clip", clip, "-simplify", interval, "-o", file("borders"), ...geojson);

console.log("Downloading elevation…");
const terrainAbove = await terrain(bbox);

writeFileSync(file("islands"), JSON.stringify({
    type: "FeatureCollection",
    features: Object.entries(ISLANDS).map(([name, ring]) => ({ type: "Feature", properties: { name }, geometry: { type: "Polygon", coordinates: [ring] } })),
}));

const outline = {
    width: WIDTH,
    height: HEIGHT,
    bbox: bbox.map((v) => Math.round(v * 1e5) / 1e5),
    land: toPath(file("land"), bbox, true) + toPath(file("islands"), bbox, true),
    borders: toPath(file("borders"), bbox, false),
    // terrain.jpg covers the frame's full width, from this share of its height above it down to its bottom edge
    terrainAbove,
};
console.log(`Outline: ${((outline.land.length + outline.borders.length) / 1024).toFixed(1)} KB`);

writeFileSync(OUT, `${JSON.stringify(outline, null, 1)}\n`);
