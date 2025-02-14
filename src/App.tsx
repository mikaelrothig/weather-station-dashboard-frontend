import Header from "./Header.tsx";
import WindguruWRF9km from "./WindguruWRF9km.tsx";

function App() {
    return <div className="max-w-[1536px] mx-auto">
        <div className="px-4 py-4 space-y-8">
            <Header/>

            <div className="flex flex-col gap-8">
                <div className="flex gap-8">
                    <div className="bg-zinc-900 rounded-md min-h-36 min-w-36">
                    </div>
                    <div className="bg-zinc-900 rounded-md min-h-36 min-w-36">
                    </div>
                    <div className="bg-zinc-900 rounded-md w-full min-h-36">
                    </div>
                </div>

                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md">
                    <WindguruWRF9km/>
                </div>

                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md">

                </div>
            </div>
        </div>
    </div>
}

export default App;