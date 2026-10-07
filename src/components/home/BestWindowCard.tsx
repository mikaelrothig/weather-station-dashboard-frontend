import { CSSProperties } from "react";
import { useRiderSettings } from "../../hooks/useRiderSettings";
import { KiteWindowDetails } from "../ui/KiteWindowDetails";
import { WindStrip } from "../ui/WindStrip";
import { hoverProps, SpotHover, SpotStatus } from "./spotStatus";

interface BestWindowCardProps {
    /** The rider's best window anywhere, today or tomorrow */
    best: SpotStatus | null;
    /** Shown instead when there's no window today or tomorrow */
    windiest: SpotStatus;
    onHover: SpotHover["onHover"];
}

/**
 * The rider's best window across every spot, laid out like the spot page's Kite windows card: the same title and
 * rules line, the rose "Best" day panel and the same disclaimer. With no window today or tomorrow it falls back to
 * that card's quiet no-window panel, for the windiest spot.
 */
export const BestWindowCard = ({ best, windiest, onHover }: BestWindowCardProps) => {
    const { weight, kites, profile } = useRiderSettings();
    const shown = best ?? windiest;

    const dayLabel = (
        <span className="min-w-0 truncate text-xs font-medium text-zinc-400">
            {shown.windowDay ?? "Today"} · <span className="text-zinc-100">{shown.spot.name}</span>
        </span>
    );

    return (
        <section aria-labelledby="best-window-title" className="card animate-enter flex flex-col p-4 md:p-5" style={{ "--i": 2 } as CSSProperties}>
            <header className="min-w-0">
                <h2 id="best-window-title" className="text-sm font-semibold text-zinc-100">Your best kite window</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                    Daylight, {profile.minWind}–{profile.maxWind} kn, gusts under {profile.maxGust}, not offshore
                    {kites.length > 0 && ", with your kites"}
                </p>
            </header>

            {best?.window ? (
                <a
                    href={best.spot.url}
                    {...hoverProps(best.spot.url, onHover)}
                    // A large surface gets a gentler press than a button: 0.98 rather than 0.97
                    className="pressable mt-4 flex flex-col gap-3 rounded-xl bg-rose-500/[0.06] p-3 ring-1 ring-inset ring-rose-500/25 hover:bg-rose-500/[0.09] active:scale-[0.98] md:p-3.5"
                >
                    <KiteWindowDetails
                        window={best.window}
                        hours={best.dayHours}
                        weight={weight}
                        profile={profile}
                        label={
                            <>
                                {dayLabel}
                                <span className="shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">Best</span>
                            </>
                        }
                    />
                </a>
            ) : (
                <a
                    href={windiest.spot.url}
                    {...hoverProps(windiest.spot.url, onHover)}
                    className="pressable mt-4 flex flex-col gap-2.5 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.04] hover:bg-white/[0.04] active:scale-[0.98] md:p-3.5"
                >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        {dayLabel}
                        <p className="text-sm font-medium text-zinc-500">{windiest.reason ?? "No windows today"}</p>
                    </div>
                    <WindStrip hours={windiest.dayHours} window={null} />
                </a>
            )}

            <p className="mt-auto pt-3 text-[11px] leading-relaxed text-zinc-500">
                A forecast-based suggestion. Always check conditions on the beach before you ride.
            </p>
        </section>
    );
};
