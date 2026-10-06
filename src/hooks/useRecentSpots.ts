import { useEffect, useState } from "react";
import { Spot, spots } from "../utils/spotUtils";

const RECENT_KEY = "recent-spots";
// One more than the footer shows, since the spot you're on is left out
const MAX_RECENT = 6;

const readRecent = (): string[] => {
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((url): url is string => typeof url === "string") : [];
    } catch {
        return [];
    }
};

/** Remembers the spots visited on this device, most recent first, and records the current one */
export const useRecentSpots = (current: Spot | undefined): Spot[] => {
    const [recent] = useState(readRecent);

    useEffect(() => {
        if (!current) return;
        try {
            const next = [current.url, ...readRecent().filter((url) => url !== current.url)].slice(0, MAX_RECENT);
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
            // Storage unavailable; recents just won't carry over
        }
    }, [current]);

    return recent
        .filter((url) => url !== current?.url)
        .map((url) => spots.find((spot) => spot.url === url))
        .filter((spot): spot is Spot => !!spot);
};
