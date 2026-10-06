import { PointerEvent, RefObject, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Spot, spots } from "../utils/spotUtils";
import { SpotList } from "./nav/SpotList";

interface SpotSheetProps {
    open: boolean;
    onClose: () => void;
    returnFocusRef: RefObject<HTMLButtonElement | null>;
    current?: Spot;
    recent: Spot[];
}

// Search only pays off once the list no longer fits on one phone screen
const SEARCH_FROM = 9;

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.11; // px per ms; a quick flick closes regardless of distance

function SpotSheet({ open, onClose, returnFocusRef, current, recent }: SpotSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const drag = useRef<{ startY: number; startTime: number; offset: number } | null>(null);
    const wasOpen = useRef(false);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        // Keep keyboard and screen-reader focus inside the sheet while it's open
        const app = document.getElementById("root");
        document.addEventListener("keydown", handleKey);
        document.body.style.overflow = "hidden";
        if (app) app.inert = true;
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
            if (app) app.inert = false;
        };
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            closeRef.current?.focus({ preventScroll: true });
        } else if (wasOpen.current) {
            returnFocusRef.current?.focus({ preventScroll: true });
        }
        wasOpen.current = open;
    }, [open, returnFocusRef]);

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        // Ignore a second finger once a drag is under way
        if (drag.current || (e.target as HTMLElement).closest("button")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { startY: e.clientY, startTime: performance.now(), offset: 0 };
        if (sheetRef.current) sheetRef.current.style.transition = "none";
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!drag.current || !sheetRef.current) return;
        const delta = e.clientY - drag.current.startY;
        // Dragging up past the resting point gets heavier the further it goes
        const offset = delta < 0 ? -Math.sqrt(-delta) * 2 : delta;
        drag.current.offset = offset;
        sheetRef.current.style.transform = `translateY(${offset}px)`;
    };

    const onPointerUp = () => {
        if (!drag.current || !sheetRef.current) return;
        const { offset, startTime } = drag.current;
        drag.current = null;

        const velocity = offset / (performance.now() - startTime);
        sheetRef.current.style.transition = "";
        sheetRef.current.style.transform = "";

        if (offset > DISMISS_DISTANCE || (offset > 10 && velocity > DISMISS_VELOCITY)) onClose();
    };

    return createPortal(
        <div className="md:hidden">
            <div
                className={`fixed inset-0 z-[60] bg-black/60 transition-opacity ${
                    open ? "opacity-100 duration-300" : "pointer-events-none opacity-0 duration-200"
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-label="Choose a spot"
                inert={!open}
                className={`card fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col rounded-b-none rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))] transition-[transform,visibility] motion-reduce:transition-none ${
                    open ? "visible translate-y-0 duration-500 ease-drawer" : "invisible translate-y-full duration-300 ease-drawer"
                }`}
            >
                <div
                    className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <div className="flex justify-center pb-2 pt-3">
                        <div className="h-1 w-9 rounded-full bg-white/15" />
                    </div>
                    <div className="flex items-center gap-2.5 px-5 pb-2">
                        <span className="text-base font-semibold text-zinc-100">Choose a spot</span>
                        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="btn-icon ml-auto size-10">
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-col px-3">
                    <SpotList current={current} recent={recent} showSearch={spots.length >= SEARCH_FROM} touch />
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default SpotSheet;
