import { getWindBackgroundColor } from "../../utils/colorUtils";

/** Knots on the wind scale's colour, as used in lists and map labels */
export const WindChip = ({ speed, className = "" }: { speed: number; className?: string }) => (
    <span className={`grid h-6 min-w-8 place-items-center rounded-md px-1.5 text-xs font-semibold tabular-nums text-zinc-950 ${getWindBackgroundColor(Math.round(speed))} ${className}`}>
        {Math.round(speed)}
    </span>
);
