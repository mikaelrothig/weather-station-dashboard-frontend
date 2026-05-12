import { PanelLeftClose, PanelLeftOpen, LucideMousePointer2, Wind, Zap, Navigation2, Waves, Timer, Thermometer } from "lucide-react";
import { getWindBackgroundColor, getWaveBackgroundColor, getWavePeriodBackgroundColor } from "../utils/ColorUtils.tsx";
import { getLocalTimeDetails } from "../utils/TimeUtils.tsx";
import { getDegreesToCompass} from "../utils/DataUtils.tsx";
import { useState, useEffect } from "react";

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
    waveData: {
        fcst: {
            HTSGW: number[][];
            PERPW: number[][];
        } | null;
    } | null;
    loading: boolean;
    error: string | null;
}

const GFSComponent = ({ windData, waveData, loading, error }: GFSProps) => {
    const [showLabels, setShowLabels] = useState<boolean>(true);

    const [showWindText, setShowWindText] = useState<boolean>(() => {
        const saved = localStorage.getItem("gfs-show-direction-text");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem(
            "gfs-show-direction-text",
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

    if (!windData || !windData.fcst || !windData.fcst_sea.WINDSPD) {
        return <p className="p-4 font-bold text-zinc-600 min-h-56 min-w-56">No wind data available</p>;
    }

    const flatHTSGW = waveData?.fcst?.HTSGW?.flat() ?? [];
    const flatPERPW = waveData?.fcst?.PERPW?.flat() ?? [];

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
                        ].map(({ icon: Icon, label, unit }) => (
                            <div key={label} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800">
                                <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                <span className="text-xs font-semibold text-zinc-400">{label}</span>
                                {unit && <span className="text-xs text-zinc-600">({unit})</span>}
                            </div>
                        ))}
                        {waveData && (
                            <>
                                {[
                                    { icon: Waves, label: "Height", unit: "m" },
                                    { icon: Timer, label: "Period", unit: "s" },
                                ].map(({ icon: Icon, label, unit }) => (
                                    <div key={label} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800">
                                        <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                        <span className="text-xs font-semibold text-zinc-400">{label}</span>
                                        <span className="text-xs text-zinc-600">({unit})</span>
                                    </div>
                                ))}
                            </>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-b-md">
                            <Thermometer className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                            <span className="text-xs font-semibold text-zinc-400">Temp</span>
                            <span className="text-xs text-zinc-600">(°C)</span>
                        </div>
                    </div>
                )}

                <div className="pb-3 overflow-x-hidden">
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
                                const wave = flatHTSGW[index];
                                const wavePeriod = flatPERPW[index];

                                const bgWindSpeed = getWindBackgroundColor(Math.round(windSpeed));
                                const bgGust = getWindBackgroundColor(Math.round(windGust));
                                const bgTemperature = getWindBackgroundColor(Math.round(temperature));
                                const bgWave = getWaveBackgroundColor(Math.round(wave * 10) / 10);
                                const bgWavePeriod = getWavePeriodBackgroundColor(Math.round(wavePeriod));

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

                                        {waveData && (
                                            <>
                                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgWave}`}>
                                                    {Math.round(wave * 10) / 10}
                                                </span>
                                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgWavePeriod}`}>
                                                    {Math.round(wavePeriod)}
                                                </span>
                                            </>
                                        )}

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