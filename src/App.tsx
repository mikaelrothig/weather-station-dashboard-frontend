import Header from "./components/Header.tsx";
import DaylightComponent from "./components/DaylightComponent.tsx"
import TemperatureComponent from "./components/TemperatureComponent.tsx";
import MacwindComponent from "./components/MacwindComponent.tsx";
import WRFComponent from "./components/WRFComponent.tsx";
import GFSComponent from "./components/GFSComponent.tsx";
import Footer from "./components/Footer.tsx";
import { useWRFData } from "./hooks/useWRFData.ts";
import { useGFSData } from "./hooks/useGFSData.ts";

function App() {
    const { data: windDataWRF, loading: loadingWRF, error: errorWRF } = useWRFData();
    const { data: windDataGFS, loading: loadingGFS, error: errorGFS } = useGFSData();

    return (
        <div className="max-w-[1536px] mx-auto min-h-screen flex flex-col">
            <div className="px-4 md:px-8 space-y-8 flex-grow">
                <Header />

                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-4 xl:grid-cols-12 gap-8 xl:min-h-56">
                        <div className="col-span-2 bg-zinc-900 rounded-md h-40 xl:mt-11 xl:h-48">
                            <TemperatureComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                        </div>
                        <div className="col-span-2 bg-zinc-900 rounded-md h-40 xl:mt-11 xl:h-48">
                            <DaylightComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                        </div>
                        <div className="col-span-4 xl:col-span-8 space-y-5 overflow-hidden w-full min-h-56">
                            <div className="relative h-full w-full">
                                <div className="absolute rounded-md inset-0 z-[-10] bg-zinc-900 mt-11"></div>
                                <MacwindComponent />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden w-full bg-zinc-900 rounded-md">
                        <WRFComponent windData={windDataWRF} loading={loadingWRF} error={errorWRF} />
                    </div>

                    <div className="overflow-hidden w-full bg-zinc-900 rounded-md">
                        <GFSComponent windData={windDataGFS} loading={loadingGFS} error={errorGFS} />
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}

export default App;