import { useState, useEffect, useRef } from 'react';
import { getBackgroundColor } from '../utils/ColorUtils.tsx';
import { LucideMinus, LucideMousePointer2, LucidePlus, LucideRadio, LucideRefreshCw } from 'lucide-react';

interface LiveWind {
    dirDegrees: string;
    high: string;
    low: string;
    time: string;
    date: string;
    avg: string;
    dir: string;
}

const MacwindComponent = () => {
    const [windData, setWindData] = useState<LiveWind[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeFrame, setTimeFrame] = useState<'1min' | '15min'>('1min');
    const [loading, setLoading] = useState<boolean>(false);
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const fetchMacwindData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/macwind/${timeFrame}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: LiveWind[] = await response.json();
            setWindData(data);
        } catch (error) {
            setError("Failed to fetch Macwind data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMacwindData();

        const handleResize = () => {
            setShowLabels(window.innerWidth >= 512);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [timeFrame]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [windData]);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="flex gap-x-2 px-3 py-2 w-fit h-fit bg-rose-600 font-bold rounded-md uppercase">
                    <LucideRadio className="stroke-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4" />
                    <div className="flex gap-x-1">
                        LIVE <span className="hidden sm:block">WIND</span>
                    </div>
                </span>

                <div className="flex gap-x-2">
                    <button
                        className="px-3 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800"
                        onClick={fetchMacwindData}
                        disabled={loading}
                    >
                        <LucideRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <div className="flex justify-center bg-zinc-900 w-fit p-1 rounded-md items-center">
                        <button
                            className={`py-1.5 px-3 font-bold rounded-md text-xs ${timeFrame === '1min' ? 'bg-zinc-700' : 'bg-transparent'}`}
                            onClick={() => setTimeFrame('1min')}
                        >
                            <div className="flex gap-x-1">
                                1min <span className="hidden sm:block">Avg</span>
                            </div>
                        </button>
                        <button
                            className={`py-1.5 px-3 font-bold rounded-md text-xs ${timeFrame === '15min' ? 'bg-zinc-700' : 'bg-transparent'}`}
                            onClick={() => setTimeFrame('15min')}
                        >
                            <div className="flex gap-x-1">
                                15min <span className="hidden sm:block">Avg</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {error && <p className="p-4 font-bold text-rose-600 text-wrap">{error}</p>}
            {windData && windData.length === 0 && <p className="p-4 font-bold text-zinc-600">No wind data available.<br/>Likely due to loadshedding.</p>}

            {windData && windData.length > 0 && (
                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md space-y-0.5">
                    <div className="flex gap-x-0.5">
                        <button
                            className="px-2.5 p-1.5 bg-zinc-800 hover:bg-zinc-700"
                            onClick={() => setShowLabels(!showLabels)}
                        >
                            {showLabels ? <LucideMinus className="w-4 h-4" /> : <LucidePlus className="w-4 h-4" />}
                        </button>
                        <span className="flex justify-center w-full bg-zinc-800 text-zinc-500 font-bold p-1.5">MAC Wind</span>
                    </div>

                    <div className="flex bg-zinc-900 gap-x-0.5">
                        {showLabels && (
                            <div className="flex flex-col gap-y-0.5 min-w-36 max-w-36">
                                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Time</span>
                                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Low (knots)</span>
                                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Average (knots)</span>
                                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">High (knots)</span>
                                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Wind Direction</span>
                            </div>
                        )}
                        <div ref={scrollContainerRef} className="flex overflow-x-scroll">
                            {windData.slice().reverse().map((entry, index) => {
                                const low = parseFloat(entry.low);
                                const avg = parseFloat(entry.avg);
                                const high = parseFloat(entry.high);
                                const windDir = parseFloat(entry.dirDegrees);

                                const bgLow = getBackgroundColor(Math.round(low));
                                const bgAvg = getBackgroundColor(Math.round(avg));
                                const bgHigh = getBackgroundColor(Math.round(high));

                                return (
                                    <div key={index} className={`min-w-12 max-w-12 space-y-0.5 ${index < windData.length - 1 ? 'mr-0.5' : ''}`}>
                                        <span className="flex items-center justify-center p-1.5 font-bold bg-zinc-800">
                                            {entry.time}
                                        </span>
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgLow}`}>{Math.round(low)}</span>
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgAvg}`}>{Math.round(avg)}</span>
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgHigh}`}>{Math.round(high)}</span>
                                        <span className="flex items-center justify-center p-1.5 font-bold bg-zinc-800">
                                            <LucideMousePointer2 className="fill-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4" style={{ transform: `rotate(${windDir - 135}deg)` }} />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MacwindComponent;