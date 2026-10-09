import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { LucideIcon, Sun, Thermometer, Waves, Wind } from "lucide-react";
import { Forecast, LiveReading, SpotInfo } from "../api/types";
import { getWindBackgroundColor } from "../utils/colorUtils";
import { getCompassLabel } from "../utils/dataUtils";
import { formatDuration, getMinutesOfDay, parseClockMinutes } from "../utils/timeUtils";
import { getNearestPoint } from "../utils/forecastUtils";
import { getCurrentWind, getDaylight, getShoreRelation, getWetsuit, ShoreRelation } from "../utils/conditionsUtils";
import { DirectionArrow } from "./ui/DirectionArrow";

interface ConditionsStripProps {
    forecast: Forecast | null;
    forecastLoading: boolean;
    live: LiveReading[] | null;
    spotData: SpotInfo | null;
    spotLoading: boolean;
    offshore: [number, number] | undefined;
}

const SHORE: Record<ShoreRelation, { label: string; className: string }> = {
    onshore: { label: "Onshore", className: "bg-white/[0.06] text-zinc-300" },
    "side-shore": { label: "Side-shore", className: "bg-emerald-400/10 text-emerald-300" },
    offshore: { label: "Offshore", className: "bg-rose-500/15 text-rose-300" },
};

const DAY_MINUTES = 24 * 60;

// Desktop "now" overview: four compact reading cards, so the planning cards below sit higher on the screen
const ConditionsStrip = ({ forecast, forecastLoading, live, spotData, spotLoading, offshore }: ConditionsStripProps) => {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30 * 1000);
        return () => clearInterval(id);
    }, []);

    const wind = getCurrentWind(live, forecast);
    const shore = wind && wind.direction !== null && offshore ? getShoreRelation(wind.direction, offshore) : null;
    const air = forecast ? getNearestPoint(forecast.hours)?.temperature ?? null : null;
    const daylight = forecast ? getDaylight(forecast.sunrise, forecast.sunset, now) : null;
    const pct = (minutes: number) => (minutes / DAY_MINUTES) * 100;

    return (
        <section
            aria-label="Conditions now"
            className="animate-enter grid grid-cols-2 gap-4 lg:grid-cols-4"
            style={{ "--i": 1 } as CSSProperties}
        >
            <Cell icon={Wind} label={wind?.source === "live" ? "Wind now · live" : "Wind now · forecast"} loading={!wind && forecastLoading}>
                {wind && (
                    <>
                        <Value value={Math.round(wind.speed)} unit="kn" dot={getWindBackgroundColor(Math.round(wind.speed))} />
                        <Sub>
                            Gusts <strong className="font-medium tabular-nums text-zinc-200">{Math.round(wind.gust)}</strong>
                            <span className="inline-flex items-center gap-1">
                                {wind.direction !== null && <DirectionArrow degrees={wind.direction} className="size-3 fill-zinc-300 stroke-none" />}
                                <strong className="font-medium text-zinc-200">{getCompassLabel(wind.direction)}</strong>
                            </span>
                            {shore && <span className={`rounded-full px-1.5 py-px text-[11px] font-medium ${SHORE[shore].className}`}>{SHORE[shore].label}</span>}
                        </Sub>
                    </>
                )}
            </Cell>

            <Cell icon={Sun} label="Daylight" loading={!daylight && forecastLoading}>
                {daylight && (
                    <>
                        <Value value={daylight.minutesLeft > 0 ? formatDuration(daylight.minutesLeft) : daylight.status} unit={daylight.minutesLeft > 0 ? "left" : undefined} />
                        <div className="relative mt-1 h-1 w-full rounded-full bg-white/[0.08]" aria-hidden="true">
                            <div
                                className="absolute inset-y-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                                style={{ left: `${pct(parseClockMinutes(daylight.sunrise))}%`, width: `${pct(parseClockMinutes(daylight.sunset) - parseClockMinutes(daylight.sunrise))}%` }}
                            />
                            <div
                                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-50 ring-2 ring-surface"
                                style={{ left: `${pct(getMinutesOfDay(now))}%` }}
                            />
                        </div>
                        <Sub>
                            Sunrise <strong className="font-medium tabular-nums text-zinc-200">{daylight.sunrise}</strong>
                            · Sunset <strong className="font-medium tabular-nums text-zinc-200">{daylight.sunset}</strong>
                        </Sub>
                    </>
                )}
            </Cell>

            <Cell icon={Thermometer} label="Air" loading={air === null && forecastLoading}>
                {air !== null ? (
                    <>
                        <Value value={Math.round(air)} unit="°C" />
                        <Sub>Forecast for this hour</Sub>
                    </>
                ) : null}
            </Cell>

            <Cell icon={Waves} label="Water" loading={spotLoading}>
                {spotData?.sst != null ? (
                    <>
                        <Value value={Math.round(spotData.sst)} unit="°C" />
                        <Sub>{getWetsuit(spotData.sst)}</Sub>
                    </>
                ) : (
                    <Value value="No data" muted />
                )}
            </Cell>
        </section>
    );
};

const Cell = ({ icon: Icon, label, loading, children }: { icon: LucideIcon; label: string; loading: boolean; children: ReactNode }) => (
    <div className="card flex min-w-0 flex-col gap-2 p-4 lg:p-5">
        <h2 className="eyebrow">
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </h2>
        {loading ? (
            <div className="space-y-2" aria-busy="true">
                <div className="h-8 w-24 animate-pulse rounded-md bg-white/[0.06]" />
                <div className="h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
            </div>
        ) : (
            children ?? <Value value="Unavailable" muted />
        )}
    </div>
);

const Value = ({ value, unit, dot, muted = false }: { value: ReactNode; unit?: string; dot?: string; muted?: boolean }) => (
    <p className="flex items-baseline gap-1.5">
        {dot && <span className={`size-2 shrink-0 self-center rounded-full ${dot}`} aria-hidden="true" />}
        <span className={`font-semibold tabular-nums tracking-tight ${muted ? "text-lg text-zinc-500" : "text-3xl text-zinc-50"}`}>{value}</span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
    </p>
);

const Sub = ({ children }: { children: ReactNode }) => (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">{children}</p>
);

export default ConditionsStrip;
