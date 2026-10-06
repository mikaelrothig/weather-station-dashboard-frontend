import { CSSProperties, useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Area, AreaChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SpotInfo } from "../api/types";
import { predictTides } from "../utils/tideUtils";
import { formatClock, getZonedHour, startOfHour } from "../utils/TimeUtils";

interface TideProps {
    spotData: SpotInfo | null;
    loading: boolean;
    error: string | null;
    index: number;
    className?: string;
}

const HOUR_MS = 60 * 60 * 1000;
const AXIS_TICK = { fill: "#71717a", fontSize: 11, fontWeight: 500 };
const TIDE_COLOR = "#38bdf8";

const formatTime = formatClock;

const TideComponent = ({ spotData, loading, error, index, className = "" }: TideProps) => {
    // A 24 hour view that keeps "now" near the left so the coming tides are what you see
    const prediction = useMemo(() => {
        if (!spotData) return null;
        const start = startOfHour(new Date(Date.now() - 3 * HOUR_MS));
        const end = new Date(start.getTime() + 24 * HOUR_MS);
        const tides = predictTides(spotData, start, end);
        return tides ? { ...tides, start: start.getTime(), end: end.getTime() } : null;
    }, [spotData]);

    const now = Date.now();
    const upcoming = prediction?.extremes.filter((e) => e.time > now).slice(0, 4) ?? [];
    const next = upcoming[0];

    // Clock-aligned ticks every 6 hours
    const ticks: number[] = [];
    if (prediction) {
        for (let t = prediction.start; t <= prediction.end; t += HOUR_MS) {
            if (getZonedHour(new Date(t)) % 6 === 0) ticks.push(t);
        }
    }

    return (
        <section aria-label="Tide" className={`card animate-enter flex min-w-0 flex-col p-4 md:p-5 ${className}`} style={{ "--i": index } as CSSProperties}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Tide</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                        {prediction?.datum === "MSL" ? "Metres from mean sea level" : "Metres above chart datum"}
                    </p>
                </div>
                {prediction && (
                    <div className="animate-fade text-right">
                        <p className="flex items-center justify-end gap-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-50">
                            {prediction.rising
                                ? <ArrowUp className="size-4 text-sky-400" aria-label="Rising" />
                                : <ArrowDown className="size-4 text-sky-400" aria-label="Falling" />}
                            {prediction.now.toFixed(1)}
                            <span className="text-sm font-medium text-zinc-500">m</span>
                        </p>
                        {next && (
                            <p className="text-xs text-zinc-400">
                                {next.high ? "High" : "Low"} at <span className="font-medium tabular-nums text-zinc-200">{formatTime(next.time)}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="mt-4 h-40 animate-pulse rounded-lg bg-white/[0.04]" aria-busy="true" />
            ) : error ? (
                <p className="mt-4 text-sm text-zinc-500">Tide data unavailable</p>
            ) : !prediction ? (
                <p className="mt-4 text-sm text-zinc-500">No tide data for this spot</p>
            ) : (
                <div className="animate-fade mt-3 flex flex-1 flex-col">
                    {/* Fixed height: the curve's slope is the information, so its proportions never follow the card next to it */}
                    <div className="-mx-1 h-40">
                        <ResponsiveContainer>
                            <AreaChart data={prediction.timeline} margin={{ top: 18, right: 16, bottom: 0, left: 16 }}>
                                <defs>
                                    <linearGradient id="tide-fill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={TIDE_COLOR} stopOpacity={0.25} />
                                        <stop offset="100%" stopColor={TIDE_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="time"
                                    type="number"
                                    domain={[prediction.start, prediction.end]}
                                    ticks={ticks}
                                    tickFormatter={formatTime}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={AXIS_TICK}
                                />
                                <YAxis hide domain={["dataMin - 0.2", "dataMax + 0.2"]} />
                                <Tooltip
                                    isAnimationActive={false}
                                    cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                                    content={({ active, payload }) => {
                                        const point = payload?.[0]?.payload as { time: number; level: number } | undefined;
                                        if (!active || !point) return null;
                                        return (
                                            <div className="card px-2.5 py-1.5 text-xs">
                                                <span className="tabular-nums text-zinc-400">{formatTime(point.time)}</span>
                                                <span className="ml-2 font-medium tabular-nums text-zinc-100">{point.level.toFixed(2)} m</span>
                                            </div>
                                        );
                                    }}
                                />
                                <ReferenceLine x={now} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
                                <Area
                                    dataKey="level"
                                    type="monotone"
                                    stroke={TIDE_COLOR}
                                    strokeWidth={2}
                                    fill="url(#tide-fill)"
                                    isAnimationActive={false}
                                    activeDot={{ r: 4, fill: "#fafafa", stroke: "#111113", strokeWidth: 2 }}
                                />
                                {prediction.extremes.map((e) => (
                                    <ReferenceDot
                                        key={e.time}
                                        x={e.time}
                                        y={e.level}
                                        r={3}
                                        fill={TIDE_COLOR}
                                        stroke="#111113"
                                        strokeWidth={2}
                                        label={{ value: formatTime(e.time), position: e.high ? "top" : "bottom", fill: "#a1a1aa", fontSize: 10, offset: 6 }}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                        {upcoming.map((e) => (
                            <li key={e.time} className="rounded-lg bg-white/[0.04] px-2.5 py-2">
                                <p className="text-[11px] font-medium text-zinc-500">{e.high ? "High" : "Low"}</p>
                                <p className="text-sm font-semibold tabular-nums text-zinc-100">{formatTime(e.time)}</p>
                                <p className="text-xs tabular-nums text-zinc-400">{e.level.toFixed(1)} m</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default TideComponent;
