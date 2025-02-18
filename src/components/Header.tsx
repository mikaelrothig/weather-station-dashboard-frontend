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
        <div className="grid md:grid-cols-2 gap-y-4 pt-8 2xl:pt-12">
            <div className="grid justify-center md:justify-start gap-y-1 md:gap-y-2">
                <h1 className="flex justify-center">Kite Beach Forecast</h1>
                <button className="flex items-center gap-x-2 group"
                        onClick={() => window.open('https://www.google.com/maps?q=-33.82,18.47', '_blank')}
                >
                    <LocateFixed className="stroke-zinc-500 md:group-hover:stroke-zinc-400 h-4 w-4" />
                    <span className="text-base md:text-lg text-zinc-500 md:group-hover:text-zinc-400">Blouberg, Western Cape, South Africa</span>
                </button>
            </div>

            <div className="flex md:flex-col justify-center md:justify-start gap-1 md:gap-2">
                <span className="flex md:justify-end text-base md:text-4xl text-zinc-500 md:text-zinc-200 md:font-bold">{formattedTime}</span>
                <span className="flex md:justify-end text-base md:text-lg text-zinc-500">{formattedDate}</span>
            </div>
        </div>
    );
}

export default Header;