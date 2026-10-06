import { Navigation2 } from "lucide-react";

interface DirectionArrowProps {
    degrees: number;
    className?: string;
}

// Wind direction is where the wind comes from; the arrow points where it blows to
// No direction (calm, variable) renders nothing rather than an arrow pointing somewhere made up
export const DirectionArrow = ({ degrees, className = "size-3.5 fill-zinc-200 stroke-none" }: DirectionArrowProps) =>
    Number.isFinite(degrees)
        ? <Navigation2 className={className} style={{ transform: `rotate(${degrees + 180}deg)` }} aria-hidden="true" />
        : null;
