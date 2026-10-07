import { CSSProperties } from "react";
import { SpotRow } from "../SpotRow";
import { hoverProps, SpotEntry, SpotHover } from "./spotStatus";

/** Every spot, best window first: when to go and what to rig, with the wind right now */
export const SpotListCard = ({ entries, hovered, onHover }: { entries: SpotEntry[] } & SpotHover) => (
    <section aria-labelledby="spots-title" className="card animate-enter flex flex-1 flex-col p-4 md:p-5" style={{ "--i": 3 } as CSSProperties}>
        <header>
            <h2 id="spots-title" className="text-sm font-semibold text-zinc-100">All spots</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Best window first</p>
        </header>
        <ul className="mt-2">
            {entries.map(({ spot, status }) => (
                <li key={spot.url}>
                    <SpotRow spot={spot} status={status} highlighted={hovered === spot.url} {...hoverProps(spot.url, onHover)} />
                </li>
            ))}
        </ul>
    </section>
);
