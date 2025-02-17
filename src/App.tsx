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
            <div className="px-8 space-y-8 flex-grow">
                <Header />

                <div className="flex flex-col gap-8">
                    <div className="flex gap-8">
                        <div className="bg-zinc-900 rounded-md min-h-56 min-w-56">
                            <TemperatureComponent />
                        </div>
                        <div className="bg-zinc-900 rounded-md min-h-56 min-w-56">
                            <DaylightComponent />
                        </div>
                        <div className="space-y-5 overflow-hidden w-full min-h-56">
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

            {/* Footer pushed to bottom if not enough content */}
            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}

export default App;