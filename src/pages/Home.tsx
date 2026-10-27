import { useMemo, useState } from "react";
import { CSSProperties } from "react";
import { CalendarDays, TriangleAlert, Wind } from "lucide-react";
import { PageShell } from "../components/PageShell.tsx";
import { RiderSettingsMenu } from "../components/RiderSettings.tsx";
import { MapCard } from "../components/home/MapCard.tsx";
import { TodayPanel } from "../components/home/TodayPanel.tsx";
import { pickBestWindow, pickWindiest, windowScore } from "../components/home/spotStatus.ts";
import { useSpotEntries } from "../hooks/useSpotEntries.ts";
import { useLiveWind } from "../hooks/useLiveWind.ts";
import { getMinutesSince, LIVE_STALE_AFTER_MINUTES } from "../utils/conditionsUtils.ts";
import { spots } from "../utils/spotUtils.ts";
import { formatDate } from "../utils/timeUtils";
import DevDataToggle from "../dev/DevDataToggle.tsx";

// The spot with the weather station, whose live reading shows on the map
const STATION_SPOT = spots.find((spot) => spot.liveStation);

// Remembers whether the viewer closed the best window's details
const BEST_OPEN_KEY = "home-map-best-window";

/** Open unless the viewer closed it last time; on phones it starts closed, where its summary is enough to lead into the map */
const readBestOpen = () => {
    try {
        const stored = localStorage.getItem(BEST_OPEN_KEY);
        if (stored) return stored !== "hidden";
    } catch {
        // Storage refused (private windows): the default
    }
    return !window.matchMedia("(max-width: 639px)").matches;
};

/**
 * The start page, laid out for what each screen is used for:
 * - Phones (at the beach): today's conditions first, as one card with the page's title and the best kite window, like the
 *   spot page's "Right now" card; then the wind map.
 * - Tablets: the page's title as a heading, like the spot pages', then the best window and the map.
 * - Large screens (planning): the title, then the wind map (two thirds) beside the best window (one third), like the spot
 *   page's Kite windows and Tide row.
 * Pointing at the best window lights its spot up on the map.
 */
function Home() {
    const { entries: coastOrder, hasData, loading, error } = useSpotEntries();
    const [hovered, setHovered] = useState<string | null>(null);

    // Every spot stays on the page; one the summary has no forecast for (or the whole summary failing) shows as such.
    // Lead with where to go: the best window first, then the most wind now, then spots without a forecast.
    const entries = useMemo(() => [...coastOrder].sort((a, b) =>
        (b.status ? windowScore(b.status) : -2) - (a.status ? windowScore(a.status) : -2)
        || (b.status?.now.speed ?? -1) - (a.status?.now.speed ?? -1)), [coastOrder]);

    const statuses = entries.flatMap((e) => (e.status ? [e.status] : []));
    const bestWindow = pickBestWindow(statuses);
    const windiest = pickWindiest(statuses);
    const goodToday = statuses.filter((s) => s.window && s.windowDay === "Today").length;

    const summary = statuses.length === 0
        ? "Forecast wind at every spot right now, and the best hours to kite today."
        : goodToday > 0
            ? <>Kiteable at <span className="font-medium text-zinc-200">{goodToday} of {spots.length}</span> spots today.</>
            : bestWindow
                ? "No kite windows today. Here's your best one tomorrow."
                : "No kite windows today or tomorrow. Here's where the most wind is.";
    const notice = error && !hasData && (
        <p role="status" className="flex items-center gap-2.5 rounded-2xl bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/90 ring-1 ring-inset ring-amber-400/20">
            <TriangleAlert className="size-4 shrink-0 text-amber-300" aria-hidden="true" />
            Wind for the spots can't be loaded right now. Each spot's own page may still have it.
        </p>
    );

    // The station's newest reading, polled like the spot page's, and left off the map once it's stale by the same rule
    const { windData: readings } = useLiveWind(!!STATION_SPOT);
    const latest = readings?.[0];
    const minutesAgo = latest ? getMinutesSince(new Date(latest.time)) : Infinity;
    const live = STATION_SPOT && latest && minutesAgo <= LIVE_STALE_AFTER_MINUTES ? { url: STATION_SPOT.url, speed: latest.speed, minutesAgo } : null;

    const [bestOpen, setBestOpen] = useState(readBestOpen);
    const toggleBest = () => {
        setBestOpen(!bestOpen);
        try {
            localStorage.setItem(BEST_OPEN_KEY, bestOpen ? "hidden" : "shown");
        } catch {
            // Just not remembered
        }
    };
    const today = (intro: boolean) => (
        <TodayPanel
            summary={summary}
            best={bestWindow}
            windiest={windiest}
            alsoToday={statuses.filter((s) => s.window && s.windowDay === "Today" && s !== bestWindow)}
            open={bestOpen}
            onToggle={toggleBest}
            onHover={setHovered}
            intro={intro}
            className={intro ? "md:hidden" : "hidden md:flex"}
        />
    );

    return (
        <PageShell after={import.meta.env.DEV && <DevDataToggle />}>
            {/* From md the page's title, like the spot page's heading; on phones it's in the first card instead */}
            <header className="animate-enter relative z-30 hidden flex-wrap items-end justify-between gap-x-8 gap-y-3 px-1 md:flex" style={{ "--i": 0 } as CSSProperties}>
                <div className="min-w-0">
                    <p className="eyebrow">
                        <Wind className="size-3.5" aria-hidden="true" />
                        Kite & wind forecast
                    </p>
                    <h1 className="mt-1.5 text-4xl font-semibold tracking-tight text-zinc-50 lg:text-5xl">Today's conditions</h1>
                    <p className="mt-2 text-sm text-zinc-400">{summary}</p>
                </div>
                {/* The date, and the rider settings beside it: every window on the page follows them */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <p className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <CalendarDays className="size-3.5 text-zinc-500" aria-label="Date" />
                        {formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <RiderSettingsMenu />
                </div>
            </header>

            {notice}

            {/* Phones: the page's title and best window lead, then the map */}
            {today(true)}

            {/* From md the best window and the map; from lg side by side, the map taking two thirds, the best window
                stretched to its height */}
            <div className="flex flex-col gap-3 md:gap-4 lg:grid lg:grid-cols-3">
                {today(false)}
                {loading && !hasData ? (
                    <div className="card p-4 md:p-5 lg:order-first lg:col-span-2" aria-busy="true">
                        <div className="aspect-[4/5] animate-pulse rounded-xl bg-white/[0.03] sm:aspect-[4/3] lg:aspect-[16/11]" />
                    </div>
                ) : (
                    <MapCard entries={entries} pick={bestWindow} live={live} hovered={hovered} onHover={setHovered} className="lg:order-first lg:col-span-2" />
                )}
            </div>
        </PageShell>
    );
}

export default Home;
