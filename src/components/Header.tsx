import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { getCurrentSpot, spots } from "../utils/spotUtils";
import SpotSheet from "./SpotSheet";
import { Logo } from "./ui/Logo";

type PageSwapEvent = Event & { viewTransition?: { skipTransition: () => void } | null };

const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Six spots fit, so they're all in view: a row of links on tablets and up, with the current one in a pill that slides
 * to the next spot as its page loads. Phones get the spot's name as a button that opens a sheet with every spot.
 * Keys 1–6 jump straight to a spot, without the slide: keyboard actions never animate.
 */
function Header() {
    const current = getCurrentSpot();
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetTriggerRef = useRef<HTMLButtonElement>(null);
    const closeSheet = useCallback(() => setSheetOpen(false), []);

    useEffect(() => {
        let fromKeyboard = false;
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return;
            const spot = spots[Number(e.key) - 1];
            if (!spot || spot === current) return;
            fromKeyboard = true;
            window.location.href = spot.url;
        };
        // Fires on this page just before the next one takes over; a keyboard jump skips the pill's slide
        const onPageSwap = (e: Event) => {
            if (fromKeyboard) (e as PageSwapEvent).viewTransition?.skipTransition();
        };
        document.addEventListener("keydown", onKey);
        window.addEventListener("pageswap", onPageSwap);
        return () => {
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("pageswap", onPageSwap);
        };
    }, [current]);

    return (
        <header className="glass-chrome sticky top-0 z-40 border-b border-white/[0.06] bg-canvas/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-1.5 px-4 md:gap-4 md:px-6 lg:px-8">
                <a href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="Kite Beach Forecast home">
                    <Logo />
                    <span className="hidden text-sm font-semibold tracking-tight text-zinc-100 xl:block">Kite Beach Forecast</span>
                </a>

                {/* Phone: the spot's name opens the sheet with every spot */}
                <span className="px-1 text-lg font-light text-zinc-700 md:hidden" aria-hidden="true">/</span>
                <button
                    ref={sheetTriggerRef}
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={sheetOpen}
                    aria-label={`Change spot, current: ${current?.name ?? "none"}`}
                    className="pressable flex h-9 min-w-0 items-center gap-2 rounded-lg pl-2 pr-2 text-[15px] font-medium text-zinc-100 active:bg-white/[0.06] md:hidden"
                >
                    <span className="truncate">{current?.name ?? "Spots"}</span>
                    <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                </button>

                {/* Tablet and up: every spot, in coast order */}
                <nav aria-label="Spots" className="hidden md:block">
                    <ul className="flex items-center gap-0.5">
                        {spots.map((spot, i) => {
                            const isCurrent = spot === current;
                            return (
                                <li key={spot.url}>
                                    <a
                                        href={spot.url}
                                        aria-current={isCurrent ? "page" : undefined}
                                        aria-keyshortcuts={String(i + 1)}
                                        title={`${spot.name} (${i + 1})`}
                                        className={`pressable relative flex h-9 items-center rounded-lg px-3 text-sm font-medium ${
                                            isCurrent ? "text-zinc-50" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                                        }`}
                                    >
                                        {isCurrent && (
                                            // Named for the cross-page view transition in index.css, which slides it to the next spot
                                            <span
                                                className="absolute inset-0 rounded-lg bg-white/[0.08] ring-1 ring-inset ring-white/[0.06]"
                                                style={{ viewTransitionName: "spot-pill" }}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span className="relative">{spot.name}</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            <SpotSheet open={sheetOpen} onClose={closeSheet} returnFocusRef={sheetTriggerRef} current={current} />
        </header>
    );
}

export default Header;
