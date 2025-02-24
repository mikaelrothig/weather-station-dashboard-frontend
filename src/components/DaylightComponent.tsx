import { useState, useEffect } from 'react';

import { Sunset } from "lucide-react";

interface Forecast {
    sunrise: number;
    sunset: number;
}

const DaylightComponent = () => {
    const [windData, setWindData] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWindguruData = async () => {
            try {
                const response = await fetch("https://weather-station-dashboard-backend.vercel.app/windguru/wrf-9km");

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data: Forecast = await response.json();
                setWindData(data);
            } catch (error) {
                setError("Failed to fetch Windguru data");
            } finally {
                setLoading(false);
            }
        };

        fetchWindguruData();
    }, []);

    if (loading) return <p className="p-4 font-bold">Loading...</p>;
    if (error) return <p className="p-4 font-bold text-rose-600">{error}</p>;

    if (!windData) {
        return <p className="p-4 font-bold text-rose-600">No wind data available</p>;
    }

    const sunriseHour = parseInt(String(windData.sunrise).split(":")[0], 10);
    const sunsetHour = parseInt(String(windData.sunset).split(":")[0], 10);
    const currentHour = new Date().getHours();

    const sunrisePosition = ((sunriseHour / 23) * 100).toFixed(2);
    const sunsetPosition = ((sunsetHour / 23) * 100).toFixed(2);
    const positionLeft = ((currentHour / 23) * 100).toFixed(2);


    return (
        <div className="rounded-md overflow-hidden flex flex-col h-full">
            <span className="flex items-center justify-center bg-zinc-800 text-zinc-500 font-bold p-1.5 uppercase gap-x-2">
                <Sunset className="stroke-zinc-500 h-4 w-4" />
                SUNSET
            </span>

            <div className="flex flex-col items-center justify-center gap-y-4 h-full w-fit mx-auto">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black">{windData.sunset}</span>

                <div
                    className="relative w-full h-1.5 rounded-full"
                    style={{background: `linear-gradient(to right, #0891b2 0%, #0891b2 ${parseInt(sunrisePosition) - 20}%, #f59e0b ${sunrisePosition}%, #f59e0b ${parseInt(sunsetPosition) - 20}%, #0891b2 ${sunsetPosition}%, #0891b2 100%)`}}
                >
                    <div
                        className="absolute top-[-5px] h-4 w-4 rounded-full bg-zinc-200 border-4 border-zinc-900"
                        style={{ left: `${positionLeft}%`, transform: "translateX(-50%)" }}
                    />
                </div>

                <span className="font-bold">Sunrise: {windData.sunrise}</span>
            </div>
        </div>
    );
};

export default DaylightComponent;