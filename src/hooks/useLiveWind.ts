import { useEffect, useRef, useState } from 'react';
import { useLiveReadings } from '../api/hooks';
import { LiveInterval } from '../api/types';

export type TimeFrame = LiveInterval;

const MINUTE_MS = 60 * 1000;
const REFRESH_MS: Record<TimeFrame, number> = { '1min': MINUTE_MS, '15min': 5 * MINUTE_MS };

/** Live station data for the page, polled while the tab is visible. Disabled for spots without a station. */
export const useLiveWind = (enabled: boolean) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('15min');
    const { data: windData, error, loading, refetch } = useLiveReadings(timeFrame, enabled);

    const refetchRef = useRef(refetch);
    useEffect(() => {
        refetchRef.current = refetch;
    });

    useEffect(() => {
        if (!enabled) return;
        const refreshIfVisible = () => {
            if (document.visibilityState === 'visible') refetchRef.current();
        };
        const id = setInterval(refreshIfVisible, REFRESH_MS[timeFrame]);
        document.addEventListener('visibilitychange', refreshIfVisible);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', refreshIfVisible);
        };
    }, [timeFrame, enabled]);

    return { enabled, timeFrame, setTimeFrame, windData, error, loading, refetch };
};

export type LiveWindState = ReturnType<typeof useLiveWind>;
