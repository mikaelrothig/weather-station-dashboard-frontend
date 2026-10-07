import { useMemo, useState } from "react";
import SpotHeader from "../components/SpotHeader.tsx";
import ConditionsStrip from "../components/ConditionsStrip.tsx";
import KiteWindowComponent from "../components/KiteWindowComponent.tsx";
import TideComponent from "../components/TideComponent.tsx";
import MacwindComponent from "../components/MacwindComponent.tsx";
import ForecastComponent, { ForecastModel } from "../components/ForecastComponent.tsx";
import ShareDayDialog from "../components/share/ShareDayDialog.tsx";
import { buildShareDay } from "../utils/shareUtils.ts";
import { PageShell } from "../components/PageShell.tsx";
import { useForecast, useSpotInfo, useWaveForecast } from "../api/hooks.ts";
import type { Spot as SpotData } from "../utils/spotUtils.ts";
import { useLiveWind } from "../hooks/useLiveWind.ts";
import SessionComponent from "../components/SessionComponent.tsx";
import { DataNotice } from "../components/ui/DataNotice.tsx";
import DevDataToggle from "../dev/DevDataToggle.tsx";

/** One spot's page; which spot comes from the URL (entries/spot.tsx) */
function Spot({ spot }: { spot: SpotData }) {
    const { name: spotName, offshore, liveStation: showMacwind = false } = spot;
    const spotSubHeading = `${spot.region}, South Africa`;

    const { data: hires, loading: loadingHires, error: errorHires } = useForecast(spotName, "hires");
    const { data: global, loading: loadingGlobal, error: errorGlobal } = useForecast(spotName, "global");
    const { data: waves } = useWaveForecast(spotName);
    const { data: spotData, loading: loadingSpot, error: errorSpot } = useSpotInfo(spotName);

    // Prefer the regional high-res model, but fall back to the global one so the page still works when it's down
    const forecast = hires ?? global;
    const forecastLoading = !forecast && (loadingHires || loadingGlobal);
    const forecastError = !forecast && !forecastLoading ? errorHires ?? errorGlobal : null;

    const live = useLiveWind(showMacwind);
    const liveData = showMacwind ? live.windData : null;
    // Without tide data, Kite windows takes the whole row instead of sitting next to an empty card
    const noTide = !!spotData && !spotData.tide;

    // Sharing a day of whichever model is on screen; built only when someone asks for it
    const [shareTarget, setShareTarget] = useState<{ dayKey: string; model: ForecastModel } | null>(null);
    const shareData = useMemo(() => {
        if (!shareTarget) return null;
        const model = shareTarget.model === "hires" ? hires : global;
        if (!model) return null;
        return buildShareDay({
            dayKey: shareTarget.dayKey,
            spotName,
            region: spotSubHeading,
            model,
            step: shareTarget.model === "gfs" ? 2 : 1, // matches the forecast table's columns
            waves,
            spotData,
        });
    }, [shareTarget, hires, global, waves, spotData, spotName, spotSubHeading]);

    // DOM order is the desktop order (planning at home: overview, kite windows, tide, forecast, then live).
    // On phones the same cards are reordered for the beach: right now, live wind, kite windows, forecast, tide.
    return (
        <PageShell
            after={
                <>
                    <ShareDayDialog data={shareData} onClose={() => setShareTarget(null)} />
                    {import.meta.env.DEV && <DevDataToggle />}
                </>
            }
        >
            {errorHires && <DataNotice hasLiveStation={showMacwind} gfsAvailable={!errorGlobal} />}

            <div className="order-1 md:hidden">
                <SessionComponent
                    spotName={spotName}
                    offshore={offshore}
                    forecast={forecast}
                    forecastLoading={forecastLoading}
                    live={liveData}
                    spotData={spotData}
                />
            </div>

            {/* Desktop: the spot as the page title, then one compact strip of current conditions */}
            <div className="hidden flex-col gap-4 md:flex">
                <SpotHeader spotName={spotName} spotSubHeading={spotSubHeading} coordinates={forecast?.location ?? null} />
                <ConditionsStrip
                    forecast={forecast}
                    forecastLoading={forecastLoading}
                    live={liveData}
                    spotData={spotData}
                    spotLoading={loadingSpot}
                    offshore={offshore}
                />
            </div>

            {/* On phones this wrapper dissolves so its two cards can be ordered independently */}
            <div className="contents md:grid md:gap-4 lg:grid-cols-3">
                <KiteWindowComponent
                    windData={forecast}
                    outlook={global}
                    loading={forecastLoading}
                    error={forecastError}
                    offshore={offshore}
                    index={2}
                    className={`order-3 md:order-none ${noTide ? "lg:col-span-3" : "lg:col-span-2"}`}
                />
                {!noTide && <TideComponent spotData={spotData} loading={loadingSpot} error={errorSpot} index={3} className="order-5 md:order-none" />}
            </div>

            <div className="order-4 md:order-none">
                <ForecastComponent
                    hires={{ data: hires, loading: loadingHires, error: errorHires }}
                    gfs={{ data: global, loading: loadingGlobal, error: errorGlobal }}
                    waves={waves}
                    index={7}
                    onShareDay={(dayKey, model) => setShareTarget({ dayKey, model })}
                />
            </div>

            {showMacwind && (
                <div className="order-2 md:order-none">
                    <MacwindComponent live={live} index={8} />
                </div>
            )}
        </PageShell>
    );
}

export default Spot;
