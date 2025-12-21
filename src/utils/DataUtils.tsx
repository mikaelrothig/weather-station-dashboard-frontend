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
export function getCompasstoDegrees (dir: string):number {
    const index = directions.indexOf(dir.toUpperCase());
    return index * 22.5;
}