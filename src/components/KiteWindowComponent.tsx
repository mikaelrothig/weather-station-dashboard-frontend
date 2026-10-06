import { CSSProperties, useId, useState } from "react";
import { ChevronDown, Minus, Plus, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { getWindBackgroundColor } from "../utils/ColorUtils.tsx";
import { getDegreesToCompass } from "../utils/DataUtils.tsx";
import { formatClock, formatDate, getDayKey } from "../utils/TimeUtils.tsx";
import { getRelativeDayName } from "../utils/forecastUtils.ts";
import { chooseKite, describeKites, EXPERIENCE_PROFILES, Experience, ExperienceProfile, findKiteWindows, KiteDay, OWNABLE_KITE_SIZES } from "../utils/kiteUtils.ts";
import { MAX_WEIGHT, MIN_WEIGHT, useRiderSettings } from "../hooks/useRiderSettings.ts";
import { DirectionArrow } from "./ui/DirectionArrow.tsx";
import { SegmentedControl } from "./ui/SegmentedControl.tsx";
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
    const panelId = useId();

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
            // Without a next window to show, a quiet week shouldn't stretch to match the Tide card next to it
            className={`card animate-enter flex min-w-0 flex-col p-4 md:p-5 ${allQuiet && !nextWindow ? "lg:self-start" : ""} ${className}`}
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

                <button
                    type="button"
                    onClick={() => setSettingsOpen((open) => !open)}
                    aria-expanded={settingsOpen}
                    aria-controls={panelId}
                    className={`pressable flex h-9 min-w-0 items-center gap-2 rounded-lg px-3 text-xs font-medium text-zinc-200 hover:bg-white/10 ${
                        settingsOpen ? "bg-white/10" : "bg-white/[0.06]"
                    }`}
                >
                    <SlidersHorizontal className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                    <span className="truncate">{profile.label} · {weight} kg · {describeKites(kites)}</span>
                    <ChevronDown
                        className={`size-3.5 shrink-0 text-zinc-500 transition-transform duration-200 ease-out ${settingsOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                    />
                </button>
            </header>

            {settingsOpen && <RiderSettingsPanel id={panelId} onDone={() => setSettingsOpen(false)} />}

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

            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                A forecast-based suggestion. Always check conditions on the beach before you ride.
            </p>
        </section>
    );
};

// Saved on the device and shared by every spot, so it only needs setting up once
const RiderSettingsPanel = ({ id, onDone }: { id: string; onDone: () => void }) => {
    const { weight, experience, kites, setWeight, setExperience, toggleKite } = useRiderSettings();

    return (
        <div id={id} className="animate-fade mt-4 flex flex-col gap-4 rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.06]">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="text-xs font-medium text-zinc-400">Experience</span>
                <SegmentedControl
                    label="Rider experience"
                    value={experience}
                    onChange={setExperience}
                    options={(Object.keys(EXPERIENCE_PROFILES) as Experience[]).map((level) => ({
                        value: level,
                        label: EXPERIENCE_PROFILES[level].label,
                    }))}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="text-xs font-medium text-zinc-400">Weight</span>
                <div className="flex h-9 items-center rounded-lg bg-white/[0.06]" role="group" aria-label="Rider weight">
                    <button
                        type="button"
                        onClick={() => setWeight(weight - 5)}
                        disabled={weight <= MIN_WEIGHT}
                        aria-label="Decrease rider weight"
                        className="pressable grid size-9 place-items-center rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
                    >
                        <Minus className="size-3.5" />
                    </button>
                    <span className="w-14 text-center text-xs font-medium tabular-nums text-zinc-200" aria-live="polite">{weight} kg</span>
                    <button
                        type="button"
                        onClick={() => setWeight(weight + 5)}
                        disabled={weight >= MAX_WEIGHT}
                        aria-label="Increase rider weight"
                        className="pressable grid size-9 place-items-center rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
                    >
                        <Plus className="size-3.5" />
                    </button>
                </div>
            </div>

            <fieldset>
                <legend className="text-xs font-medium text-zinc-400">Your kites</legend>
                <p className="mt-0.5 text-[11px] text-zinc-500">Select every size you own, in m².</p>
                <div className="mt-2.5 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                    {OWNABLE_KITE_SIZES.map((size) => {
                        const owned = kites.includes(size);
                        return (
                            <button
                                key={size}
                                type="button"
                                aria-pressed={owned}
                                aria-label={`${size} square metre kite`}
                                onClick={() => toggleKite(size)}
                                className={`pressable h-10 rounded-lg text-sm font-semibold tabular-nums ring-1 ring-inset ${
                                    owned
                                        ? "bg-rose-500/15 text-rose-200 ring-rose-500/40"
                                        : "bg-white/[0.04] text-zinc-400 ring-transparent hover:bg-white/[0.08] hover:text-zinc-200"
                                }`}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                <p className="text-[11px] text-zinc-500">Saved on this device and used for every spot.</p>
                <button
                    type="button"
                    onClick={onDone}
                    className="pressable h-8 rounded-lg bg-white/10 px-3 text-xs font-medium text-zinc-100 hover:bg-white/[0.14]"
                >
                    Done
                </button>
            </div>
        </div>
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

const windRange = (min: number, max: number) =>
    Math.round(min) === Math.round(max) ? `${Math.round(max)}` : `${Math.round(min)}–${Math.round(max)}`;

const DayPanel = ({ day, weight, profile, best }: { day: KiteDay; weight: number; profile: ExperienceProfile; best: boolean }) => {
    const { window } = day;
    const inWindow = (time: Date) => !!window && time >= window.start && time < window.end;

    // With the rider's kites: lead with the one you rig first, and list switches as the wind changes.
    // Without them: one suggested size for the average wind plus the range, since every 1 m² step isn't a real switch.
    const suggestedOnly = window?.hours[0]?.kite.fit === "suggested";
    const plan = window?.plan ?? [];
    const mainKite = window ? (suggestedOnly ? chooseKite(weight, window.avgSpeed, profile, []).size : plan[0].size) : 0;
    const switches = suggestedOnly ? [] : plan.slice(1, 3);
    const sizes = window ? window.hours.map((h) => h.kite.size) : [];
    const range = suggestedOnly && Math.min(...sizes) !== Math.max(...sizes) ? `${Math.min(...sizes)}–${Math.max(...sizes)} m²` : null;
    const gusty = window ? window.maxGust - window.avgSpeed >= profile.gustyAt : false;

    const strip = day.hours.length > 0 && (
        <div>
            <div className={`flex gap-px ${window ? "h-5" : "h-2.5"}`} aria-hidden="true">
                {day.hours.map((hour) => (
                    <div
                        key={hour.time.getTime()}
                        title={`${formatTime(hour.time)} · ${Math.round(hour.speed)} kn ${getDegreesToCompass(hour.direction)}${hour.offshore ? " (offshore)" : ""}`}
                        className={`flex-1 first:rounded-l-md last:rounded-r-md ${getWindBackgroundColor(Math.round(hour.speed))} ${
                            hour.past ? "opacity-10" : inWindow(hour.time) ? "" : "opacity-25"
                        }`}
                    />
                ))}
            </div>
            {window && (
                <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-500">
                    <span>{formatTime(day.hours[0].time)}</span>
                    <span>{formatTime(new Date(day.hours[day.hours.length - 1].time.getTime() + 60 * 60 * 1000))}</span>
                </div>
            )}
        </div>
    );

    // No window: a quiet one-liner with the reason, so the days worth going stand out
    if (!window) {
        return (
            <article className="flex flex-col gap-2.5 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.04] md:p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <h3 className="text-xs font-medium text-zinc-400">{getRelativeDayName(day.date)}</h3>
                    <p className="text-sm font-medium text-zinc-500">{day.reason}</p>
                </div>
                {strip}
            </article>
        );
    }

    return (
        <article
            className={`flex flex-col gap-3 rounded-xl p-3 ring-1 ring-inset md:p-3.5 ${
                best ? "bg-rose-500/[0.06] ring-rose-500/25" : "bg-white/[0.03] ring-white/[0.06]"
            }`}
        >
            {/* The answer first: when, and what to rig */}
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-400">{getRelativeDayName(day.date)}</span>
                        {best && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">Best</span>}
                    </p>
                    <h3 className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-semibold tabular-nums tracking-tight text-zinc-50">
                            {formatTime(window.start)}–{formatTime(window.end)}
                        </span>
                        <span className="text-xs text-zinc-500">{window.duration}h</span>
                    </h3>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-[11px] text-zinc-500">{suggestedOnly ? "Suggested" : "Your kite"}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-50">{mainKite} m²</p>
                </div>
            </header>

            {strip}

            {/* Phones: one line. Desktop: the labelled breakdown for planning. */}
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-400 md:hidden">
                <span className="font-medium tabular-nums text-zinc-100">{windRange(window.minSpeed, window.maxSpeed)} kn</span>
                · gusts <span className="font-medium tabular-nums text-zinc-100">{Math.round(window.maxGust)}</span>
                ·
                <DirectionArrow degrees={window.direction} className="size-3 fill-zinc-300 stroke-none" />
                <span className="font-medium text-zinc-100">{getDegreesToCompass(window.direction)}</span>
            </p>
            <dl className="hidden grid-cols-3 gap-2 text-xs md:grid">
                <div>
                    <dt className="text-zinc-500">Wind</dt>
                    <dd className="font-medium tabular-nums text-zinc-100">{windRange(window.minSpeed, window.maxSpeed)} kn</dd>
                </div>
                <div>
                    <dt className="text-zinc-500">Gusts</dt>
                    <dd className="font-medium tabular-nums text-zinc-100">{Math.round(window.maxGust)} kn</dd>
                </div>
                <div>
                    <dt className="text-zinc-500">Direction</dt>
                    <dd className="flex items-center gap-1 font-medium text-zinc-100">
                        <DirectionArrow degrees={window.direction} className="size-3 fill-zinc-300 stroke-none" />
                        {getDegreesToCompass(window.direction)}
                    </dd>
                </div>
            </dl>

            {(switches.length > 0 || range || gusty) && (
                <ul className="space-y-1 border-t border-white/[0.06] pt-2.5 text-[11px] text-zinc-400">
                    {range && <li>Size range over the window: <span className="font-medium tabular-nums text-zinc-200">{range}</span></li>}
                    {switches.map((step) => (
                        <li key={step.from.getTime()}>
                            Switch to <span className="font-medium tabular-nums text-zinc-200">{step.size} m²</span> at{" "}
                            <span className="tabular-nums">{formatTime(step.from)}</span>
                        </li>
                    ))}
                    {gusty && (
                        <li className="flex items-center gap-1.5 text-amber-300">
                            <TriangleAlert className="size-3 shrink-0" aria-hidden="true" />
                            Gusty, consider sizing down
                        </li>
                    )}
                </ul>
            )}
        </article>
    );
};

export default KiteWindowComponent;
