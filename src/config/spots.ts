// Plain data with no browser APIs, so vite.config.ts can read it too (it writes one HTML page per spot)

/** Every spot is in South Africa; all times on every page are shown in this timezone */
export const TIME_ZONE = "Africa/Johannesburg";

export interface Spot {
    name: string;
    url: string;
    /** Shown under the name, e.g. "Western Cape" */
    region: string;
    /**
     * Wind directions (degrees the wind blows FROM, clockwise from..to) that blow off the land.
     * Hours with these directions are never suggested as kite windows.
     */
    offshore: [number, number];
    /** [longitude, latitude] of the forecast point, as the backend's Windguru config has it */
    coordinates: [number, number];
    /** Has the MAC Wind weather station, so its page shows live wind */
    liveStation?: boolean;
}

/**
 * The source of truth for the spot list: the home page, navigation, the generated spot pages and the map outline all
 * read it. In order along the coast, from the West Coast round to the south coast, so lists read like the map.
 */
export const spots: Spot[] = [
    { name: "Langebaan", url: "/langebaan", region: "Western Cape", offshore: [30, 120], coordinates: [18.03, -33.08] },
    { name: "Melkbos", url: "/melkbos", region: "Western Cape", offshore: [20, 110], coordinates: [18.44, -33.7] },
    { name: "Blouberg", url: "/blouberg", region: "Western Cape", offshore: [20, 110], coordinates: [18.47, -33.82], liveStation: true },
    { name: "Misty Cliffs", url: "/misty-cliffs", region: "Western Cape", offshore: [40, 120], coordinates: [18.36, -34.18] },
    { name: "Hermanus", url: "/hermanus", region: "Western Cape", offshore: [300, 60], coordinates: [19.231, -34.431] },
    { name: "Witsand", url: "/witsand", region: "Western Cape", offshore: [300, 60], coordinates: [20.854, -34.404] },
];
