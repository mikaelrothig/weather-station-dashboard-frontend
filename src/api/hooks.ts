import { Forecast, ForecastKind, LiveInterval, LiveReading, SpotInfo, WaveForecast } from "./types";
import { useApi } from "./useApi";

const spotPath = (spot: string) => encodeURIComponent(spot);

export const useForecast = (spot: string, kind: ForecastKind) => useApi<Forecast>(`/forecast/${spotPath(spot)}/${kind}`);

/** Errors (404) for spots without swell, like lakes */
export const useWaveForecast = (spot: string) => useApi<WaveForecast>(`/forecast/${spotPath(spot)}/waves`);

export const useSpotInfo = (spot: string) => useApi<SpotInfo>(`/spots/${spotPath(spot)}`);

/** Newest reading first */
export const useLiveReadings = (interval: LiveInterval, enabled = true) => useApi<LiveReading[]>(`/live/${interval}`, enabled);
