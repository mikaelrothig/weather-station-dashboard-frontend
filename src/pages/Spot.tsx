import { ReactNode } from "react";
import SunsetComponent from "../components/SunsetComponent.tsx";
import TemperatureComponent from "../components/TemperatureComponent.tsx";
import SpotInfoComponent from "../components/SpotInfoComponent.tsx";
import MacwindComponent from "../components/MacwindComponent.tsx";
import WRFComponent from "../components/WRFComponent.tsx";
import GFSComponent from "../components/GFSComponent.tsx";
import DesktopNavigation from "../components/DesktopNavigation.tsx";
import MobileNavigation from "../components/MobileNavigation.tsx";
import Footer from "../components/Footer.tsx";
import { useWRFData } from "../hooks/useWRFData.ts";
import { useGFSData } from "../hooks/useGFSData.ts";
import { useGFSWData } from "../hooks/useGFSWData.ts";

interface SpotProps {
    spotName: string;
    spotSubHeading: string;
    showMacwind?: boolean;
    extraComponent?: ReactNode;
}

function Spot({ spotName, spotSubHeading, showMacwind = false, extraComponent }: SpotProps) {
    const { data: windDataWRF, loading: loadingWRF, error: errorWRF } = useWRFData(spotName);
    const { data: windDataGFS, loading: loadingGFS, error: errorGFS } = useGFSData(spotName);
    const { data: waveDataGFSW } = useGFSWData(spotName);

    return (
        <div className="flex flex-col w-full lg:flex-row lg:h-screen bg-zinc-900">
            <div className="flex-col hidden h-screen py-6 pl-4 pr-2 lg:flex shrink-0">
                <DesktopNavigation />
            </div>

            <MobileNavigation />

            <div className="flex-1 min-w-0 lg:overflow-hidden lg:py-4 lg:pl-2 lg:pr-4">
                <div className="lg:border-4 lg:border-zinc-950 bg-zinc-950 lg:rounded-2xl lg:h-full lg:overflow-y-auto lg:shadow-lg">
                    <div className="flex flex-col mx-auto h-full max-w-[1536px] px-4 md:px-8 pt-0 md:pt-8">
                        <div className="flex-grow space-y-4 md:space-y-8">
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-8">
                                <div className="col-span-2 rounded-md bg-zinc-900 h-44 md:h-48 xl:h-52">
                                    <SpotInfoComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} spotName={spotName} spotSubHeading={spotSubHeading} />
                                </div>
                                <div className="col-span-1 rounded-md bg-zinc-900 h-44 md:h-48 xl:h-52">
                                    <TemperatureComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                                </div>
                                <div className="col-span-1 rounded-md bg-zinc-900 h-44 md:h-48 xl:h-52">
                                    <SunsetComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                                </div>
                            </div>

                            <div className="grid gap-4 md:gap-8">
                                {showMacwind && (
                                    <div className="w-full overflow-hidden">
                                        <MacwindComponent />
                                    </div>
                                )}

                                <div className="w-full overflow-hidden rounded-md bg-zinc-900">
                                    <WRFComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                                </div>

                                <div className="w-full overflow-hidden rounded-md bg-zinc-900">
                                    <GFSComponent windData={windDataGFS} waveData={waveDataGFSW} loading={loadingGFS} error={errorGFS} />
                                </div>

                                {extraComponent}
                            </div>
                        </div>

                        <div className="py-4 mt-auto md:py-8">
                            <Footer />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Spot;
