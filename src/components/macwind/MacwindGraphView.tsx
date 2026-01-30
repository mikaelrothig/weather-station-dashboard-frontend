import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { LucideMousePointer2 } from 'lucide-react';
import { LiveWind } from '../../hooks/useMacwindData';
import { createGradientStops } from '../../utils/gradientUtils';
import { getCompasstoDegrees } from '../../utils/DataUtils';

interface MacwindGraphViewProps {
    windData: LiveWind[];
    timeFrame: '1min' | '15min';
}

export const MacwindGraphView = ({ windData, timeFrame }: MacwindGraphViewProps) => {
    // For 1min timeframe, only show the most recent 30 minutes
    const dataToDisplay = timeFrame === '1min' 
        ? windData.slice(-30) 
        : windData;
    
    const graphData = dataToDisplay
        .slice()
        .reverse()
        .map(entry => ({
            time: entry.time,
            low: parseFloat(entry.low),
            avg: parseFloat(entry.avg),
            high: parseFloat(entry.high),
            dir: entry.dir,
            windDirection: 0, // Constant value for flat line
        }));

    const lowStops = createGradientStops(graphData.map(d => d.low));
    const avgStops = createGradientStops(graphData.map(d => d.avg));
    const highStops = createGradientStops(graphData.map(d => d.high));

    return (
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
                                    fontWeight="bold"
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
                        fontWeight="bold"
                        tick={{
                            fill: "#A1A1AA",
                            fontSize: 12
                        }}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            
                            // Find the wind direction data from the payload
                            const windDirEntry = payload.find(entry => entry.dataKey === 'windDirection');
                            const windDir = windDirEntry?.payload?.dir;
                            const rotation = windDir ? getCompasstoDegrees(windDir) - 135 : 0;
                            
                            return (
                                <div className="bg-zinc-800 text-zinc-200 px-3 py-2 rounded-md shadow">
                                    <div className="font-bold text-sm mb-1">{label}</div>
                                    {payload.map((entry, idx) => {
                                        // Skip the wind direction entry in the list since we'll show it separately
                                        if (entry.dataKey === 'windDirection') return null;
                                        
                                        return (
                                            <div key={idx} className="flex justify-between gap-x-2">
                                                <span style={{ color: entry.color }}>{entry.name}:</span>
                                                <span>{entry.value} knots</span>
                                            </div>
                                        );
                                    })}
                                    {windDir && (
                                        <div className="flex items-center gap-x-2 mt-1 pt-1 border-t border-zinc-700">
                                            <span className="text-zinc-200">Wind Direction:</span>
                                            <div className="flex items-center gap-x-1">
                                                <LucideMousePointer2
                                                    className="fill-zinc-200"
                                                    size={14}
                                                    style={{ transform: `rotate(${rotation}deg)` }}
                                                />
                                                <span>{windDir}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }}
                    />
                    {/* <Legend /> */}
                    <Line type="monotone" dataKey="high" stroke="url(#gradHigh)" name="High" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="avg" stroke="url(#gradAvg)" name="Average" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="low" stroke="url(#gradLow)" name="Low" strokeWidth={2.5} dot={false} />
                    <Line 
                        type="monotone" 
                        dataKey="windDirection" 
                        stroke="transparent" 
                        name="Wind Direction" 
                        strokeWidth={0}
                        dot={(props) => {
                            const { cx, cy, index } = props;
                            
                            // Type guard: ensure cx and cy are defined
                            if (cx === undefined || cy === undefined || index === undefined) {
                                return null;
                            }
                            
                            const windDir = graphData[index]?.dir || 'N';
                            const rotation = getCompasstoDegrees(windDir) - 135;
                            
                            return (
                                <foreignObject
                                    x={cx - 10}
                                    y={cy - 10}
                                    width={20}
                                    height={20}
                                    key={`wind-${index}`}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                                        <LucideMousePointer2
                                            className="fill-zinc-500 stroke-none w-4 h-4"
                                            style={{ transform: `rotate(${rotation}deg)` }}
                                        />
                                    </div>
                                </foreignObject>
                            );
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
