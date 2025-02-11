import Header from "./Header.tsx";
import WindData from "./WindData.tsx";

function App() {
    return <div className="mx-12 my-12 space-y-8">
        <Header/>
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="bg-zinc-900 rounded-md min-h-36 min-w-36">
                </div>
                <div className="bg-zinc-900 rounded-md min-h-36 min-w-36">

                </div>
                <div className="overflow-hidden">
                    <WindData/>
                </div>
            </div>

            <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md">

            </div>

            <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md">

            </div>
        </div>
    </div>
}

export default App;