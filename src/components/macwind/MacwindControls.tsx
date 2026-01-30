import {LucideChartLine, LucideRadio, LucideRefreshCw, LucideTable} from 'lucide-react';

interface MacwindControlsProps {
    graphView: boolean;
    onToggleView: () => void;
    loading: boolean;
    onRefresh: () => void;
    timeFrame: '1min' | '15min';
    onTimeFrameChange: (timeFrame: '1min' | '15min') => void;
}

export const MacwindControls = ({
    graphView,
    onToggleView,
    loading,
    onRefresh,
    timeFrame,
    onTimeFrameChange,
}: MacwindControlsProps) => {
    return (
        <div className="flex w-full bg-zinc-900 rounded-md px-3 pb-3">
            <div className="flex gap-x-2">
                <button className="hidden xl:flex px-3 py-2 flex-grow justify-center items-center bg-zinc-800 lg:hover:bg-zinc-700 rounded-md h-9" onClick={onToggleView}>
                    {!graphView ? (
                        <div className="flex gap-x-2">
                            <LucideChartLine className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="flex gap-x-2">
                            <LucideTable className="w-4 h-4" />
                        </div>
                    )}
                </button>
                <button className="px-3 py-2 bg-zinc-800 lg:hover:bg-zinc-700 rounded-md h-9 items-center" onClick={onRefresh} disabled={loading}>
                    <LucideRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex justify-end flex-grow gap-x-2">
                <div className="flex gap-x-0.5 justify-center w-fit items-center">
                    <button className={`flex gap-x-1 py-2 px-3 font-bold rounded-l-md text-xs h-9 w-16 justify-center items-center ${timeFrame === '1min' ? 'bg-zinc-700' : 'bg-zinc-800 lg:hover:bg-zinc-700'}`} onClick={() => onTimeFrameChange('1min')}>
                        1 min
                    </button>
                    <button className={`flex gap-x-1 py-2 px-3 font-bold rounded-r-md text-xs h-9 w-16 justify-center items-center ${timeFrame === '15min' ? 'bg-zinc-700' : 'bg-zinc-800 lg:hover:bg-zinc-700'}`} onClick={() => onTimeFrameChange('15min')}>
                        15 min
                    </button>
                </div>

                <span className="flex gap-x-2 px-3 py-2 w-fit h-9 bg-rose-600 rounded-md items-center">
                    <LucideRadio className="stroke-zinc-200 min-w-4 min-h-4 max-w-4 max-h-4" />
                </span>
            </div>
        </div>
    );
};
