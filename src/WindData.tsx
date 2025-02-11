import { useState, useEffect } from 'react';
import { getBackgroundColor } from './ColorUtils.tsx';

export default function GetWindData(){
    const [showEntries, setShowEntries] = useState()
    const apiUrl = 'http://localhost:5173/testData-15min.json';

    function pullJson() {
        let index = 0;
        fetch(apiUrl)
            .then(response => response.json())
            .then(responseData => {
                setShowEntries(responseData.map(function(entry: any) {
                    const bgLow = getBackgroundColor(Math.round(entry.low))
                    const bgAvg = getBackgroundColor(Math.round(entry.avg))
                    const bgHigh = getBackgroundColor(Math.round(entry.high))
                    index++

                    return (
                        <div className={`min-w-12 max-w-12 space-y-0.5 ${index < responseData.length ? 'mr-0.5' : ''}`}>
                            <span className="flex items-center justify-center p-1.5 font-bold bg-zinc-800">{entry.time}</span>
                            <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgLow}`}>{Math.round(entry.low)}</span>
                            <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgAvg}`}>{Math.round(entry.avg)}</span>
                            <span className={`flex items-center justify-center p-1.5 font-bold text-zinc-950 ${bgHigh}`}>{Math.round(entry.high)}</span>
                            <span className="flex items-center justify-center p-1.5 font-bold bg-zinc-800">{entry.dir}</span>
                        </div>
                    )
                }))
            })
    }

    useEffect(() => {
        pullJson()
    }, []);

    return (
        <div className="flex bg-zinc-900 rounded-md overflow-hidden gap-x-0.5">
            <div className="flex flex-col gap-y-0.5 min-w-36 max-w-36">
                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Time</span>
                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Low (knots)</span>
                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Avg (knots)</span>
                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">High (knots)</span>
                <span className="flex justify-center p-1.5 font-bold bg-zinc-800 text-zinc-500 text-xs">Wind direction</span>
            </div>

            <div className="flex overflow-scroll">
                {showEntries}
            </div>
        </div>
    );
}