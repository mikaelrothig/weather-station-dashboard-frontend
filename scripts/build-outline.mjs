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
 * Run after adding a spot: npm run outlines
 * (downloads ~10 MB from naciscdn.org into a temp folder; the output is committed)
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

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

const outline = {
    width: WIDTH,
    height: HEIGHT,
    bbox: bbox.map((v) => Math.round(v * 1e5) / 1e5),
    land: toPath(file("land"), bbox, true),
    borders: toPath(file("borders"), bbox, false),
};
console.log(`Outline: ${((outline.land.length + outline.borders.length) / 1024).toFixed(1)} KB`);

writeFileSync(OUT, `${JSON.stringify(outline, null, 1)}\n`);
