import { RefObject } from "react";
import { Spot, spots } from "../utils/spotUtils";
import { SpotRow } from "./SpotRow";
import { BottomSheet } from "./ui/BottomSheet";

interface SpotSheetProps {
    open: boolean;
    onClose: () => void;
    returnFocusRef: RefObject<HTMLButtonElement | null>;
    current?: Spot;
}

function SpotSheet({ open, onClose, returnFocusRef, current }: SpotSheetProps) {
    return (
        <BottomSheet open={open} onClose={onClose} returnFocusRef={returnFocusRef} title="Choose a spot">
            {/* Scrolls on short screens, like a phone held sideways */}
            <nav aria-label="Spots" className="scrollbar-subtle min-h-0 overflow-y-auto overscroll-contain px-5 pb-2">
                <ul>
                    {spots.map((spot) => (
                        <li key={spot.url}>
                            <SpotRow spot={spot} current={spot === current} touch />
                        </li>
                    ))}
                </ul>
            </nav>
        </BottomSheet>
    );
}

export default SpotSheet;
