import { spots, type Spot } from "../config/spots";

// Kept as a list for devices that saved several recent spots before; only the first is used now
const LAST_SPOT_KEY = "recent-spots";
const LAUNCH_KEY = "launched";

// Blouberg used to live at "/", which is now the home page; a visit saved before the move still means Blouberg
const MOVED: Record<string, string> = { "/": "/blouberg" };

/** Remembers the spot being viewed, so the installed app can reopen it next launch */
export const rememberSpot = (spot: Spot): void => {
    try {
        localStorage.setItem(LAST_SPOT_KEY, JSON.stringify([spot.url]));
    } catch {
        // Storage unavailable; the app just opens on the home page
    }
};

/** The spot viewed last on this device, if it still exists */
const lastSpotUrl = (): string | undefined => {
    const saved: unknown = JSON.parse(localStorage.getItem(LAST_SPOT_KEY) ?? "[]");
    const url = Array.isArray(saved) && typeof saved[0] === "string" ? MOVED[saved[0]] ?? saved[0] : undefined;
    return spots.some((spot) => spot.url === url) ? url : undefined;
};

/**
 * The installed home-screen app always starts at "/" (the home page). On launch, reopen the spot
 * viewed last instead, so regulars land on their beach; a first launch stays on the home page.
 * Only the first page of a session redirects; navigating to "/" afterwards works as normal.
 */
export const reopenLastSpotOnLaunch = (): void => {
    try {
        const standalone = window.matchMedia("(display-mode: standalone)").matches
            || (navigator as Navigator & { standalone?: boolean }).standalone === true;
        if (!standalone || sessionStorage.getItem(LAUNCH_KEY)) return;
        sessionStorage.setItem(LAUNCH_KEY, "1");

        const last = lastSpotUrl();
        if (last && last !== window.location.pathname) window.location.replace(last);
    } catch {
        // Storage unavailable or unreadable; just stay on the home page
    }
};
