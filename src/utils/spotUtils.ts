export interface Spot {
    abbr: string;
    name: string;
    url: string;
}

export const spots: Spot[] = [
    { abbr: "01", name: "Blouberg", url: "/" },
    { abbr: "02", name: "Hermanus", url: "/hermanus" },
    { abbr: "03", name: "Langebaan", url: "/langebaan" },
    { abbr: "04", name: "Misty Cliffs", url: "/misty-cliffs" },
    { abbr: "05", name: "Witsand", url: "/witsand" },
];
