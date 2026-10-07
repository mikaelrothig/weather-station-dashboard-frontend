import { spots, type Spot } from "../config/spots";

export { spots, TIME_ZONE, type Spot } from "../config/spots";

/** The name the backend knows a spot by: "Misty Cliffs" → "mistycliffs", the same rule as its findSpot() */
export const getSpotSlug = (spot: Spot): string => spot.name.replace(/\s+/g, "").toLowerCase();

/** The spot whose page this is. Tolerates "/blouberg.html" and a trailing slash, as `vite preview` serves them */
export const getCurrentSpot = (): Spot | undefined => {
    const path = window.location.pathname.replace(/(\.html|\/)$/, "");
    return spots.find((spot) => spot.url === path);
};

export const isInSector = (degrees: number, [from, to]: [number, number]): boolean => {
    const d = ((degrees % 360) + 360) % 360;
    return from <= to ? d >= from && d <= to : d >= from || d <= to;
};
