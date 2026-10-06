import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChartLine, RefreshCw, Table2, TriangleAlert } from 'lucide-react';
import { LiveReading } from '../api/types';
import { LiveWindState } from '../hooks/useLiveWind';
import { useDirectionToggle } from '../hooks/useDirectionToggle';
import { getWindBackgroundColor } from '../utils/ColorUtils';
import { getCompassLabel } from '../utils/DataUtils';
import { formatDuration } from '../utils/TimeUtils';
import { formatReadingTime, getMinutesSince, getReadingTime, LIVE_STALE_AFTER_MINUTES } from '../utils/conditionsUtils';
import { MacwindGraphView } from './macwind/MacwindGraphView';
import { MacwindTableView } from './macwind/MacwindTableView';
import { ForecastCard, ForecastMessage, ForecastSkeleton } from './ui/ForecastCard';
import { SegmentedControl } from './ui/SegmentedControl';
import { DirectionArrow } from './ui/DirectionArrow';

type View = 'chart' | 'table';

const MINUTE_MS = 60 * 1000;

const useNow = (intervalMs: number) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
};

const MacwindComponent = ({ live, index }: { live: LiveWindState; index: number }) => {
    const [view, setView] = useState<View>('chart');
    const { windData, error, loading, refetch, timeFrame, setTimeFrame } = live;
    const { showText, toggleDirection } = useDirectionToggle('macwind-show-direction-text');
    const now = useNow(30 * 1000);

    const latest = windData?.[0];
    const minutesAgo = latest ? getMinutesSince(getReadingTime(latest), now) : 0;
    const stale = minutesAgo > LIVE_STALE_AFTER_MINUTES;

    const subtitle = latest ? (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span>MAC Wind station</span>
            {stale ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-400/20">
                    <TriangleAlert className="size-3" aria-hidden="true" />
                    No reading for {formatDuration(minutesAgo)}
                </span>
            ) : (
                <span>· {minutesAgo < 1 ? 'just now' : `${Math.round(minutesAgo)} min ago`}</span>
            )}
        </span>
    ) : 'MAC Wind station';

    const actions = (
        <>
            <SegmentedControl
                label="View"
                value={view}
                onChange={setView}
                options={[
                    { value: 'chart', label: <ChartLine className="size-4" />, ariaLabel: 'Chart' },
                    { value: 'table', label: <Table2 className="size-4" />, ariaLabel: 'Table' },
                ]}
            />
            <SegmentedControl
                label="Averaging window"
                value={timeFrame}
                onChange={setTimeFrame}
                options={[
                    { value: '1min', label: '1m', ariaLabel: '1 minute' },
                    { value: '15min', label: '15m', ariaLabel: '15 minutes' },
                ]}
            />
            <button type="button" className="btn-icon" onClick={refetch} disabled={loading} aria-label="Refresh live wind">
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </>
    );

    let body;
    if (error) {
        body = <ForecastMessage tone="error">Couldn't reach the weather station. Try refreshing.</ForecastMessage>;
    } else if (!windData) {
        body = <ForecastSkeleton rows={4} />;
    } else if (windData.length === 0) {
        body = <ForecastMessage>No wind data available. Likely due to loadshedding.</ForecastMessage>;
    } else {
        body = (
            <>
                <LiveSummary windData={windData} stale={stale} />
                {view === 'chart' ? (
                    <MacwindGraphView windData={windData} timeFrame={timeFrame} />
                ) : (
                    <MacwindTableView key={timeFrame} windData={windData} showText={showText} onToggleDirection={toggleDirection} />
                )}
            </>
        );
    }

    return (
        <ForecastCard title="Live wind" subtitle={subtitle} live={!stale} actions={actions} index={index}>
            {body}
        </ForecastCard>
    );
};

const LiveSummary = ({ windData, stale }: { windData: LiveReading[]; stale: boolean }) => {
    const latest = windData[0];
    const avg = Math.round(latest.speed);
    const gust = Math.round(latest.gust);

    // Compare with the reading closest to an hour earlier
    const latestTime = getReadingTime(latest).getTime();
    const hourAgo = windData.find((e) => latestTime - getReadingTime(e).getTime() >= 55 * MINUTE_MS);
    const change = hourAgo ? avg - Math.round(hourAgo.speed) : null;
    const TrendIcon = change === null || Math.abs(change) < 2 ? ArrowRight : change > 0 ? ArrowUpRight : ArrowDownRight;
    const trendLabel = change === null ? 'No data' : Math.abs(change) < 2 ? 'Steady' : change > 0 ? `Up ${change} kn` : `Down ${-change} kn`;

    return (
        // Phones already see these numbers in the "Right now" card at the top.
        // When the station has gone quiet the numbers are old, so they're labelled with their time and dimmed.
        <dl className={`hidden gap-2 px-5 pb-3 md:grid md:grid-cols-4 ${stale ? "opacity-60" : ""}`}>
            <div className="rounded-xl bg-white/[0.03] p-3">
                <dt className="text-[11px] font-medium text-zinc-500">{stale ? `Average at ${formatReadingTime(latest)}` : "Average"}</dt>
                <dd className="mt-1 flex items-baseline gap-1.5">
                    <span className={`size-2 shrink-0 self-center rounded-full ${getWindBackgroundColor(avg)}`} aria-hidden="true" />
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-50">{avg}</span>
                    <span className="text-sm text-zinc-500">kn</span>
                </dd>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
                <dt className="text-[11px] font-medium text-zinc-500">Gusts</dt>
                <dd className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-50">{gust}</span>
                    <span className="text-sm text-zinc-500">kn</span>
                </dd>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
                <dt className="text-[11px] font-medium text-zinc-500">Direction</dt>
                <dd className="mt-1 flex items-center gap-2">
                    {latest.direction !== null && <DirectionArrow degrees={latest.direction} className="size-5 fill-zinc-200 stroke-none" />}
                    <span className="text-3xl font-semibold tracking-tight text-zinc-50">{getCompassLabel(latest.direction)}</span>
                </dd>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
                <dt className="text-[11px] font-medium text-zinc-500">Last hour</dt>
                <dd className="mt-1 flex items-center gap-2">
                    <TrendIcon className="size-5 shrink-0 text-zinc-300" aria-hidden="true" />
                    <span className="text-xl font-semibold tracking-tight text-zinc-50">{trendLabel}</span>
                </dd>
            </div>
        </dl>
    );
};

export default MacwindComponent;
