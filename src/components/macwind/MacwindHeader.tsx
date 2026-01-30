import { LucideMinus, LucidePlus } from 'lucide-react';

interface MacwindHeaderProps {
    showLabels: boolean;
    graphView: boolean;
    onToggleLabels: () => void;
}

export const MacwindHeader = ({ showLabels, graphView, onToggleLabels }: MacwindHeaderProps) => {
    return (
        <div className="flex gap-x-0.5 pb-3">
            {!graphView && (
                <button className="px-2.5 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-tl-md" onClick={onToggleLabels}>
                    {showLabels ? <LucideMinus className="w-4 h-4" /> : <LucidePlus className="w-4 h-4" />}
                </button>
            )}
            <span className="flex flex-grow justify-center w-full bg-zinc-800 text-zinc-500 font-bold p-1.5">
                MAC Wind
            </span>
        </div>
    );
};
