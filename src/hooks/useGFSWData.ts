import { useState, useEffect } from "react";

interface Forecast {
    fcst: {
        HTSGW: number[][];
        PERPW: number[][];
    } | null
}

export const useGFSWData = (spot: string) => {
    const [data, setData] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWindguruData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/windguru/gfsw-13km/${spot}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data: Forecast = await response.json();
                setData(data);
            } catch (error) {
                setError(`${error}`);
            } finally {
                setLoading(false);
            }
        };

        fetchWindguruData();
    }, [spot]);

    return { data, loading, error };
};