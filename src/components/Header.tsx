import { useState, useEffect } from "react";
import { LocateFixed } from "lucide-react";

function Header() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "short" });

    return (
        <div className="flex justify-between pt-8">
            <div className="flex flex-col gap-y-2">
                <h1>Kite Beach Forecast</h1>
                <div className="flex items-center gap-x-2">
                    <LocateFixed className="stroke-zinc-500 h-4 w-4" />
                    <span className="text-lg text-zinc-500">Blouberg, Western Cape, South Africa</span>
                </div>
            </div>

            <div className="flex flex-col gap-y-2">
                <span className="flex justify-end text-4xl text-zinc-200 font-bold">{formattedTime}</span>
                <span className="flex justify-end text-lg text-zinc-500">{formattedDate}</span>
            </div>
        </div>
    );
}

export default Header;