import { useState, useEffect } from 'react';
import { Thermometer } from "lucide-react";

interface Forecast {
    fcst: {
        TMP: number[];
        hours: number[];
        init_h: string;
    };
}

const TemperatureComponent = () => {
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

    const localHour = new Date().getHours();
    const initHourUTC = parseInt(windData.fcst.init_h, 10);
    const timezoneOffset = new Date().getTimezoneOffset() / -60;
    const currentUTCHour = (localHour - timezoneOffset + 24) % 24;
    const forecastHours = windData.fcst.hours.map(hour => (initHourUTC + hour) % 24);
    const temperatures = windData.fcst.TMP;

    let closestIndex = 0;
    let minDiff = Math.abs(forecastHours[0] - currentUTCHour);

    for (let i = 1; i < forecastHours.length; i++) {
        const diff = Math.abs(forecastHours[i] - currentUTCHour);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }

    const currentTemperature = temperatures[closestIndex];

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="p-4 font-bold text-rose-600">{error}</p>;

    return (
        <div className="rounded-md overflow-hidden flex flex-col h-full">
             <span className="flex items-center justify-center bg-zinc-800 text-zinc-500 font-bold p-1.5 uppercase gap-x-2">
                <Thermometer className="stroke-zinc-500 h-4 w-4" />
                TEMPERATURE
            </span>

            <div className="flex flex-col items-center justify-center gap-y-4 h-full w-fit mx-auto">
                <span className="flex text-5xl sm:text-6xl md:text-7xl font-black">
                    {Math.round(currentTemperature)}
                    <span className="relative top-1 text-base sm:text-lg md:text-xl">°C</span>
                </span>
                <div className="relative w-full h-1.5 rounded-full"
                    style={{background: "linear-gradient(to right, #0891b2 0%, #ca8a04 50%, #e11d48 100%)",}}
                >
                    <div
                        className="absolute top-[-5px] h-4 w-4 rounded-full bg-zinc-200 border-4 border-zinc-900"
                        style={{left: `${(Math.min(Math.max(currentTemperature, 0), 45) / 45) * 100}%`, transform: "translateX(-50%)",}}
                    />
                </div>
            </div>
        </div>
    );
};

export default TemperatureComponent;