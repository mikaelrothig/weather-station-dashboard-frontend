import { useState, useEffect } from 'react';
import {getBackgroundColor} from "./ColorUtils.tsx";
import {LucideMousePointer2} from "lucide-react";

interface Forecast {
    fcst: {
        GUST: number[];
        TMP: number[];
        WINDDIR: number[];
        WINDSPD: number[];
        hours: number[];
        init_h: string;
    };
}

const getLocalTimeDetails = (init_h: string, time: number): { hour: string, date: number, weekday: string } => {
    const offsetHours = -(new Date().getTimezoneOffset()) / 60;
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();


    const totalHours = parseInt(init_h) + time + offsetHours;
    const daysToAdd = Math.floor(totalHours / 24);

    let localHour = totalHours % 24;
    if (localHour < 0) localHour += 24; // Handle negative hours

    let adjustedDay = currentDay + daysToAdd;
    let adjustedMonth = currentMonth;
    let adjustedYear = currentYear;

    while (true) {
        const lastDayOfMonth = new Date(adjustedYear, adjustedMonth, 0).getDate();
        if (adjustedDay > lastDayOfMonth) {
            adjustedDay -= lastDayOfMonth;
            adjustedMonth += 1;
            if (adjustedMonth > 12) {
                adjustedMonth = 1;
                adjustedYear += 1;
            }
        } else {
            break;
        }
    }

    while (adjustedDay < 1) {
        adjustedMonth -= 1;
        if (adjustedMonth < 1) {
            adjustedMonth = 12;
            adjustedYear -= 1;
        }
        adjustedDay += new Date(adjustedYear, adjustedMonth, 0).getDate();
    }

    const weekday = new Date(adjustedYear, adjustedMonth - 1, adjustedDay).toLocaleString('en-US', { weekday: 'short' });

    return {
        hour: localHour.toString().padStart(2, "0")+'h',
        date: adjustedDay,
        weekday: weekday
    };
};

const WindguruComponent = () => {
    const [windData, setWindData] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWindguruData = async () => {
            try {
                const response = await fetch("http://localhost:4000/api/windguru");

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

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    // If data is not available, handle this case
    if (!windData || !windData.fcst || !windData.fcst.WINDSPD) {
        return <p className="text-red-500">No wind data available</p>;
    }

    return (
        <div>
            <div className="flex bg-zinc-900 rounded-md overflow-hidden gap-x-0.5">
                <div className="flex flex-col gap-y-0.5 min-w-36 max-w-36">
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Hour</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Wind speed (knots)</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Wind gusts (knots)</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Wind Direction</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Temperature (°C)</span>
                </div>

                <div className="flex overflow-scroll">
                    {windData.fcst.hours.map((time, index) => {
                        const windSpeed = windData.fcst.WINDSPD[index];
                        const windGust = windData.fcst.GUST[index];
                        const windDir = windData.fcst.WINDDIR[index];
                        const temperature = windData.fcst.TMP[index];
                        const localTimeDetails = getLocalTimeDetails(windData.fcst.init_h, time);

                        const bgWindSpeed = getBackgroundColor(Math.round(windSpeed));
                        const bgGust = getBackgroundColor(Math.round(windGust));
                        const bgTemperature = getBackgroundColor(Math.round(temperature));

                        return (
                            <div key={index} className={`min-w-12 max-w-12 space-y-0.5 ${index < windData.fcst.hours.length - 1 ? "mr-0.5" : ""}`}>
                                <span className="flex flex-col items-center justify-center p-1.5 font-bold bg-zinc-800">
                                    <span>{localTimeDetails.weekday}</span>
                                    <span>{localTimeDetails.date}</span>
                                    <span>{localTimeDetails.hour}</span>
                                </span>
                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgWindSpeed}`}>
                                    {Math.round(windSpeed)}
                                </span>
                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgGust}`}>
                                    {Math.round(windGust)}
                                </span>
                                <span className="flex items-center justify-center p-1.5 font-bold bg-zinc-800">
                                    <LucideMousePointer2 className="fill-zinc-200 min-w-3 min-h-3 max-w-3 max-h-3" style={{ transform: `rotate(${windDir-135}deg)` }} />
                                </span>
                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgTemperature}`}>
                                    {Math.round(temperature)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WindguruComponent;