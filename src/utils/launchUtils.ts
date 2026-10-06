const LAUNCH_KEY = "launched";
const RECENT_KEY = "recent-spots";

/**
 * The installed home-screen app always starts at "/" (Blouberg). On launch, reopen the spot
 * viewed last instead, so someone kiting in the Netherlands doesn't land in Cape Town every time.
 * Only the first page of a session redirects; navigating to "/" afterwards works as normal.
 */
export const reopenLastSpotOnLaunch = (): void => {
    try {
        const standalone = window.matchMedia("(display-mode: standalone)").matches
            || (navigator as Navigator & { standalone?: boolean }).standalone === true;
        if (!standalone || sessionStorage.getItem(LAUNCH_KEY)) return;
        sessionStorage.setItem(LAUNCH_KEY, "1");

        const [last] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
        if (typeof last === "string" && last.startsWith("/") && last !== window.location.pathname) {
            window.location.replace(last);
        }
    } catch {
        // Storage unavailable; just stay on the start page
    }
};
