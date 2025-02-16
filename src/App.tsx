import Header from "./Header.tsx";
import WRFComponent from "./components/WRFComponent.tsx";
import GFSComponent from "./components/GFSComponent.tsx"
import DaylightComponent from "./components/DaylightComponent.tsx"

function App() {
    return <div className="max-w-[1536px] mx-auto">
        <div className="px-4 py-4 space-y-8">
            <Header/>

            <div className="flex flex-col gap-8">
                <div className="flex gap-8">
                    <div className="bg-zinc-900 rounded-md min-h-56 min-w-56">
                    </div>
                    <div className="bg-zinc-900 rounded-md min-h-56 min-w-56">
                        <DaylightComponent/>
                    </div>
                    <div className="bg-zinc-900 rounded-md w-full min-h-56">
                    </div>
                </div>

                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md">
                    <WRFComponent/>
                </div>

                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md">
                    <GFSComponent/>
                </div>
            </div>
        </div>
    </div>
}

export default App;