import { useState, useEffect } from 'react';
import { getBackgroundColor } from '../utils/ColorUtils.tsx';
import {LucideMousePointer2, LucideRadio} from 'lucide-react';

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
    // const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFrame, setTimeFrame] = useState<'1min' | '15min'>('1min');

    useEffect(() => {
        const fetchMacwindData = async () => {
            try {
                // setLoading(true);
                setError(null);
                const response = await fetch(`http://localhost:4000/api/macwind/${timeFrame}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data: LiveWind[] = await response.json();
                setWindData(data);
            } catch (error) {
                setError("Failed to fetch Macwind data");
            } finally {
                // setLoading(false);
            }
        };

        fetchMacwindData();
    }, [timeFrame]);

    // if (loading) return <p className="p-4 font-bold min-h-56 min-w-56">Loading...</p>;
    if (error) return <p className="p-4 font-bold text-red-500 min-h-56 min-w-56">{error}</p>;

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <span className="flex gap-x-2 px-3 py-2 w-fit h-fit bg-rose-600 font-bold rounded-md uppercase">
                    <LucideRadio className="stroke-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4"/>
                    LIVE WIND
                </span>

                <div className="flex justify-center bg-zinc-900 w-fit p-1 rounded-md">
                    <button
                        className={`py-1.5 px-3 font-bold rounded-md text-xs ${timeFrame === '1min' ? 'bg-zinc-700' : 'bg-transparent'}`}
                        onClick={() => setTimeFrame('1min')}
                    >
                        1min Average
                    </button>
                    <button
                        className={`py-1.5 px-3 font-bold rounded-md text-xs ${timeFrame === '15min' ? 'bg-zinc-700' : 'bg-transparent'}`}
                        onClick={() => setTimeFrame('15min')}
                    >
                        15min Average
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500">{error}</p>}
            {windData && windData.length === 0 && <p className="text-red-500">No wind data available</p>}

            {windData && windData.length > 0 && (
                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md space-y-0.5">
                    <span className="flex justify-center bg-zinc-800 text-zinc-500 font-bold p-1.5">MAC Wind</span>

                    <div className="flex bg-zinc-900 overflow-hidden gap-x-0.5">
                        <div className="flex flex-col gap-y-0.5 min-w-36 max-w-36">
                            <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Time</span>
                            <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Low (knots)</span>
                            <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Average (knots)</span>
                            <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">High (knots)</span>
                            <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Wind Direction</span>
                        </div>
                        <div className="flex overflow-x-scroll">
                            {windData.map((entry, index) => {
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
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgLow}`}>
                                            {Math.round(low)}
                                        </span>
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgAvg}`}>
                                            {Math.round(avg)}
                                        </span>
                                        <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgHigh}`}>
                                            {Math.round(high)}
                                        </span>
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
