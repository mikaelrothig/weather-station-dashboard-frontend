import { useState, useEffect } from "react";

interface Forecast {
    fcst: {
        TMP: number[];
        hours: number[];
        init_d: string;
        init_h: string;
        model_name: string;
    },
    fcst_sea: {
        GUST: number[];
        WINDDIR: number[];
        WINDSPD: number[];
    };
}

export const useGFSData = (spot: string) => {
    const [data, setData] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWindguruData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/windguru/gfs-13km/${spot}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data: Forecast = await response.json();
                setData(data);
            } catch (error) {
                setError(`Failed to fetch Windguru data: ${error}`);
            } finally {
                setLoading(false);
            }
        };

        fetchWindguruData();
    }, [spot]);

    return { data, loading, error };
};