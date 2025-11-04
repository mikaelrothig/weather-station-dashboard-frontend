import { useState, useEffect } from "react";

interface Forecast {
    fcst: {
        TMP: number[];
        hours: number[];
        init_d: string;
        init_h: string;
        model_name: string;
    };
    fcst_sea: {
        GUST: number[];
        WINDDIR: number[];
        WINDSPD: number[];
    };
    sunrise: string;
    sunset: string;
    lat: number;
    lon: number;
}

export const useWRFData = (spot: string) => {
    const [data, setData] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWindguruData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/windguru/wrf-9km/${spot}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result: Forecast = await response.json();
                setData(result);
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