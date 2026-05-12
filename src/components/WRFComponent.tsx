import { PanelLeftClose, PanelLeftOpen, LucideMousePointer2, Wind, Zap, Navigation2, Thermometer } from "lucide-react";
import { getWindBackgroundColor } from "../utils/ColorUtils.tsx";
import { getDegreesToCompass} from "../utils/DataUtils.tsx";
import { getLocalTimeDetails } from "../utils/TimeUtils.tsx";
import { useState, useEffect } from "react";

interface WRFProps {
    windData: {
        fcst: {
            model_name: string;
            init_d: string;
            init_h: string;
            hours: number[];
            TMP: number[];
        };
        fcst_sea: {
            WINDSPD: number[];
            GUST: number[];
            WINDDIR: number[];
        };
    } | null;
    loading: boolean;
    error: string | null;
}

const WRFComponent = ({ windData, loading, error }: WRFProps) => {
    const [showLabels, setShowLabels] = useState<boolean>(true);

    const [showWindText, setShowWindText] = useState<boolean>(() => {
        const saved = localStorage.getItem("wrf-show-direction-text");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem(
            "wrf-show-direction-text",
            String(showWindText)
        );
    }, [showWindText]);

    useEffect(() => {
        const handleResize = () => setShowLabels(window.innerWidth >= 512);
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (loading) return <p className="p-4 font-bold min-h-56 min-w-56">Loading...</p>;
    if (error) return <p className="p-4 font-bold text-rose-600 min-h-56 min-w-56">{error}</p>;
    if (!windData) return <p className="p-4 font-bold text-zinc-600 min-h-56 min-w-56">No wind data available</p>;

    return (
        <div className="space-y-0.5">
            <div className="flex gap-x-2 p-3">
                <button
                    className="px-3 bg-zinc-800 lg:hover:bg-zinc-700 rounded-md h-9"
                    onClick={() => setShowLabels(!showLabels)}
                >
                    {showLabels ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                </button>
                <span className="flex w-full px-3 py-2 bg-zinc-800 text-zinc-500 font-bold items-center rounded-md h-9">
                    {windData.fcst.model_name}
                    </span>
            </div>

            <div className="flex bg-zinc-900 overflow-hidden gap-x-3 px-3">
                {showLabels && (
                    <div className="flex flex-col gap-y-0.5 min-w-40 max-w-40">
                        <div className="flex flex-col justify-center items-start px-3 py-1.5 bg-zinc-800 rounded-t-md">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">Updated</span>
                            <span className="text-xs font-semibold text-zinc-400">{windData.fcst.init_d}</span>
                            <span className="text-xs text-zinc-600">{windData.fcst.init_h} UTC</span>
                        </div>
                        {[
                            { icon: Wind,        label: "Speed",     unit: "knots" },
                            { icon: Zap,         label: "Gusts",     unit: "knots" },
                            { icon: Navigation2, label: "Direction", unit: ""      },
                            { icon: Thermometer, label: "Temp",      unit: "°C",  last: true },
                        ].map(({ icon: Icon, label, unit, last }) => (
                            <div key={label} className={`flex items-center gap-2 px-3 py-1.5 bg-zinc-800 ${last ? "rounded-b-md" : ""}`}>
                                <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                <span className="text-xs font-semibold text-zinc-400">{label}</span>
                                {unit && <span className="text-xs text-zinc-600">({unit})</span>}
                            </div>
                        ))}
                    </div>
                )}
                <div className="pb-3 overflow-x-hidden">
                    <div className="flex overflow-x-scroll no-scrollbar rounded-md">
                        {windData.fcst.hours.map((time, index) => {
                            const windSpeed = windData.fcst_sea.WINDSPD[index];
                            const windGust = windData.fcst_sea.GUST[index];
                            const windDir = windData.fcst_sea.WINDDIR[index];
                            const temperature = windData.fcst.TMP[index];
                            const localTimeDetails = getLocalTimeDetails(windData.fcst.init_h, time);

                            const bgWindSpeed = getWindBackgroundColor(Math.round(windSpeed));
                            const bgGust = getWindBackgroundColor(Math.round(windGust));
                            const bgTemperature = getWindBackgroundColor(Math.round(temperature));

                            const dayBackground = localTimeDetails.date % 2 === 0 ? "bg-zinc-700" : "bg-zinc-800";

                            return (
                                <div key={index} className={`min-w-9 max-w-9 space-y-0.5 ${index < windData.fcst.hours.length - 1 ? "mr-0.5" : ""}`}>
                                    <div className={`flex flex-col items-center justify-center p-1.5 font-bold ${dayBackground}`}>
                                        <span>{localTimeDetails.weekday}</span>
                                        <span>{localTimeDetails.date}</span>
                                        <span>{localTimeDetails.hour}</span>
                                    </div>
                                    <span className={`flex justify-center p-1.5 font-bold text-zinc-950 ${bgWindSpeed}`}>
                                        {Math.round(windSpeed)}
                                    </span>
                                    <span className={`flex justify-center p-1.5 font-bold text-zinc-950 ${bgGust}`}>
                                        {Math.round(windGust)}
                                    </span>
                                    <span className={`flex items-center justify-center p-1.5 font-bold ${dayBackground} cursor-pointer select-none`}
                                        title={`${getDegreesToCompass(windDir)} (${Math.round(windDir)}°)`}
                                        onClick={() => setShowWindText(prev => !prev)}
                                    >
                                        {showWindText ? (
                                            <span className="text-zinc-200 text-xs">
                                                {getDegreesToCompass(windDir)}
                                            </span>
                                        ) : (
                                            <LucideMousePointer2
                                                className="fill-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4"
                                                style={{ transform: `rotate(${windDir - 135}deg)` }}
                                            />
                                        )}
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

export default WRFComponent;