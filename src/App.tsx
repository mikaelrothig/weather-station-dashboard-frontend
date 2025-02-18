import Header from "./components/Header.tsx";
import DaylightComponent from "./components/DaylightComponent.tsx"
import TemperatureComponent from "./components/TemperatureComponent.tsx";
import MacwindComponent from "./components/MacwindComponent.tsx";
import WRFComponent from "./components/WRFComponent.tsx";
import GFSComponent from "./components/GFSComponent.tsx";
import Footer from "./components/Footer.tsx";

function App() {
    return (
        <div className="max-w-[1536px] mx-auto min-h-screen flex flex-col">
            <div className="px-4 md:px-8 space-y-8 flex-grow">
                <Header />

                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-4 xl:grid-cols-12 gap-8 xl:min-h-56">
                        <div className="col-span-2 bg-zinc-900 rounded-md h-40 xl:mt-11 xl:h-48">
                            <TemperatureComponent />
                        </div>
                        <div className="col-span-2 bg-zinc-900 rounded-md h-40 xl:mt-11 xl:h-48">
                            <DaylightComponent />
                        </div>
                        <div className="col-span-4 xl:col-span-8 space-y-5 overflow-hidden w-full min-h-56">
                            <MacwindComponent />
                        </div>
                    </div>

                    <div className="overflow-hidden w-full bg-zinc-900 rounded-md">
                        <WRFComponent />
                    </div>

                    <div className="overflow-hidden w-full bg-zinc-900 rounded-md">
                        <GFSComponent />
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