export interface Country {
    code: string;
    name: string;
    /** How the name reads mid-sentence, e.g. "the Netherlands" */
    inSentence?: string;
    /** IANA timezone; all times on a spot's page are shown in it */
    timeZone: string;
}

export interface Spot {
    name: string;
    url: string;
    region: string;
    country: Country["code"];
    /**
     * Wind directions (degrees the wind blows FROM, clockwise from..to) that blow off the land.
     * Hours with these directions are never suggested as kite windows.
     */
    offshore: [number, number];
}

export const countries: Country[] = [
    { code: "NL", name: "Netherlands", inSentence: "the Netherlands", timeZone: "Europe/Amsterdam" },
    { code: "ZA", name: "South Africa", timeZone: "Africa/Johannesburg" },
];

export const spots: Spot[] = [
    { name: "Blouberg", url: "/", region: "Western Cape", country: "ZA", offshore: [20, 110] },
    { name: "Hermanus", url: "/hermanus", region: "Western Cape", country: "ZA", offshore: [300, 60] },
    { name: "Langebaan", url: "/langebaan", region: "Western Cape", country: "ZA", offshore: [30, 120] },
    { name: "Misty Cliffs", url: "/misty-cliffs", region: "Western Cape", country: "ZA", offshore: [40, 120] },
    { name: "Witsand", url: "/witsand", region: "Western Cape", country: "ZA", offshore: [300, 60] },

    // North Sea coast: beaches face roughly west-northwest, so easterly winds blow off the land
    { name: "Wijk aan Zee", url: "/wijk-aan-zee", region: "Noord-Holland", country: "NL", offshore: [40, 170] },
    { name: "IJmuiden", url: "/ijmuiden", region: "Noord-Holland", country: "NL", offshore: [40, 170] },
    { name: "Zandvoort", url: "/zandvoort", region: "Noord-Holland", country: "NL", offshore: [40, 165] },
    { name: "Noordwijk", url: "/noordwijk", region: "Zuid-Holland", country: "NL", offshore: [45, 175] },
    { name: "Scheveningen", url: "/scheveningen", region: "Zuid-Holland", country: "NL", offshore: [45, 175] },
    // Zeeland: beaches face northwest
    { name: "Brouwersdam", url: "/brouwersdam", region: "Zeeland", country: "NL", offshore: [80, 190] },
    { name: "Domburg", url: "/domburg", region: "Zeeland", country: "NL", offshore: [80, 190] },
    // IJsselmeer, Friesland side: shores face west to southwest
    { name: "Workum", url: "/workum", region: "Friesland", country: "NL", offshore: [20, 140] },
    { name: "Mirns", url: "/mirns", region: "Friesland", country: "NL", offshore: [345, 105] },
    { name: "Makkum", url: "/makkum", region: "Friesland", country: "NL", offshore: [10, 130] },
];

export const getSpotByName = (name: string): Spot | undefined => spots.find((spot) => spot.name === name);

export const getCurrentSpot = (): Spot | undefined => spots.find((spot) => spot.url === window.location.pathname);

export const getCountry = (code: string): Country | undefined => countries.find((country) => country.code === code);

export const getSpotTimeZone = (spot: Spot | undefined): string | undefined => (spot ? getCountry(spot.country)?.timeZone : undefined);

export interface SpotGroup {
    country: Country;
    spots: Spot[];
}

/** Spots grouped by country, with the country you're looking at first */
export const groupSpotsByCountry = (list: Spot[], currentCountry?: string): SpotGroup[] =>
    [...countries]
        .sort((a, b) => Number(b.code === currentCountry) - Number(a.code === currentCountry) || a.name.localeCompare(b.name))
        .map((country) => ({ country, spots: list.filter((spot) => spot.country === country.code) }))
        .filter((group) => group.spots.length > 0);

export const searchSpots = (query: string): Spot[] => {
    const q = query.trim().toLowerCase();
    if (!q) return spots;
    return spots.filter((spot) =>
        [spot.name, spot.region, getCountry(spot.country)?.name ?? ""].some((field) => field.toLowerCase().includes(q)),
    );
};

export const isInSector = (degrees: number, [from, to]: [number, number]): boolean => {
    const d = ((degrees % 360) + 360) % 360;
    return from <= to ? d >= from && d <= to : d >= from || d <= to;
};
