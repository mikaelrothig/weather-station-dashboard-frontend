import SunsetComponent from "../components/SunsetComponent.tsx";
import TemperatureComponent from "../components/TemperatureComponent.tsx";
import SpotInfoComponent from "../components/SpotInfoComponent.tsx";
import MacwindComponent from "../components/MacwindComponent.tsx";
import WRFComponent from "../components/WRFComponent.tsx";
import GFSComponent from "../components/GFSComponent.tsx";
import DesktopNavigation from "../components/DesktopNavigation.tsx";
import MobileNavigation from "../components/MobileNavigation.tsx";
import Footer from "../components/Footer.tsx";
import Snowfall from 'react-snowfall'
import { useWRFData } from "../hooks/useWRFData.ts";
import { useGFSData } from "../hooks/useGFSData.ts";
import { useGFSWData } from "../hooks/useGFSWData.ts";

interface SpotProps {
    spotName: string;
    spotSubHeading: string;
    showMacwind?: boolean;
}

function Spot({ spotName, spotSubHeading, showMacwind = false }: SpotProps) {
    const { data: windDataWRF, loading: loadingWRF, error: errorWRF } = useWRFData(spotName);
    const { data: windDataGFS, loading: loadingGFS, error: errorGFS } = useGFSData(spotName);
    const { data: waveDataGFSW } = useGFSWData(spotName);

    return (
        <div className="flex flex-col lg:flex-row w-full lg:h-screen">
            <div className="hidden lg:block">
                <Snowfall />
            </div>
            <div className="hidden lg:block py-8 pl-8 h-screen">
                <DesktopNavigation />
            </div>

            <MobileNavigation />

            <div className="w-full lg:overflow-y-auto px-4 md:px-8 pt-0 md:pt-4 lg:pt-8">
                <div className="flex flex-col mx-auto h-full max-w-[1536px]">
                    <div className="space-y-8 flex-grow">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="col-span-2 bg-zinc-900 rounded-md h-40 xl:h-48">
                                <SpotInfoComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} spotName={spotName} spotSubHeading={spotSubHeading} />
                            </div>
                            <div className="col-span-1 bg-zinc-900 rounded-md h-40 xl:h-48">
                                <TemperatureComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                            </div>
                            <div className="col-span-1 bg-zinc-900 rounded-md h-40 xl:h-48">
                                <SunsetComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                            </div>
                        </div>

                        <div className="grid gap-8">
                            {showMacwind && (
                                <div className="space-y-5 overflow-hidden w-full min-h-56">
                                    <MacwindComponent />
                                </div>
                            )}

                            <div className="overflow-hidden w-full bg-zinc-900 rounded-md">
                                <WRFComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                            </div>

                            <div className="overflow-hidden w-full bg-zinc-900 rounded-md">
                                <GFSComponent windData={windDataGFS} waveData={waveDataGFSW} loading={loadingGFS} error={errorGFS} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto py-8">
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Spot;