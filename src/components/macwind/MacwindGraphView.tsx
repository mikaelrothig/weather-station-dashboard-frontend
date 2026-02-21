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
    // API returns 60min of data in newest-first order, we want the first 30 (most recent)
    const dataToDisplay = timeFrame === '1min' 
        ? windData.slice(0, 30) 
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

    // Detect current theme via the class Tailwind applies to <html>
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? '#27272A' : '#d4d4d8'; // zinc-800 dark / zinc-300 light
    const tickColor = isDark ? '#A1A1AA' : '#52525b'; // zinc-400 dark / zinc-600 light
    const tooltipBg = isDark ? '#27272A' : '#f4f4f5'; // zinc-800 dark / zinc-100 light
    const tooltipText = isDark ? '#e4e4e7' : '#18181b'; // zinc-200 dark / zinc-900 light
    const tooltipBorder = isDark ? '#3f3f46' : '#d4d4d8'; // zinc-700 dark / zinc-300 light
    const windIconFill = isDark ? '#a1a1aa' : '#52525b'; // zinc-400 dark / zinc-600 light

    return (
        <div className="h-64">
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

                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="time"
                        stroke={gridColor}
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
                                    fill={tickColor}
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
                        stroke={gridColor}
                        width={20}
                        fontWeight="bold"
                        tick={{
                            fill: tickColor,
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
                                <div style={{ backgroundColor: tooltipBg, color: tooltipText, border: `1px solid ${tooltipBorder}` }} className="px-3 py-2 rounded-md shadow">
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
                                        <div style={{ borderTopColor: tooltipBorder }} className="flex items-center gap-x-2 mt-1 pt-1 border-t">
                                            <span>Wind Direction:</span>
                                            <div className="flex items-center gap-x-1">
                                                <LucideMousePointer2
                                                    size={14}
                                                    style={{ transform: `rotate(${rotation}deg)`, fill: tooltipText }}
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
                                            className="stroke-none w-4 h-4"
                                            style={{ fill: windIconFill, transform: `rotate(${rotation}deg)` }}
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