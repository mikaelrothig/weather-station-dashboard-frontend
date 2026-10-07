import { useEffect, useRef } from "react";
import { Forecast, ForecastKind, LiveInterval, LiveReading, SpotInfo, Summary, WaveForecast } from "./types";
import { useApi } from "./useApi";

const spotPath = (spot: string) => encodeURIComponent(spot);

export const useForecast = (spot: string, kind: ForecastKind) => useApi<Forecast>(`/forecast/${spotPath(spot)}/${kind}`);

/** Errors (404) for spots without swell, like lakes */
export const useWaveForecast = (spot: string) => useApi<WaveForecast>(`/forecast/${spotPath(spot)}/waves`);

export const useSpotInfo = (spot: string) => useApi<SpotInfo>(`/spots/${spotPath(spot)}`);

/** Newest reading first */
export const useLiveReadings = (interval: LiveInterval, enabled = true) => useApi<LiveReading[]>(`/live/${interval}`, enabled);

// "Wind now" goes out of date in a tab left open, so coming back after this long fetches the summary again
const SUMMARY_STALE_AFTER = 30 * 60 * 1000;

/** Every spot's wind for today and tomorrow, for the home page */
export const useSummary = () => {
    const summary = useApi<Summary>("/summary");
    const { refetch } = summary;
    const fetchedAt = useRef(Date.now());

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== "visible" || Date.now() - fetchedAt.current < SUMMARY_STALE_AFTER) return;
            fetchedAt.current = Date.now();
            refetch();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [refetch]);

    return summary;
};
