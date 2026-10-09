const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
];

export function getDegreesToCompass (deg: number):string {
    const normalized = ((deg % 360) + 360) % 360;
    return directions[Math.round(normalized / 22.5) % 16];

}

/** "–" when there's no direction, which a station reports in calm conditions */
export const getCompassLabel = (deg: number | null): string => (deg === null ? "–" : getDegreesToCompass(deg));