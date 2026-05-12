import { useRef, useEffect } from 'react';
import { Clock, Wind, TrendingUp, Gauge, Navigation2 } from 'lucide-react';
import { LiveWind } from '../../hooks/useMacwindData';
import { WindDataColumn } from './WindDataColumn';

interface MacwindTableViewProps {
    windData: LiveWind[];
    showLabels: boolean;
    showText: boolean;
    onToggleDirection: () => void;
}

export const MacwindTableView = ({ windData, showLabels, showText, onToggleDirection }: MacwindTableViewProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [windData]);

    return (
        <div className="flex gap-x-3 bg-zinc-900">
            {showLabels && (
                <div className="flex flex-col gap-y-0.5 min-w-40 max-w-40">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-t-md">
                        <Clock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-400">Time</span>
                    </div>
                    {[
                        { icon: Wind,        label: "Low",       unit: "knots" },
                        { icon: TrendingUp,  label: "Average",   unit: "knots" },
                        { icon: Gauge,       label: "High",      unit: "knots" },
                        { icon: Navigation2, label: "Direction", unit: "",      last: true },
                    ].map(({ icon: Icon, label, unit, last }) => (
                        <div key={label} className={`flex items-center gap-2 px-3 py-1.5 bg-zinc-800 ${last ? "rounded-b-md" : ""}`}>
                            <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                            <span className="text-xs font-semibold text-zinc-400">{label}</span>
                            {unit && <span className="text-xs text-zinc-600">({unit})</span>}
                        </div>
                    ))}
                </div>
            )}
            <div className="overflow-x-hidden">
                <div ref={scrollContainerRef} className="flex overflow-x-scroll no-scrollbar rounded-md">
                    {windData.slice().reverse().map((entry, index) => (
                        <WindDataColumn
                            key={index}
                            entry={entry}
                            showText={showText}
                            onToggleDirection={onToggleDirection}
                            isLast={index === windData.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};