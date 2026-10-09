import { useState } from 'react';
import { createPortal } from 'react-dom';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area, Line } from 'recharts';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { LiveInterval, LiveReading } from '../../api/types';
import { createGradientStops } from '../../utils/gradientUtils';
import { getCompassLabel } from '../../utils/dataUtils';
import { formatReadingTime, getReadingTime } from '../../utils/conditionsUtils';
import { getMinutesOfDay } from '../../utils/timeUtils';
import { getGraphStrokeColor } from '../../utils/colorUtils';
import { DirectionArrow } from '../ui/DirectionArrow';

interface MacwindGraphViewProps {
    windData: LiveReading[];
    timeFrame: LiveInterval;
}

const AXIS_TICK = { fill: '#71717a', fontSize: 11, fontWeight: 500 };

interface Point {
    time: string;
    low: number;
    avg: number;
    high: number;
    direction: number | null;
}

// One fixed line above the chart: the latest reading, or whichever point is being scrubbed.
// Pinned instead of floating so a finger on a phone never covers it.
const Readout = ({ point, label, overlay = false }: { point: Point; label: string; overlay?: boolean }) => (
    <div className={`flex h-9 items-center gap-x-3 text-xs ${overlay ? 'absolute inset-0 bg-surface' : ''}`}>
        <span className="w-14 shrink-0 font-medium tabular-nums text-zinc-400">{label}</span>
        <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: getGraphStrokeColor(point.avg) }} aria-hidden="true" />
            <span className="text-base font-semibold tabular-nums text-zinc-50">{Math.round(point.avg)}</span>
            <span className="text-zinc-500">kn</span>
        </span>
        <span className="tabular-nums text-zinc-400">
            {Math.round(point.low)}–{Math.round(point.high)} kn
        </span>
        <span className="ml-auto flex items-center gap-1 font-medium text-zinc-200">
            {point.direction !== null && <DirectionArrow degrees={point.direction} className="size-3 fill-zinc-300 stroke-none" />}
            {getCompassLabel(point.direction)}
        </span>
    </div>
);

export const MacwindGraphView = ({ windData, timeFrame }: MacwindGraphViewProps) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [readoutSlot, setReadoutSlot] = useState<HTMLDivElement | null>(null);

    // For 1min timeframe, only show the most recent 30 minutes
    // API returns 60min of data in newest-first order, we want the first 30 (most recent)
    // On a phone at the beach only the recent trend matters, so 15-minute data is cut to the last 4 hours
    const dataToDisplay = timeFrame === '1min'
        ? windData.slice(0, 30)
        : isDesktop ? windData : windData.slice(0, 16);

    const graphData = dataToDisplay
        .slice()
        .reverse()
        .map((entry) => ({
            time: formatReadingTime(entry),
            minutes: getMinutesOfDay(getReadingTime(entry)),
            low: entry.lull,
            avg: entry.speed,
            high: entry.gust,
            // Area draws a band when its value is a [bottom, top] pair
            range: [entry.lull, entry.gust] as [number, number],
            direction: entry.direction,
            windDirection: 0, // Constant value for flat line
        }));

    const avgStops = createGradientStops(graphData.map(d => d.avg));

    // Label whole hours (15m) or every 10 minutes (1m); Recharts drops labels that would collide on narrow screens
    const ticks = graphData
        .filter(({ minutes }) => (timeFrame === '1min' ? minutes % 10 === 0 : minutes % 60 === 0))
        .map((d) => d.time);

    // Thin out the direction arrows so they don't collide on dense series
    const arrowEvery = graphData.length > 40 ? 2 : 1;

    const latest = graphData[graphData.length - 1];

    return (
        <div className="px-2 md:px-3">
            <div ref={setReadoutSlot} className="relative mx-2 mb-1" aria-live="off">
                {latest && <Readout point={latest} label={latest.time} />}
            </div>
            <div className="h-56 touch-pan-y md:h-72">
                <ResponsiveContainer>
                    <ComposedChart data={graphData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="macwind-avg" x1="0" y1="0" x2="1" y2="0">
                                {avgStops.map((s, i) => (
                                    <stop key={i} offset={s.offset} stopColor={s.color} />
                                ))}
                            </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={AXIS_TICK}
                            ticks={ticks}
                            interval="preserveStartEnd"
                            minTickGap={28}
                        />
                        <YAxis axisLine={false} tickLine={false} width={28} tick={AXIS_TICK} />
                        <Tooltip
                            isAnimationActive={false}
                            cursor={{ stroke: 'rgba(255,255,255,0.3)' }}
                            wrapperStyle={{ display: 'none' }}
                            content={({ active, payload, label }) => {
                                const point = payload?.[0]?.payload as Point | undefined;
                                if (!active || !point || !readoutSlot) return null;
                                return createPortal(<Readout point={point} label={String(label)} overlay />, readoutSlot);
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="range"
                            name="Low–high"
                            fill="rgba(255,255,255,0.07)"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth={1}
                            activeDot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="avg"
                            name="Average"
                            stroke="url(#macwind-avg)"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            dot={false}
                            activeDot={{ r: 4, fill: '#fafafa', stroke: '#111113', strokeWidth: 2 }}
                            isAnimationActive={false}
                        />
                        {isDesktop && <Line
                            dataKey="windDirection"
                            stroke="transparent"
                            name="Wind Direction"
                            strokeWidth={0}
                            isAnimationActive={false}
                            activeDot={false}
                            dot={(props) => {
                                const { cx, cy, index } = props;
                                if (cx === undefined || cy === undefined || index === undefined || index % arrowEvery !== 0) {
                                    return <g key={`wind-${index}`} />;
                                }

                                const degrees = graphData[index]?.direction;
                                if (degrees === null || degrees === undefined) return <g key={`wind-${index}`} />;
                                const rotation = degrees + 180;

                                return (
                                    <path
                                        key={`wind-${index}`}
                                        d="M0,-5 L3.5,4 L0,2 L-3.5,4 Z"
                                        fill="#52525b"
                                        transform={`translate(${cx},${cy - 8}) rotate(${rotation})`}
                                    />
                                );
                            }}
                        />}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-2 text-xs text-zinc-500">
                <li className="flex items-center gap-1.5">
                    <svg width="16" height="6" aria-hidden="true">
                        <line x1="1" y1="3" x2="15" y2="3" stroke="#a1a1aa" strokeWidth={2.5} strokeLinecap="round" />
                    </svg>
                    Average
                </li>
                <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-4 rounded-sm bg-white/[0.12] ring-1 ring-inset ring-white/[0.15]" aria-hidden="true" />
                    Low–high range
                </li>
                <li className="ml-auto">Knots</li>
            </ul>
        </div>
    );
};
