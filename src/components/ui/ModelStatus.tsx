import { TriangleAlert } from "lucide-react";
import { ModelRun } from "../../api/types";
import { getRunLabel } from "../../utils/forecastUtils";
import { formatClock, formatDuration } from "../../utils/timeUtils";

// A run counts as late once it's this far past the provider's own expected update time
const LATE_AFTER_MINUTES = 30;

const formatTime = formatClock;

export const ModelStatus = ({ model }: { model: ModelRun }) => {
    const last = model.updatedAt ? new Date(model.updatedAt) : null;
    const next = model.nextUpdateAt ? new Date(model.nextUpdateAt) : null;
    const overdueMinutes = next ? (Date.now() - next.getTime()) / 60000 : 0;
    const late = overdueMinutes > LATE_AFTER_MINUTES;

    return (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span>{getRunLabel(model)}{last && ` · updated ${formatTime(last)}`}</span>
            {next && !late && <span>· next {formatTime(next)}</span>}
            {next && late && (
                <span
                    className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-400/20"
                    title={`The next run was expected at ${formatTime(next)}`}
                >
                    <TriangleAlert className="size-3" aria-hidden="true" />
                    Next run {formatDuration(overdueMinutes)} late
                </span>
            )}
        </span>
    );
};
