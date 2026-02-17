import {LucideChartLine, LucideMinus, LucidePlus, LucideRefreshCw, LucideTable} from 'lucide-react';

interface MacwindControlsProps {
    graphView: boolean;
    showLabels: boolean;
    onToggleLabels: () => void;
    onToggleView: () => void;
    loading: boolean;
    onRefresh: () => void;
    timeFrame: '1min' | '15min';
    onTimeFrameChange: (timeFrame: '1min' | '15min') => void;
}

export const MacwindControls = ({
    graphView,
    showLabels,
    onToggleLabels,
    onToggleView,
    loading,
    onRefresh,
    timeFrame,
    onTimeFrameChange,
}: MacwindControlsProps) => {
    return (
        <div className="flex gap-x-2 w-full bg-zinc-900 rounded-md pb-3">
            <div className="flex gap-x-2">
                {!graphView && (
                    <button className="px-3 py-2 h-9 items-center bg-zinc-800 hover:bg-zinc-700 rounded-md" onClick={onToggleLabels}>
                        {showLabels ? <LucideMinus className="w-4 h-4" /> : <LucidePlus className="w-4 h-4" />}
                    </button>
                )}

                <button className="hidden xl:flex px-3 py-2 flex-grow justify-center items-center bg-zinc-800 lg:hover:bg-zinc-700 rounded-md h-9" onClick={onToggleView}>
                    {!graphView ? (
                        <LucideChartLine className="w-4 h-4" />
                    ) : (
                        <LucideTable className="w-4 h-4" />
                    )}
                </button>
            </div>

            <span className="flex flex-grow gap-x-2 w-full bg-zinc-800 text-zinc-500 font-bold px-3 py-2 h-9 items-center rounded-md">
                MAC Wind
                <div className="relative">
                    <div className="flex w-2 h-2 bg-rose-500 rounded-full">
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-rose-500 opacity-75 animate-ping"></div>
                    </div>
                </div>
            </span>

            <div className="flex justify-end flex-grow gap-x-2">
                <div className="relative flex bg-zinc-800 rounded-md p-1 h-9 items-center">
                    <div
                        className={`absolute top-1 left-1 h-7 w-10 bg-zinc-700 rounded-md shadow-sm transition-transform duration-300 ease-out ${
                            timeFrame === '15min' ? 'translate-x-10' : 'translate-x-0'
                        }`}
                    />
                    <button className={`relative z-10 flex justify-center items-center w-10 h-8 font-semibold text-xs transition-colors duration-200 ${
                            timeFrame === '1min' ? 'text-zinc-200' : 'text-zinc-500'
                        }`} 
                        onClick={() => onTimeFrameChange('1min')}
                    >
                        1m
                    </button>
                    <button className={`relative z-10 flex justify-center items-center w-10 h-8 font-semibold text-xs transition-colors duration-200 ${
                            timeFrame === '15min' ? 'text-zinc-200' : 'text-zinc-500'
                        }`} 
                        onClick={() => onTimeFrameChange('15min')}
                    >
                        15m
                    </button>
                </div>
                <button className="px-3 py-2 bg-zinc-800 lg:hover:bg-zinc-700 rounded-md h-9 items-center" onClick={onRefresh} disabled={loading}>
                    <LucideRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
};