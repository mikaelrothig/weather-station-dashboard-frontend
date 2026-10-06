import { useEffect, useState } from "react";
import { CalendarDays, Clock, Crosshair, MapPin } from "lucide-react";
import { formatClock, formatDate, isDeviceOnSpotTime } from "../utils/TimeUtils";

interface SpotHeaderProps {
    spotName: string;
    spotSubHeading: string;
    coordinates: { lat: number; lon: number } | null;
}

// Desktop page title: the spot is the page, so it reads as a heading rather than competing as another card
const SpotHeader = ({ spotName, spotSubHeading, coordinates }: SpotHeaderProps) => {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 15 * 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <header className="animate-enter flex flex-wrap items-end justify-between gap-x-8 gap-y-3 px-1">
            <div className="min-w-0">
                <p className="eyebrow">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {spotSubHeading}
                </p>
                <h1 className="mt-1.5 text-4xl font-semibold tracking-tight text-zinc-50 lg:text-5xl">{spotName}</h1>
            </div>

            <dl className="flex flex-wrap gap-x-5 gap-y-1.5 pb-1 text-sm text-zinc-400">
                <div className="flex items-center gap-1.5">
                    <dt><CalendarDays className="size-3.5 text-zinc-500" aria-label="Date" /></dt>
                    <dd>{formatDate(now, { weekday: "long", day: "numeric", month: "long" })}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                    <dt><Clock className="size-3.5 text-zinc-500" aria-label="Local time" /></dt>
                    <dd className="tabular-nums">
                        {formatClock(now)}
                        {!isDeviceOnSpotTime(now) && <span className="ml-1.5 text-xs text-zinc-500">spot time</span>}
                    </dd>
                </div>
                {coordinates && (
                    <div className="flex items-center gap-1.5">
                        <dt><Crosshair className="size-3.5 text-zinc-500" aria-label="Coordinates" /></dt>
                        <dd className="tabular-nums">{coordinates.lat.toFixed(2)}, {coordinates.lon.toFixed(2)}</dd>
                    </div>
                )}
            </dl>
        </header>
    );
};

export default SpotHeader;
