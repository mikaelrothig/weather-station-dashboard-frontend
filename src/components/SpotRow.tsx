import { ComponentPropsWithoutRef } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Spot } from "../utils/spotUtils";
import { getDegreesToCompass } from "../utils/dataUtils";
import { DirectionArrow } from "./ui/DirectionArrow";
import { WindChip } from "./ui/WindChip";
import type { SpotStatus } from "./home/spotStatus";

interface SpotRowProps extends Omit<ComponentPropsWithoutRef<"a">, "href" | "className"> {
    spot: Spot;
    /** Left out where wind isn't shown (the spot picker): just the name. null: no forecast for the spot */
    status?: SpotStatus | null;
    /** The page you're on: a check instead of the chevron */
    current?: boolean;
    /** Lit up from elsewhere, e.g. its dot on the map */
    highlighted?: boolean;
    /** Taller row and larger name, for the phone sheet */
    touch?: boolean;
}

/** One spot as a link, with when to go, what to rig and the wind right now when it has a status. Used by the home page list and the spot picker */
export const SpotRow = ({ spot, status, current = false, highlighted = false, touch = false, ...linkProps }: SpotRowProps) => {
    const kite = status?.window?.plan[0]?.size;

    return (
        <a
            href={spot.url}
            aria-current={current ? "page" : undefined}
            className={`pressable -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.04] active:bg-white/[0.06] ${touch ? "min-h-14" : "min-h-12"} ${highlighted ? "bg-white/[0.04]" : ""}`}
            {...linkProps}
        >
            <span className="min-w-0 flex-1">
                <span className={`block truncate font-medium ${touch ? "text-[15px]" : "text-sm"} ${current ? "text-zinc-50" : "text-zinc-100"}`}>{spot.name}</span>
                {status !== undefined && (
                    <span className="block truncate text-xs text-zinc-500">
                        {status === null ? (
                            "No forecast right now"
                        ) : status.window ? (
                            <>
                                {/* Today is the default, so only tomorrow gets named */}
                                {status.windowDay === "Today"
                                    ? <span className="tabular-nums text-zinc-300">{status.windowLabel}</span>
                                    : <span className="tabular-nums">Tomorrow {status.windowLabel}</span>}
                                {kite ? ` · ${kite} m²` : ""}
                            </>
                        ) : (
                            status.reason ?? "No window today"
                        )}
                    </span>
                )}
            </span>

            <span className="flex shrink-0 items-center gap-1.5">
                {status && (
                    // Fades in when the summary arrives after the row is already showing
                    <span className="animate-fade flex items-center gap-1.5">
                        <DirectionArrow degrees={status.now.direction} className="size-3 fill-zinc-400 stroke-none" />
                        <WindChip speed={status.now.speed} />
                        <span className="sr-only">knots from the {getDegreesToCompass(status.now.direction)} now</span>
                    </span>
                )}
                {current
                    ? <Check className="size-4 text-rose-400" aria-label="Current spot" />
                    : <ChevronRight className="size-4 text-zinc-600" aria-hidden="true" />}
            </span>
        </a>
    );
};
