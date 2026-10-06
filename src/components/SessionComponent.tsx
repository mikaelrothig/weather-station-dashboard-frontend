import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Sun, Thermometer, TriangleAlert, Waves } from "lucide-react";
import { Forecast, LiveReading, SpotInfo } from "../api/types";
import { useRiderSettings } from "../hooks/useRiderSettings";
import { getWindBackgroundColor } from "../utils/ColorUtils";
import { getCompassLabel } from "../utils/DataUtils";
import { formatClock, formatDate, formatDuration, getHourLabel, isDeviceOnSpotTime } from "../utils/TimeUtils";
import { buildForecastHours, getNearestPoint } from "../utils/forecastUtils";
import { getCurrentWind, getDaylight, getMinutesSince, getShoreRelation, getWetsuit, ShoreRelation } from "../utils/conditionsUtils";
import { chooseKite, describeKites } from "../utils/kiteUtils";
import { predictTides } from "../utils/tideUtils";
import { DirectionArrow } from "./ui/DirectionArrow";

interface SessionProps {
    spotName: string;
    offshore: [number, number] | undefined;
    forecast: Forecast | null;
    forecastLoading: boolean;
    live: LiveReading[] | null;
    spotData: SpotInfo | null;
}

const NEXT_HOURS = 6;
const HOUR_MS = 60 * 60 * 1000;

const SHORE_STYLES: Record<ShoreRelation, string> = {
    onshore: "bg-white/[0.06] text-zinc-300",
    "side-shore": "bg-emerald-400/10 text-emerald-300",
    offshore: "bg-rose-500/15 text-rose-300",
};

const SHORE_LABELS: Record<ShoreRelation, string> = {
    onshore: "Onshore",
    "side-shore": "Side-shore",
    offshore: "Offshore",
};

const formatTime = formatClock;

/** Phone-first summary for someone standing on the beach: what's blowing, what to rig, and how long it lasts */
const SessionComponent = ({ spotName, offshore, forecast, forecastLoading, live, spotData }: SessionProps) => {
    const { weight, kites, profile } = useRiderSettings();
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30 * 1000);
        return () => clearInterval(id);
    }, []);

    const tides = useMemo(
        () => (spotData ? predictTides(spotData, new Date(Date.now() - HOUR_MS), new Date(Date.now() + 26 * HOUR_MS)) : null),
        [spotData],
    );

    const wind = getCurrentWind(live, forecast);

    if (!wind) {
        return (
            <section aria-label="Right now" className="card animate-enter p-4">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{spotName}</h1>
                {forecastLoading ? (
                    <div className="mt-4 space-y-3" aria-busy="true">
                        <div className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
                        <div className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
                        <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-zinc-500">No wind data available right now.</p>
                )}
            </section>
        );
    }

    const speed = Math.round(wind.speed);
    const gust = Math.round(wind.gust);
    const shore = offshore && wind.direction !== null ? getShoreRelation(wind.direction, offshore) : null;
    const gusty = gust - speed >= profile.gustyAt;

    let kite: { value: string; note?: string; warn?: boolean };
    if (shore === "offshore") kite = { value: "Offshore", note: "Wind blows away from the beach", warn: true };
    else if (speed < profile.minWind) kite = { value: "Too light", note: `Under ${profile.minWind} kn` };
    else if (speed > profile.maxWind || gust > profile.maxGust) kite = { value: "Too strong", note: `For ${profile.label.toLowerCase()} riders`, warn: true };
    else {
        const choice = chooseKite(weight, speed, profile, kites);
        if (choice.fit === "underpowered") kite = { value: `${choice.size} m²`, note: "Your biggest kite, likely underpowered", warn: true };
        else if (choice.fit === "overpowered") kite = { value: `${choice.size} m²`, note: "Your smallest kite, likely overpowered", warn: true };
        else kite = { value: `${choice.size} m²`, note: gusty ? "Gusty, consider sizing down" : undefined, warn: gusty };
    }

    const nextHours = forecast
        ? buildForecastHours(forecast, null).filter((h) => !h.isNow).slice(0, NEXT_HOURS)
        : [];

    const daylight = forecast ? getDaylight(forecast.sunrise, forecast.sunset, now) : null;
    const air = forecast ? getNearestPoint(forecast.hours)?.temperature ?? null : null;
    const nextTide = tides?.extremes.find((e) => e.time > now.getTime());

    return (
        <section aria-label="Right now" className="card animate-enter p-4">
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="eyebrow">
                        {formatDate(now, { weekday: "short", day: "numeric", month: "short" })} · {formatTime(now)}
                        {!isDeviceOnSpotTime(now) && " spot time"}
                    </p>
                    <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-zinc-50">{spotName}</h1>
                </div>
                <span className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                    {wind.source === "live" ? (
                        <>
                            <span className="live-dot" aria-hidden="true" />
                            Live · {Math.round(getMinutesSince(wind.time, now.getTime()))} min ago
                        </>
                    ) : (
                        "Forecast"
                    )}
                </span>
            </header>

            <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                    <p className="flex items-baseline gap-1.5">
                        <span className="text-7xl font-semibold leading-none tabular-nums tracking-tighter text-zinc-50">{speed}</span>
                        <span className="text-lg font-medium text-zinc-500">kn</span>
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400">
                        <span className={`size-2 rounded-full ${getWindBackgroundColor(gust)}`} aria-hidden="true" />
                        Gusts <span className="font-semibold tabular-nums text-zinc-100">{gust} kn</span>
                    </p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <span className="grid size-14 place-items-center rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]">
                        {wind.direction !== null && <DirectionArrow degrees={wind.direction} className="size-6 fill-zinc-100 stroke-none" />}
                    </span>
                    <span className="text-sm font-semibold text-zinc-100">{getCompassLabel(wind.direction)}</span>
                    {shore && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SHORE_STYLES[shore]}`}>{SHORE_LABELS[shore]}</span>
                    )}
                </div>
            </div>

            <a
                href="#kite-windows"
                className={`pressable mt-5 flex items-center justify-between gap-3 rounded-xl p-3 ring-1 ring-inset ${
                    kite.warn ? "bg-amber-400/[0.06] ring-amber-400/20" : "bg-white/[0.04] ring-white/[0.04]"
                }`}
            >
                <span className="min-w-0">
                    <span className="block text-xs font-medium text-zinc-400">Kite to rig</span>
                    <span className="block truncate text-[11px] text-zinc-500">{profile.label} · {weight} kg · {describeKites(kites)}</span>
                </span>
                <span className="text-right">
                    {/* Sizes are short and get the big type; words like "Too light" step down so they stay on one line at 320px */}
                    <span className={`block whitespace-nowrap font-semibold tabular-nums tracking-tight text-zinc-50 ${/\d/.test(kite.value) ? "text-2xl" : "text-lg"}`}>
                        {kite.value}
                    </span>
                    {kite.note && (
                        // Icon inline with the text, so it starts the first line however the note wraps
                        <span className={`block text-right text-[11px] leading-snug ${kite.warn ? "text-amber-300" : "text-zinc-500"}`}>
                            {kite.warn && <TriangleAlert className="mr-1 inline size-3 align-[-2px]" aria-hidden="true" />}
                            {kite.note}
                        </span>
                    )}
                </span>
            </a>

            {nextHours.length > 0 && (
                <div className="mt-5">
                    <h2 className="eyebrow mb-2">Next hours · forecast</h2>
                    <ol className="grid grid-cols-6 gap-1">
                        {nextHours.map((h) => (
                            <li key={h.time.getTime()} className={`flex flex-col items-center gap-1 ${h.night ? "opacity-45" : ""}`}>
                                <span className="text-[11px] tabular-nums text-zinc-500">{getHourLabel(h.time)}:00</span>
                                <span className={`grid h-8 w-full place-items-center rounded-md text-sm font-semibold tabular-nums text-zinc-950 ${getWindBackgroundColor(Math.round(h.speed))}`}>
                                    {Math.round(h.speed)}
                                </span>
                                <span className="text-[11px] tabular-nums text-zinc-400">{Math.round(h.gust)}</span>
                                <DirectionArrow degrees={h.direction} className="size-3.5 fill-zinc-300 stroke-none" />
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-2">
                {daylight && daylight.minutesLeft > 0 ? (
                    <Condition icon={Sun} label="Daylight" value={`${formatDuration(daylight.minutesLeft)} left`} sub={`Sunset ${daylight.sunset}`} />
                ) : (
                    <Condition icon={Sun} label="Sunrise" value={daylight?.sunrise ?? "–"} sub={daylight?.status} />
                )}
                <Condition
                    icon={tides?.rising ? ArrowUp : ArrowDown}
                    label={tides ? (tides.rising ? "Tide rising" : "Tide falling") : "Tide"}
                    // Lake spots (IJsselmeer) have no tide at all, which is different from data still loading
                    value={tides ? `${tides.now.toFixed(1)} m` : spotData ? "None" : "–"}
                    sub={nextTide ? `${nextTide.high ? "High" : "Low"} ${formatTime(nextTide.time)}` : spotData && !tides ? "No tide here" : undefined}
                />
                <Condition icon={Waves} label="Water" value={spotData?.sst != null ? `${spotData.sst}°C` : spotData ? "No data" : "–"} sub={spotData?.sst != null ? getWetsuit(spotData.sst) : undefined} />
                <Condition icon={Thermometer} label="Air" value={air !== null ? `${Math.round(air)}°C` : "–"} sub="Forecast" />
            </dl>
        </section>
    );
};

interface ConditionProps {
    icon: typeof Sun;
    label: string;
    value: string;
    sub?: string;
}

const Condition = ({ icon: Icon, label, value, sub }: ConditionProps) => (
    <div className="rounded-xl bg-white/[0.03] p-3">
        <dt className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-zinc-50">{value}</dd>
        {sub && <dd className="text-[11px] leading-snug text-zinc-500">{sub}</dd>}
    </div>
);

export default SessionComponent;
