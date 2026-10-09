import { CSSProperties, useState } from "react";
import { getDegreesToCompass } from "../utils/dataUtils";
import { formatClock, formatDate, getDayKey } from "../utils/timeUtils";
import { getRelativeDayName } from "../utils/forecastUtils.ts";
import { chooseKite, ExperienceProfile, findKiteWindows, KiteDay, windRange } from "../utils/kiteUtils.ts";
import { useRiderSettings } from "../hooks/useRiderSettings.ts";
import { RiderSettingsMenu } from "./RiderSettings.tsx";
import { DirectionArrow } from "./ui/DirectionArrow.tsx";
import { WindStrip } from "./ui/WindStrip.tsx";
import { KiteWindowDetails } from "./ui/KiteWindowDetails.tsx";
import { Forecast } from "../api/types.ts";

interface KiteWindowProps {
    windData: Forecast | null;
    /** Long-range model (GFS) searched for the next window when none of the shown days has one */
    outlook?: Forecast | null;
    loading: boolean;
    error: string | null;
    offshore: [number, number] | undefined;
    index: number;
    className?: string;
}

const formatTime = formatClock;

const OUTLOOK_DAYS = 16;

// getDayKey gives "y-m-d" in spot time; comparing those keeps "in 3 days" right across timezones
const daysBetween = (fromKey: string, toKey: string) => {
    const toUtc = (key: string) => {
        const [y, m, d] = key.split("-").map(Number);
        return Date.UTC(y, m - 1, d);
    };
    return Math.round((toUtc(toKey) - toUtc(fromKey)) / (24 * 60 * 60 * 1000));
};

const KiteWindowComponent = ({ windData, outlook, loading, error, offshore, index, className = "" }: KiteWindowProps) => {
    const { weight, kites, profile } = useRiderSettings();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const days = windData && offshore
        ? findKiteWindows(windData, windData.sunrise, windData.sunset, offshore, profile, weight, kites)
        : [];

    // A bad week: instead of three "too light" rows and empty space, look further ahead for the next window
    const allQuiet = days.length > 0 && days.every((d) => !d.window);
    const lastShown = days[days.length - 1]?.date;
    const outlookDays = allQuiet && outlook && offshore && lastShown
        ? findKiteWindows(outlook, outlook.sunrise, outlook.sunset, offshore, profile, weight, kites, OUTLOOK_DAYS)
            .filter((d) => d.date > lastShown && !days.some((shown) => shown.key === d.key))
        : null;
    const nextWindow = outlookDays?.find((d) => d.window) ?? null;

    const score = (day: KiteDay) => (day.window ? day.window.duration * day.window.avgSpeed : 0);
    const withWindows = days.filter((d) => d.window);
    const bestKey = withWindows.length > 1 ? withWindows.reduce((a, b) => (score(b) > score(a) ? b : a)).key : null;

    return (
        <section
            id="kite-windows"
            aria-label="Kite windows"
            // z-10: the cards after this one animate in with a transform, so without it they'd paint over the settings popover
            className={`card animate-enter relative z-10 flex min-w-0 flex-col p-4 md:p-5 ${className}`}
            style={{ "--i": index } as CSSProperties}
        >
            <header className="flex flex-wrap items-center gap-3">
                <div className="mr-auto min-w-0">
                    <h2 className="text-sm font-semibold text-zinc-100">Kite windows</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                        Daylight, {profile.minWind}–{profile.maxWind} kn, gusts under {profile.maxGust}, not offshore
                        {kites.length > 0 && ", with your kites"}
                        {windData ? ` · ${windData.model.name}` : ""}
                    </p>
                </div>

                <RiderSettingsMenu open={settingsOpen} onOpenChange={setSettingsOpen} />
            </header>

            {!settingsOpen && kites.length === 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.04]">
                    <p className="min-w-0 flex-1 text-xs text-zinc-400">
                        Add the kites you own and every suggestion will use your own quiver.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="pressable h-8 rounded-lg bg-white/[0.06] px-2.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
                    >
                        Add kites
                    </button>
                </div>
            )}

            {loading ? (
                <div className="mt-4 grid gap-2 md:grid-cols-3" aria-busy="true">
                    {[0, 1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-white/[0.04]" />)}
                </div>
            ) : error || !windData ? (
                <p className="mt-4 text-sm text-zinc-500">Unavailable while the forecast can't be loaded</p>
            ) : (
                <>
                    <div className="animate-fade mt-4 grid gap-2 md:grid-cols-3 md:items-start">
                        {days.map((day) => (
                            <DayPanel key={day.key} day={day} weight={weight} profile={profile} best={day.key === bestKey} />
                        ))}
                    </div>

                    {outlookDays && outlook && (
                        nextWindow ? (
                            <OutlookPanel
                                day={nextWindow}
                                daysAway={daysBetween(getDayKey(new Date()), nextWindow.key)}
                                shownDays={days.length}
                                modelName={outlook.model.name}
                                weight={weight}
                                profile={profile}
                            />
                        ) : (
                            <p className="animate-fade mt-2 rounded-xl bg-white/[0.02] px-3.5 py-3 text-sm text-zinc-500 ring-1 ring-inset ring-white/[0.04]">
                                Nothing kiteable in the {outlook.model.name} outlook either, the next {days.length + outlookDays.length} days look quiet.
                            </p>
                        )
                    )}
                </>
            )}

            {/* mt-auto keeps the disclaimer at the bottom when the card stretches to match the Tide card */}
            <p className="mt-auto pt-3 text-[11px] leading-relaxed text-zinc-500">
                A forecast-based suggestion. Always check conditions on the beach before you ride.
            </p>
        </section>
    );
};

const OutlookPanel = ({ day, daysAway, shownDays, modelName, weight, profile }: {
    day: KiteDay;
    daysAway: number;
    shownDays: number;
    modelName: string;
    weight: number;
    profile: ExperienceProfile;
}) => {
    const window = day.window!;
    const suggested = window.hours[0].kite.fit === "suggested";
    const kite = suggested ? chooseKite(weight, window.avgSpeed, profile, []).size : window.plan[0].size;

    return (
        <article className="animate-fade mt-2 flex flex-col gap-2.5 rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.06]">
            <p className="eyebrow">No windows in the next {shownDays} days · next likely</p>
            <header className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-base font-semibold text-zinc-50">
                    {formatDate(window.start, { weekday: "long", day: "numeric", month: "short" })}
                    <span className="font-medium tabular-nums text-zinc-400">, {formatTime(window.start)}–{formatTime(window.end)}</span>
                </h3>
                <div className="shrink-0 text-right">
                    <p className="text-[11px] text-zinc-500">{suggested ? "Suggested" : "Your kite"}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-zinc-50">{kite} m²</p>
                </div>
            </header>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-400">
                <span className="font-medium tabular-nums text-zinc-100">{windRange(window.minSpeed, window.maxSpeed)} kn</span>
                · gusts <span className="font-medium tabular-nums text-zinc-100">{Math.round(window.maxGust)}</span>
                ·
                <DirectionArrow degrees={window.direction} className="size-3 fill-zinc-300 stroke-none" />
                <span className="font-medium text-zinc-100">{getDegreesToCompass(window.direction)}</span>
                · in {daysAway} days
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-500">
                From the long-range {modelName} forecast, so treat it as a heads-up and check again closer to the day.
            </p>
        </article>
    );
};

const DayPanel = ({ day, weight, profile, best }: { day: KiteDay; weight: number; profile: ExperienceProfile; best: boolean }) => {
    const { window } = day;

    // No window: a quiet one-liner with the reason, so the days worth going stand out
    if (!window) {
        return (
            <article className="flex flex-col gap-2.5 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.04] md:p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <h3 className="text-xs font-medium text-zinc-400">{getRelativeDayName(day.date)}</h3>
                    <p className="text-sm font-medium text-zinc-500">{day.reason}</p>
                </div>
                <WindStrip hours={day.hours} window={null} />
            </article>
        );
    }

    return (
        <article
            className={`flex flex-col gap-3 rounded-xl p-3 ring-1 ring-inset md:p-3.5 ${
                best ? "bg-rose-500/[0.06] ring-rose-500/25" : "bg-white/[0.03] ring-white/[0.06]"
            }`}
        >
            <KiteWindowDetails
                window={window}
                hours={day.hours}
                weight={weight}
                profile={profile}
                label={
                    <>
                        <span className="text-xs font-medium text-zinc-400">{getRelativeDayName(day.date)}</span>
                        {best && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">Best</span>}
                    </>
                }
            />
        </article>
    );
};

export default KiteWindowComponent;
