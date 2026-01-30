import { useState, useEffect } from 'react';

export interface LiveWind {
    dirDegrees: string;
    high: string;
    low: string;
    time: string;
    date: string;
    avg: string;
    dir: string;
}

export const useMacwindData = (timeFrame: '1min' | '15min') => {
    const [windData, setWindData] = useState<LiveWind[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchMacwindData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/macwind/${timeFrame}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: LiveWind[] = await response.json();
            setWindData(data);
        } catch (error) {
            setError(`${error}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMacwindData();
    }, [timeFrame]);

    return {
        windData,
        error,
        loading,
        refetch: fetchMacwindData,
    };
};
