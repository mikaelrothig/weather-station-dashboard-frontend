import { useState } from 'react';
import { Navigation2, TrendingDown, Wind, Zap } from 'lucide-react';
import { LiveReading } from '../../api/types';
import { getWindBackgroundColor } from '../../utils/colorUtils';
import { getCompassLabel } from '../../utils/dataUtils';
import { formatReadingTime, getReadingTime } from '../../utils/conditionsUtils';
import { getDayKey } from '../../utils/timeUtils';
import { ForecastColumn, ForecastRow, ForecastTable } from '../ui/ForecastTable';
import { DirectionArrow } from '../ui/DirectionArrow';

interface MacwindTableViewProps {
    /** Newest first, as the station returns it */
    windData: LiveReading[];
    showText: boolean;
    onToggleDirection: () => void;
}

const PAGE_SIZE = 12;


// Same layout as the forecast: a timeline table on desktop, a vertical list on phones
export const MacwindTableView = (props: MacwindTableViewProps) => (
    <>
        <div className="hidden md:block">
            <LiveTimeline {...props} />
        </div>
        <div className="-mb-4 md:hidden">
            <LiveList windData={props.windData} />
        </div>
    </>
);

// Desktop: oldest to newest left to right, ending on the latest reading, highlighted like "Now" in the forecast
const LiveTimeline = ({ windData, showText, onToggleDirection }: MacwindTableViewProps) => {
    const entries = windData.slice().reverse();
    const windCell = (value: number) => ({ content: Math.round(value), className: `${getWindBackgroundColor(Math.round(value))} text-zinc-950` });

    const columns: ForecastColumn[] = entries.map((entry, i) => ({
        key: entry.time,
        dayKey: getDayKey(getReadingTime(entry)),
        timeLabel: formatReadingTime(entry),
        isNow: i === entries.length - 1,
        nowLabel: formatReadingTime(entry),
    }));

    const rows: ForecastRow[] = [
        { key: 'avg', icon: Wind, label: 'Average', shortLabel: 'Avg', unit: 'kn', cells: entries.map((e) => windCell(e.speed)) },
        { key: 'high', icon: Zap, label: 'Gusts', shortLabel: 'Gust', unit: 'kn', cells: entries.map((e) => windCell(e.gust)) },
        { key: 'low', icon: TrendingDown, label: 'Lulls', shortLabel: 'Lull', unit: 'kn', cells: entries.map((e) => windCell(e.lull)) },
        {
            key: 'direction', icon: Navigation2, label: 'Direction', shortLabel: 'Dir',
            onToggle: onToggleDirection,
            toggleHint: showText ? 'Show arrows' : 'Show compass points',
            cells: entries.map((e) => ({
                content: showText || e.direction === null
                    ? <span className="text-[10px]">{getCompassLabel(e.direction)}</span>
                    : <DirectionArrow degrees={e.direction} />,
                title: getCompassLabel(e.direction),
            })),
        },
    ];

    return <ForecastTable columns={columns} rows={rows} cellWidth="w-11" scrollToEndKey={windData} />;
};

// Phones: newest reading on top, matching the forecast's hourly rows, revealed a page at a time
const LiveList = ({ windData }: { windData: LiveReading[] }) => {
    const [visible, setVisible] = useState(PAGE_SIZE);
    const shown = windData.slice(0, visible);
    const remaining = windData.length - shown.length;
    const columns = 'grid-cols-[3rem_2.5rem_2.5rem_minmax(0,1fr)_2.5rem]';

    return (
        <div className="border-t border-white/[0.06] pt-3">
            <div className={`grid ${columns} gap-1.5 px-4 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500`}>
                <span>Time</span>
                <span className="text-center">Avg</span>
                <span className="text-center">Gust</span>
                <span>Dir</span>
                <span className="text-right">Lull</span>
            </div>
            <ul>
                {shown.map((entry, i) => (
                    <li key={entry.time} className={`grid ${columns} items-center gap-1.5 px-4 py-0.5`}>
                        <span className={`text-xs font-medium tabular-nums ${i === 0 ? 'text-rose-300' : 'text-zinc-400'}`}>{formatReadingTime(entry)}</span>
                        <span className={`grid h-7 place-items-center rounded text-xs font-semibold tabular-nums text-zinc-950 ${getWindBackgroundColor(Math.round(entry.speed))}`}>
                            {Math.round(entry.speed)}
                        </span>
                        <span className={`grid h-7 place-items-center rounded text-xs font-semibold tabular-nums text-zinc-950 ${getWindBackgroundColor(Math.round(entry.gust))}`}>
                            {Math.round(entry.gust)}
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-zinc-300">
                            {entry.direction !== null && <DirectionArrow degrees={entry.direction} className="size-3.5 shrink-0 fill-zinc-200 stroke-none" />}
                            {getCompassLabel(entry.direction)}
                        </span>
                        <span className="text-right text-xs tabular-nums text-zinc-400">{Math.round(entry.lull)}</span>
                    </li>
                ))}
            </ul>
            {remaining > 0 && (
                <div className="px-4 pb-4 pt-2">
                    <button
                        type="button"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="pressable h-10 w-full rounded-lg bg-white/[0.04] text-xs font-medium text-zinc-300 active:bg-white/[0.08]"
                    >
                        Show {Math.min(PAGE_SIZE, remaining)} earlier readings
                    </button>
                </div>
            )}
            {remaining === 0 && <div className="pb-4" />}
        </div>
    );
};
