import { LucideMinus, LucidePlus } from 'lucide-react';

interface MacwindHeaderProps {
    showLabels: boolean;
    graphView: boolean;
    onToggleLabels: () => void;
}

export const MacwindHeader = ({ showLabels, graphView, onToggleLabels }: MacwindHeaderProps) => {
    return (
        <div className="flex gap-x-2 p-3">
            {!graphView && (
                <button className="px-3 py-2 h-9 items-center bg-zinc-800 hover:bg-zinc-700 rounded-md" onClick={onToggleLabels}>
                    {showLabels ? <LucideMinus className="w-4 h-4" /> : <LucidePlus className="w-4 h-4" />}
                </button>
            )}
            <span className="flex flex-grow gap-x-2 w-full bg-zinc-800 text-zinc-500 font-bold px-3 py-2 h-9 items-center rounded-md">
                MAC Wind
                <div className="relative">
                    <div className="flex w-2 h-2 bg-rose-500 rounded-full">
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-rose-500 opacity-75 animate-ping"></div>
                    </div>
                </div>
            </span>
        </div>
    );
};
