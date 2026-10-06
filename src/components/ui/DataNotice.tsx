import { RefreshCw, TriangleAlert } from "lucide-react";

interface DataNoticeProps {
    hasLiveStation: boolean;
    /** The long-range model still works, so the forecast table has something to show */
    gfsAvailable: boolean;
}

// One explanation at the top when the forecast source is down, instead of an error in every card
export const DataNotice = ({ hasLiveStation, gfsAvailable }: DataNoticeProps) => (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-400/[0.06] px-4 py-3 ring-1 ring-inset ring-amber-400/20">
        <TriangleAlert className="size-4 shrink-0 text-amber-300" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-amber-100/90">
            {gfsAvailable
                ? "The high-resolution forecast can't be loaded right now, so this page uses GFS instead."
                : "Forecasts can't be loaded right now, Windguru isn't responding."}
            {hasLiveStation && " Live wind still updates."}
        </p>
        <button
            type="button"
            onClick={() => window.location.reload()}
            className="pressable flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
        >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Retry
        </button>
    </div>
);
