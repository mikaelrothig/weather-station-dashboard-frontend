import { CSSProperties, useMemo, useState } from "react";
import { CalendarDays, MapPin, TriangleAlert, Wind } from "lucide-react";
import { PageShell } from "../components/PageShell.tsx";
import { RiderSettingsMenu } from "../components/RiderSettings.tsx";
import { BestWindowCard } from "../components/home/BestWindowCard.tsx";
import { MapCard } from "../components/home/MapCard.tsx";
import { SpotListCard } from "../components/home/SpotListCard.tsx";
import { pickBestWindow, pickWindiest, windowScore } from "../components/home/spotStatus.ts";
import { useSpotEntries } from "../hooks/useSpotEntries.ts";
import { formatDate } from "../utils/TimeUtils.tsx";
import { spots } from "../utils/spotUtils.ts";
import DevDataToggle from "../dev/DevDataToggle.tsx";

/**
 * The start page: the Western Cape map with the wind at every spot, the rider's best kite window, and every spot
 * ranked by its window. Pointing at a spot in the map, the list or the best window lights it up in the others.
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

    return (
        <PageShell after={import.meta.env.DEV && <DevDataToggle />}>
            {/* z-20: the cards below each animate in with a transform, so without it they'd paint over the settings popover */}
            <header className="animate-enter relative z-20 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 px-1" style={{ "--i": 0 } as CSSProperties}>
                <div className="min-w-0">
                    <p className="eyebrow">
                        <Wind className="size-3.5" aria-hidden="true" />
                        Kite & wind forecast
                    </p>
                    <h1 className="mt-1.5 text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-zinc-50 md:text-4xl lg:text-5xl">
                        Today's conditions
                    </h1>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
                        {statuses.length === 0
                            ? "Forecast wind at every spot right now, and the best hours to kite today."
                            : goodToday > 0
                                ? <>Kiteable at <span className="font-medium text-zinc-200">{goodToday} of {spots.length}</span> spots today. Here's where and when.</>
                                : bestWindow
                                    ? "No kite windows today. Here's your best one tomorrow."
                                    : "No kite windows today or tomorrow. Here's where the most wind is."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-zinc-400">
                        <div className="flex items-center gap-1.5">
                            <dt><CalendarDays className="size-3.5 text-zinc-500" aria-label="Date" /></dt>
                            <dd>{formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}</dd>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <dt><MapPin className="size-3.5 text-zinc-500" aria-label="Spots" /></dt>
                            <dd>{spots.length} spots</dd>
                        </div>
                    </dl>
                    {/* Kite windows and sizes everywhere on the page follow these, so they can be changed right here */}
                    <RiderSettingsMenu />
                </div>
            </header>

            {error && !hasData && (
                <p role="status" className="flex items-center gap-2.5 rounded-2xl bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/90 ring-1 ring-inset ring-amber-400/20">
                    <TriangleAlert className="size-4 shrink-0 text-amber-300" aria-hidden="true" />
                    Wind for the spots can't be loaded right now. Each spot's own page may still have it.
                </p>
            )}

            {loading && !hasData ? (
                <div className="grid gap-3 md:gap-4 lg:grid-cols-3" aria-busy="true">
                    <div className="card aspect-[16/11] animate-pulse lg:col-span-2" />
                    <div className="card min-h-80 animate-pulse" />
                </div>
            ) : (
                // The map takes two thirds; the best window and the list share the last third
                <div className="grid gap-3 md:gap-4 lg:grid-cols-3">
                    <MapCard entries={entries} featured={bestWindow ?? windiest} hovered={hovered} onHover={setHovered} className="lg:col-span-2" />
                    <div className="flex min-w-0 flex-col gap-3 md:gap-4">
                        {windiest && <BestWindowCard best={bestWindow} windiest={windiest} onHover={setHovered} />}
                        <SpotListCard entries={entries} hovered={hovered} onHover={setHovered} />
                    </div>
                </div>
            )}
        </PageShell>
    );
}

export default Home;
