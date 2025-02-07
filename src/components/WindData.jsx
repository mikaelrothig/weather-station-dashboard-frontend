import React, { useState, useEffect } from 'react';

export default function GetWindData(){
    const [showEntries, setShowEntries] = useState()
    const apiUrl = 'http://localhost:4321/testData.json';

    function pullJson() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(responseData => {
                setShowEntries(responseData.map(function(entry) {
                    let bgLow = getBackgroundColor(entry.low)
                    let bgAvg = getBackgroundColor(entry.avg)
                    let bgHigh = getBackgroundColor(entry.high)

                    return (
                        <div>
                            <div className="grid grid-cols-12 gap-x-2 border rounded border-gray-950">
                                <span className="flex col-span-3 items-center justify-center px-4 py-2 font-bold text-sm">{entry.time}</span>
                                <span className={`flex col-span-2 items-center justify-center px-4 py-2 rounded font-bold text-sm ${bgLow}`}>{Math.round(entry.low)}</span>
                                <span className={`flex col-span-2 items-center justify-center px-4 py-2 rounded font-bold text-sm ${bgAvg}`}>{Math.round(entry.avg)}</span>
                                <span className={`flex col-span-2 items-center justify-center px-4 py-2 rounded font-bold text-sm ${bgHigh}`}>{Math.round(entry.high)}</span>
                                <span className="flex col-span-3 items-center justify-center px-4 py-2 bg-zinc-900 rounded font-bold text-sm">{entry.dir}</span>
                            </div>
                        </div>
                    )
                }))
            })
    }

    function getBackgroundColor(entry) {
        let bgColor;

        switch (true) {
            case entry >= 40:
                bgColor = 'bg-purple-600';
                break;
            case entry >= 35:
                bgColor = 'bg-pink-600';
                break;
            case entry >= 30:
                bgColor = 'bg-rose-600';
                break;
            case entry >= 25:
                bgColor = 'bg-orange-600';
                break;
            case entry >= 20:
                bgColor = 'bg-yellow-600';
                break;
            case entry >= 15:
                bgColor = 'bg-emerald-600';
                break;
            case entry >= 10:
                bgColor = 'bg-teal-600';
                break;
            default:
                bgColor = 'bg-cyan-600';
        }

        return bgColor;
    }

    useEffect(() => {
        pullJson()
    }, []);

    return (
        <div className="border border-zinc-900 rounded-lg p-3 space-y-2 overflow-scroll">
            {showEntries}
        </div>
    );
}