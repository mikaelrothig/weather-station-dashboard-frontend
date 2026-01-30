import { LucideMousePointer2 } from 'lucide-react';
import { getWindBackgroundColor } from '../../utils/ColorUtils';
import { getCompasstoDegrees } from '../../utils/DataUtils';
import { LiveWind } from '../../hooks/useMacwindData';

interface WindDataColumnProps {
    entry: LiveWind;
    showText: boolean;
    onToggleDirection: () => void;
    isLast: boolean;
}

export const WindDataColumn = ({ entry, showText, onToggleDirection, isLast }: WindDataColumnProps) => {
    const low = parseFloat(entry.low);
    const avg = parseFloat(entry.avg);
    const high = parseFloat(entry.high);
    const windDir = entry.dir;

    const bgLow = getWindBackgroundColor(Math.round(low));
    const bgAvg = getWindBackgroundColor(Math.round(avg));
    const bgHigh = getWindBackgroundColor(Math.round(high));

    return (
        <div className={`min-w-12 max-w-12 space-y-0.5 ${!isLast ? 'mr-0.5' : ''}`}>
            <span className="flex items-center justify-center p-1.5 font-bold bg-zinc-800">
                {entry.time}
            </span>
            <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgLow}`}>{Math.round(low)}</span>
            <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgAvg}`}>{Math.round(avg)}</span>
            <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgHigh}`}>{Math.round(high)}</span>
            <span
                className="flex flex-col items-center justify-center p-1.5 font-bold bg-zinc-800 cursor-pointer select-none transition-all duration-150"
                title={`${windDir}`}
                onClick={onToggleDirection}
            >
                {showText ? (
                    <span className="text-zinc-200 text-xs">
                        {windDir}
                    </span>
                ) : (
                    <LucideMousePointer2
                        className="fill-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4"
                        style={{ transform: `rotate(${getCompasstoDegrees(windDir) - 135}deg)` }}
                    />
                )}
            </span>
        </div>
    );
};