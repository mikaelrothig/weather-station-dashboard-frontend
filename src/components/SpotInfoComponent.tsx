import { useState, useEffect } from "react";
import { Info } from "lucide-react";

interface SpotInfoProps {
    windData: {
        fcst: {
            init_h: string;
            hours: number[];
            TMP: number[];
        };
        lat: number;
        lon: number;
    } | null;
    loading: boolean;
    error: string | null;
    spotName: string;
    spotSubHeading: string;
}

const SpotInfoComponent = ({ windData, loading, error, spotName, spotSubHeading }: SpotInfoProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "short" });

    if (loading) return <p className="p-4 font-bold">Loading...</p>;
    if (error) return <p className="p-4 font-bold text-rose-600">{error}</p>;
    if (!windData) return <p className="p-4 font-bold text-zinc-600">No wind data available</p>;

    return (
        <div className="flex flex-col h-full p-3 space-y-3 rounded-md overflow-hidden">
             <span className="flex px-3 py-2 min-h-9 max-h-9 items-center bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-bold uppercase gap-x-2 rounded-md">
                <Info className="stroke-zinc-500 h-4 w-4" />
                SPOT INFO
            </span>

            <div className="flex flex-col h-full justify-between">
                <div>
                    <h1>{spotName}</h1>
                    <span className="text-sm text-zinc-500 md:group-hover:text-zinc-400">{spotSubHeading}</span>
                </div>

                <div className="flex gap-2">
                    <span className="flex items-center px-3 py-2 h-9 rounded-md bg-zinc-200 dark:bg-zinc-800 font-bold">{formattedDate}</span>
                    <span className="flex items-center px-3 py-2 h-9 rounded-md bg-zinc-200 dark:bg-zinc-800 font-bold">{formattedTime}</span>
                    <span className="flex items-center px-3 py-2 h-9 rounded-md bg-zinc-200 dark:bg-zinc-800 font-bold">{windData.lat}, {windData.lon}</span>
                </div>
            </div>
        </div>
    );
};

export default SpotInfoComponent;