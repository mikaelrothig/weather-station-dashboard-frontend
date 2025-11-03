import {LucideMinus, LucideMousePointer2, LucidePlus} from "lucide-react";
import {getBackgroundColor} from "../utils/ColorUtils.tsx";
import {getLocalTimeDetails} from "../utils/TimeUtils.tsx";
import { useState, useEffect } from 'react';

interface GFSProps {
    windData: {
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
    } | null;
    loading: boolean;
    error: string | null;
}

const GFSComponent = ({ windData, loading, error }: GFSProps) => {
    const [showLabels, setShowLabels] = useState<boolean>(true);

    useEffect(() => {
        const handleResize = () => setShowLabels(window.innerWidth >= 512);
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (loading) return <p className="p-4 font-bold min-h-56 min-w-56">Loading...</p>;
    if (error) return <p className="p-4 font-bold text-rose-600 min-h-56 min-w-56">{error}</p>;

    if (!windData || !windData.fcst || !windData.fcst_sea.WINDSPD) {
        return <p className="p-4 font-bold text-zinc-600 min-h-56 min-w-56">No wind data available</p>;
    }

    return (
        <div className="space-y-0.5">
            <div className="flex gap-x-0.5 pb-3">
                <button
                    className="px-2.5 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-tl-md"
                    onClick={() => setShowLabels(!showLabels)}
                >
                    {showLabels ? <LucideMinus className="w-4 h-4" /> : <LucidePlus className="w-4 h-4" />}
                </button>
                <span className="flex justify-center w-full bg-zinc-800 text-zinc-500 font-bold p-1.5 rounded-tr-md">{windData.fcst.model_name}</span>
            </div>

            <div className="flex bg-zinc-900 overflow-hidden gap-x-0.5">
                {showLabels && (
                    <div className="flex flex-col gap-y-0.5 min-w-44 max-w-44 pl-3 pb-3">
                        <div className="flex flex-col justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs rounded-t-md">
                            <span className="flex justify-center text-zinc-500">Last updated: </span>
                            <span className="flex justify-center text-zinc-500">{windData.fcst.init_d}</span>
                            <span className="flex justify-center text-zinc-500">{windData.fcst.init_h + ' UTC'}</span>
                        </div>
                        <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Wind speed (knots)</span>
                        <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Wind gusts (knots)</span>
                        <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Wind Direction</span>
                        <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 rounded-b-md">Temperature (°C)</span>
                    </div>
                )}
                <div className="px-3 pb-3 overflow-x-hidden">
                    <div className="flex overflow-x-scroll no-scrollbar rounded-md">
                        {windData.fcst.hours
                            .map((time, index) => ({ time, index }))
                            .filter(({ time }) => time % 2 === 0)
                            .map(({ time, index }) => {

                                const windSpeed = windData.fcst_sea.WINDSPD[index];
                                const windGust = windData.fcst_sea.GUST[index];
                                const windDir = windData.fcst_sea.WINDDIR[index];
                                const temperature = windData.fcst.TMP[index];
                                const localTimeDetails = getLocalTimeDetails(windData.fcst.init_h, time);

                                const bgWindSpeed = getBackgroundColor(Math.round(windSpeed));
                                const bgGust = getBackgroundColor(Math.round(windGust));
                                const bgTemperature = getBackgroundColor(Math.round(temperature));

                                const dayBackground = localTimeDetails.date % 2 === 0 ? "bg-zinc-700" : "bg-zinc-800";

                                return (
                                    <div key={index} className={`min-w-9 max-w-9 space-y-0.5 ${index < windData.fcst.hours.length - 1 ? "mr-0.5" : ""}`}>
                                        <div className={`flex flex-col items-center justify-center p-1.5 font-bold ${dayBackground}`}>
                                            <span>{localTimeDetails.weekday}</span>
                                            <span>{localTimeDetails.date}</span>
                                            <span>{localTimeDetails.hour}</span>
                                        </div>
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgWindSpeed}`}>
                                    {Math.round(windSpeed)}
                                </span>
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgGust}`}>
                                    {Math.round(windGust)}
                                </span>
                                        <span className={`flex items-center justify-center p-1.5 font-bold ${dayBackground}`}>
                                    <LucideMousePointer2 className="fill-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4" style={{ transform: `rotate(${windDir-135}deg)` }} />
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
        </div>
    );
};

export default GFSComponent;