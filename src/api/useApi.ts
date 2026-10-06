import { useCallback, useEffect, useRef, useState } from "react";

/** GETs a path on the backend. `refetch` reloads it, keeping the current data on screen meanwhile */
export const useApi = <T>(path: string, enabled = true) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);
    // Only the latest request may update state, so a slow answer for an old path can't overwrite a newer one
    const latestRequest = useRef(0);

    const load = useCallback(async () => {
        const request = ++latestRequest.current;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const body: T = await response.json();
            if (request === latestRequest.current) setData(body);
        } catch (e) {
            if (request === latestRequest.current) setError(`${e}`);
        } finally {
            if (request === latestRequest.current) setLoading(false);
        }
    }, [path]);

    useEffect(() => {
        if (enabled) load();
    }, [load, enabled]);

    return { data, loading, error, refetch: load };
};
