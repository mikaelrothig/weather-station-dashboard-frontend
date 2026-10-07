import { useMemo } from "react";
import { useSummary } from "../api/hooks";
import { getSpotStatus, SpotEntry } from "../components/home/spotStatus";
import { getSpotSlug, spots } from "../utils/spotUtils";
import { useRiderSettings } from "./useRiderSettings";

/**
 * Every spot, each with its wind now and the rider's kite window when the summary has it. A spot the
 * summary has no forecast for (or the whole summary failing) gets a null status.
 */
export const useSpotEntries = () => {
    const { data, loading, error } = useSummary();
    const { weight, kites, profile } = useRiderSettings();

    const entries = useMemo<SpotEntry[]>(() => {
        const bySlug = new Map(data?.spots.map((s) => [s.spot, s]));
        return spots.map((spot) => {
            const summary = bySlug.get(getSpotSlug(spot));
            return { spot, status: summary && !("error" in summary) ? getSpotStatus(spot, summary, { profile, weight, kites }) : null };
        });
    }, [data, profile, weight, kites]);

    return { entries, hasData: !!data, loading, error };
};
