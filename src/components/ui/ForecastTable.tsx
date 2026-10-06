import { ReactNode, useLayoutEffect, useRef } from "react";
import { Clock, LucideIcon, Share2 } from "lucide-react";

export interface ForecastColumn {
    key: string;
    dayKey: string;
    dayLabel?: string;
    timeLabel: string;
    /** Night hours: still shown, but pushed back so daylight reads first */
    dim?: boolean;
    isNow?: boolean;
    /** Text for the highlighted column; forecasts say "Now", live readings show the reading's time */
    nowLabel?: string;
}

export interface ForecastCell {
    content: ReactNode;
    /** Colour classes for the cell; neutral cells are shaded per day when omitted */
    className?: string;
    title?: string;
}

export interface ForecastRow {
    key: string;
    icon: LucideIcon;
    label: string;
    shortLabel: string;
    unit?: string;
    cells: ForecastCell[];
    /** Makes the whole row tappable, e.g. to switch arrows and compass text */
    onToggle?: () => void;
    toggleHint?: string;
}

interface ForecastTableProps {
    columns: ForecastColumn[];
    rows: ForecastRow[];
    /** Adds a share button to each day label */
    onShareDay?: (dayKey: string) => void;
    cellWidth?: string;
    /** Scrolls to the newest column whenever this value changes */
    scrollToEndKey?: unknown;
}

// Sticky label column: short text on phones, icon + label + unit from sm up
const LABEL_COLUMN = "sticky left-0 z-10 bg-surface pl-4 pr-1.5 md:pl-5 w-[54px] min-w-[54px] sm:w-[148px] sm:min-w-[148px] md:w-[152px] md:min-w-[152px]";
const DAY_LABEL_STICKY = "sticky left-[54px] sm:left-[148px] md:left-[152px]";

export const ForecastTable = ({ columns, rows, cellWidth = "w-9", scrollToEndKey, onShareDay }: ForecastTableProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (scrollToEndKey !== undefined && scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [scrollToEndKey]);

    // Group consecutive columns by day for the header row and the gaps between days
    const dayIndexes: number[] = [];
    const dayGroups: { key: string; label?: string; span: number }[] = [];
    columns.forEach((column, i) => {
        const previous = dayGroups[dayGroups.length - 1];
        if (i > 0 && previous.key === column.dayKey) {
            previous.span += 1;
        } else {
            dayGroups.push({ key: column.dayKey, label: column.dayLabel, span: 1 });
        }
        dayIndexes.push(dayGroups.length - 1);
    });

    const showDays = dayGroups.some((group) => group.label);
    const startsDay = (i: number) => i > 0 && dayIndexes[i] !== dayIndexes[i - 1];
    const cellPadding = (i: number) => (startsDay(i) ? "py-px pr-px pl-[7px]" : "p-px");
    const neutralCell = (i: number) =>
        dayIndexes[i] % 2 === 0 ? "bg-white/[0.04] text-zinc-300" : "bg-white/[0.08] text-zinc-200";

    return (
        <div ref={scrollRef} className="no-scrollbar scroll-fade overflow-x-auto overscroll-x-contain">
            <div className="w-max pr-6">
                <table className="border-separate border-spacing-0">
                    <thead>
                        {showDays && (
                            <tr>
                                <td className={LABEL_COLUMN} />
                                {dayGroups.map((group, g) => (
                                    <th
                                        key={group.key}
                                        scope="colgroup"
                                        colSpan={group.span}
                                        className={`pb-1 text-left ${g > 0 ? "pl-[7px]" : "pl-px"}`}
                                    >
                                        <span className={`${DAY_LABEL_STICKY} flex w-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-zinc-300`}>
                                            {group.label}
                                            {onShareDay && (
                                                <button
                                                    type="button"
                                                    onClick={() => onShareDay(group.key)}
                                                    aria-label={`Share ${group.label} forecast as an image`}
                                                    className="pressable inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
                                                >
                                                    <Share2 className="size-3" aria-hidden="true" />
                                                    Share
                                                </button>
                                            )}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        )}
                        <tr>
                            <th scope="col" className={`${LABEL_COLUMN} py-px text-left`}>
                                <RowLabel icon={Clock} label="Time" shortLabel="Time" />
                            </th>
                            {columns.map((column, i) => (
                                <th key={column.key} scope="col" className={cellPadding(i)}>
                                    <div
                                        className={`grid h-6 ${cellWidth} place-items-center rounded text-[11px] font-medium tabular-nums ${
                                            column.isNow ? "bg-rose-500/15 text-rose-300" : column.dim ? "text-zinc-500" : "text-zinc-400"
                                        }`}
                                    >
                                        {column.isNow ? column.nowLabel ?? "Now" : column.timeLabel}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.key}
                                onClick={row.onToggle}
                                className={row.onToggle ? "cursor-pointer" : undefined}
                            >
                                <th scope="row" className={`${LABEL_COLUMN} py-px text-left font-normal`}>
                                    {row.onToggle ? (
                                        <button
                                            type="button"
                                            aria-label={`${row.label}. ${row.toggleHint ?? ""}`}
                                            className="pressable -mx-1.5 block rounded-md px-1.5 hover:bg-white/[0.06]"
                                        >
                                            <RowLabel icon={row.icon} label={row.label} shortLabel={row.shortLabel} unit={row.unit} />
                                        </button>
                                    ) : (
                                        <RowLabel icon={row.icon} label={row.label} shortLabel={row.shortLabel} unit={row.unit} />
                                    )}
                                </th>
                                {row.cells.map((cell, i) => (
                                    <td key={columns[i]?.key ?? i} className={cellPadding(i)} title={cell.title}>
                                        <div
                                            className={`grid h-7 ${cellWidth} place-items-center rounded text-xs font-semibold tabular-nums ${
                                                cell.className ?? neutralCell(i)
                                            } ${columns[i]?.dim ? "opacity-40" : ""}`}
                                        >
                                            {cell.content}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface RowLabelProps {
    icon: LucideIcon;
    label: string;
    shortLabel: string;
    unit?: string;
}

const RowLabel = ({ icon: Icon, label, shortLabel, unit }: RowLabelProps) => (
    <span className="flex h-7 items-center gap-2 whitespace-nowrap">
        <span aria-hidden="true" className="text-[10px] font-medium text-zinc-400 sm:hidden">{shortLabel}</span>
        <Icon className="hidden size-3.5 shrink-0 text-zinc-500 sm:block" aria-hidden="true" />
        <span className="sr-only text-xs font-medium text-zinc-300 sm:not-sr-only">{label}</span>
        {unit && <span className="hidden text-xs text-zinc-500 sm:inline">{unit}</span>}
    </span>
);
