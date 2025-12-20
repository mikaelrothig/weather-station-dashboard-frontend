import { useState, useEffect, useRef } from 'react';
import { getWindBackgroundColor, getGraphStrokeColor } from '../utils/ColorUtils.tsx';
import { LucideMinus, LucideMousePointer2, LucidePlus, LucideRadio, LucideRefreshCw } from 'lucide-react';
import { XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

interface LiveWind {
    dirDegrees: string;
    high: string;
    low: string;
    time: string;
    date: string;
    avg: string;
    dir: string;
}

const createGradientStops = (data: number[]) => {
    if (data.length === 0) return [{ offset: '0%', color: '#0284c7' }];

    return data.map((value, i) => {
        const offset = (i / (data.length - 1)) * 100;
        const color = getGraphStrokeColor(value);
        return { offset: `${offset}%`, color };
    });
};

const MacwindComponent = () => {
    const [windData, setWindData] = useState<LiveWind[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeFrame, setTimeFrame] = useState<'1min' | '15min'>('1min');
    const [loading, setLoading] = useState<boolean>(false);
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [graphView, setGraphView] = useState<boolean>(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [showText, setShowText] = useState<boolean>(() => {
        const saved = localStorage.getItem('macwind-show-direction-text');
        return saved === 'true';
    });

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
            setError(`${error}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleDirection = () => {
        setShowText(prev => !prev);
    };

    useEffect(() => {
        fetchMacwindData();

        const handleResize = () => {
            const width = window.innerWidth;

            setShowLabels(width >= 512);

            if (width < 1280) {
                setGraphView(false);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // run once on mount

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [timeFrame]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [windData]);

    useEffect(() => {
        localStorage.setItem(
            'macwind-show-direction-text',
            String(showText)
        );
    }, [showText]);

    const graphData = windData
        ? windData.slice().reverse().map(entry => ({
            time: entry.time,
            low: parseFloat(entry.low),
            avg: parseFloat(entry.avg),
            high: parseFloat(entry.high),
        }))
        : [];

    const lowStops = createGradientStops(graphData.map(d => d.low));
    const avgStops = createGradientStops(graphData.map(d => d.avg));
    const highStops = createGradientStops(graphData.map(d => d.high));

    return (
        <div className="space-y-2">
            {error && <p className="p-4 font-bold text-rose-600 text-wrap">{error}</p>}
            {windData && windData.length === 0 && (
                <p className="p-4 font-bold text-zinc-600">
                    No wind data available.<br/>Likely due to loadshedding.
                </p>
            )}

            {windData && windData.length > 0 && (
                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md space-y-0.5">
                    <div className="flex gap-x-0.5 pb-3">
                        {!graphView && (
                            <button className="px-2.5 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-tl-md" onClick={() => setShowLabels(!showLabels)}>
                                {showLabels ? <LucideMinus className="w-4 h-4" /> : <LucidePlus className="w-4 h-4" />}
                            </button>
                        )}
                        <span className="flex flex-grow justify-center w-full bg-zinc-800 text-zinc-500 font-bold p-1.5">
                            MAC Wind
                        </span>
                        <span className="flex gap-x-2 px-3 py-1.5 w-fit h-fit bg-rose-600 font-bold rounded-tr-md uppercase items-center">
                            <LucideRadio className="stroke-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4" />
                        </span>
                    </div>

                    <div className="flex w-full bg-zinc-900 rounded-md px-3 pb-3">
                        <div className="hidden xl:block pr-0.5">
                            <button className="px-3 py-1.5 flex flex-grow justify-center bg-zinc-800 lg:hover:bg-zinc-700 rounded-l-md min-w-40 max-w-40" onClick={() => setGraphView(!graphView)}>
                                {!graphView ? (
                                    <span>Toggle Graph Layout</span>
                                ) : (
                                    <span>Toggle Table Layout</span>
                                )}
                            </button>
                        </div>

                        <div className="flex justify-end flex-grow gap-x-0.5">
                            <div className="flex flex-grow h-7 bg-zinc-800 rounded-l-md xl:rounded-none" />

                            <button className="px-3 py-1.5 bg-zinc-800 lg:hover:bg-zinc-700" onClick={fetchMacwindData} disabled={loading}>
                                <LucideRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <div className="flex gap-x-0.5 justify-center w-fit items-center">
                                <button className={`flex gap-x-1 py-1.5 px-3 font-bold text-xs ${timeFrame === '1min' ? 'bg-zinc-700' : 'bg-zinc-800 lg:hover:bg-zinc-700'}`} onClick={() => setTimeFrame('1min')}>
                                    1min <span className="hidden sm:block">Avg</span>
                                </button>
                                <button className={`flex gap-x-1 py-1.5 px-3 font-bold rounded-r-md text-xs ${timeFrame === '15min' ? 'bg-zinc-700' : 'bg-zinc-800 lg:hover:bg-zinc-700'}`} onClick={() => setTimeFrame('15min')}>
                                    15min <span className="hidden sm:block">Avg</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {!graphView ? (
                        // Table view
                        <div className="flex bg-zinc-900 gap-x-0.5">
                            {showLabels && (
                                <div className="flex flex-col gap-y-0.5 min-w-44 max-w-44 pl-3 pb-3">
                                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 rounded-t-md">Time</span>
                                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Low (knots)</span>
                                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Average (knots)</span>
                                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">High (knots)</span>
                                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 rounded-b-md">Wind Direction</span>
                                </div>
                            )}
                            <div className="px-3 pb-3 overflow-x-hidden">
                                <div ref={scrollContainerRef} className="flex overflow-x-scroll no-scrollbar rounded-md">
                                    {windData.slice().reverse().map((entry, index) => {
                                        const low = parseFloat(entry.low);
                                        const avg = parseFloat(entry.avg);
                                        const high = parseFloat(entry.high);
                                        const windDir = parseFloat(entry.dirDegrees);

                                        const bgLow = getWindBackgroundColor(Math.round(low));
                                        const bgAvg = getWindBackgroundColor(Math.round(avg));
                                        const bgHigh = getWindBackgroundColor(Math.round(high));

                                        function degreesToCompass(deg:number):string {
                                            const directions = [
                                                "N", "NNE", "NE", "ENE",
                                                "E", "ESE", "SE", "SSE",
                                                "S", "SSW", "SW", "WSW",
                                                "W", "WNW", "NW", "NNW"
                                            ];

                                            const normalized = ((deg % 360) + 360) % 360;
                                            const index = Math.round(normalized / 22.5) % 16;
                                            return directions[index];
                                        }

                                        return (
                                            <div key={index} className={`min-w-12 max-w-12 space-y-0.5 ${index < windData.length - 1 ? 'mr-0.5' : ''}`}>
                                                <span className="flex items-center justify-center p-1.5 font-bold bg-zinc-800">
                                                    {entry.time}
                                                </span>
                                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgLow}`}>{Math.round(low)}</span>
                                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgAvg}`}>{Math.round(avg)}</span>
                                                <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgHigh}`}>{Math.round(high)}</span>
                                                <span
                                                    className="flex flex-col items-center justify-center p-1.5 font-bold bg-zinc-800 cursor-pointer select-none transition-all duration-150"
                                                    title={`${degreesToCompass(windDir)} (${Math.round(windDir)}°)`}
                                                    onClick={toggleDirection}
                                                >
                                                    {showText ? (
                                                        <span className="text-zinc-200 text-xs">
                                                            {degreesToCompass(windDir)}
                                                        </span>
                                                    ) : (
                                                        <LucideMousePointer2
                                                            className="fill-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4"
                                                            style={{ transform: `rotate(${windDir - 135}deg)` }}
                                                        />
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Graph View
                        <div className="px-3 pb-2 h-64">
                            <ResponsiveContainer>
                                <LineChart data={graphData}>
                                    <defs>
                                        <linearGradient id="gradLow" x1="0" y1="0" x2="1" y2="0">
                                            {lowStops.map((s, i) => (
                                                <stop key={i} offset={s.offset} stopColor={s.color} />
                                            ))}
                                        </linearGradient>
                                        <linearGradient id="gradAvg" x1="0" y1="0" x2="1" y2="0">
                                            {avgStops.map((s, i) => (
                                                <stop key={i} offset={s.offset} stopColor={s.color} />
                                            ))}
                                        </linearGradient>
                                        <linearGradient id="gradHigh" x1="0" y1="0" x2="1" y2="0">
                                            {highStops.map((s, i) => (
                                                <stop key={i} offset={s.offset} stopColor={s.color} />
                                            ))}
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#27272A"
                                        tick={({ x, y, payload, index }) => {
                                            const time = payload.value;
                                            const [, minutes] = time.split(':').map(Number);
                                            const isLastTick = index === graphData.length - 1;

                                            // Determine tick interval rule based on timeframe
                                            const showEvery10Min = timeFrame === '1min';
                                            const showEveryHour = timeFrame === '15min';

                                            let shouldShow = false;
                                            if (showEvery10Min) {
                                                shouldShow = minutes % 10 === 0;
                                            } else if (showEveryHour) {
                                                shouldShow = minutes === 0;
                                            }

                                            if (!shouldShow && !isLastTick) return null;
                                            if (isLastTick && !shouldShow) return null;

                                            return (
                                                <text
                                                    x={x}
                                                    y={y + 15}
                                                    fill="#A1A1AA"
                                                    fontSize={12}
                                                    textAnchor="middle"
                                                >
                                                    {time}
                                                </text>
                                            );
                                        }}
                                        interval={0}
                                        minTickGap={25}
                                    />
                                    <YAxis
                                        stroke="#27272A"
                                        width={20}
                                        tick={{
                                            fill: "#A1A1AA",
                                            fontSize: 12
                                        }}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload || payload.length === 0) return null;
                                            return (
                                                <div className="bg-zinc-800 text-zinc-200 px-3 py-2 rounded-md shadow">
                                                    <div className="font-bold text-sm mb-1">{label}</div>
                                                    {payload.map((entry, idx) => (
                                                        <div key={idx} className="flex justify-between gap-x-2">
                                                            <span style={{ color: entry.color }}>{entry.name}:</span>
                                                            <span>{entry.value} knots</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="high" stroke="url(#gradHigh)" name="High" strokeWidth={2.5} dot={false} />
                                    <Line type="monotone" dataKey="avg" stroke="url(#gradAvg)" name="Average" strokeWidth={2.5} dot={false} />
                                    <Line type="monotone" dataKey="low" stroke="url(#gradLow)" name="Low" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MacwindComponent;