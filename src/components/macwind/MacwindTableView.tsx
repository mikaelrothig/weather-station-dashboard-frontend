import { useRef, useEffect } from 'react';
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
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 rounded-t-md">Time</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Low (knots)</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">Average (knots)</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500">High (knots)</span>
                    <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 rounded-b-md">Wind Direction</span>
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