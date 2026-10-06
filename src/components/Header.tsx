import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { getCountry, getCurrentSpot } from "../utils/spotUtils";
import { useRecentSpots } from "../hooks/useRecentSpots";
import SpotSheet from "./SpotSheet";
import { SpotSwitcher } from "./nav/SpotSwitcher";
import { Logo } from "./ui/Logo";

function Header() {
    const current = getCurrentSpot();
    const recent = useRecentSpots(current);
    const country = current ? getCountry(current.country) : undefined;

    const [sheetOpen, setSheetOpen] = useState(false);
    const [switcher, setSwitcher] = useState({ open: false, instant: false });
    const sheetTriggerRef = useRef<HTMLButtonElement>(null);

    const setSwitcherOpen = useCallback((open: boolean) => setSwitcher({ open, instant: false }), []);
    const closeSheet = useCallback(() => setSheetOpen(false), []);

    // ⌘K / Ctrl+K opens the switcher; keyboard-opened UI appears instantly
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
            e.preventDefault();
            if (window.matchMedia("(min-width: 768px)").matches) {
                setSwitcher((s) => ({ open: !s.open, instant: true }));
            } else {
                setSheetOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);


    const countryBadge = country && (
        <span className="rounded bg-white/[0.08] px-1 py-px font-mono text-[10px] font-medium text-zinc-400">{country.code}</span>
    );

    return (
        <header className="glass-chrome sticky top-0 z-40 border-b border-white/[0.06] bg-canvas/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-1.5 px-4 md:px-6 lg:px-8">
                <a href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="Kite Beach Forecast home">
                    <Logo />
                    <span className="hidden text-sm font-semibold tracking-tight text-zinc-100 xl:block">Kite Beach Forecast</span>
                </a>

                <span className="px-1 text-lg font-light text-zinc-700" aria-hidden="true">/</span>

                {/* Phone: the sheet holds every spot */}
                <button
                    ref={sheetTriggerRef}
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={sheetOpen}
                    aria-label={`Change spot, current: ${current?.name ?? "none"}`}
                    className="pressable flex h-9 min-w-0 items-center gap-2 rounded-lg pl-2 pr-2 text-[15px] font-medium text-zinc-100 active:bg-white/[0.06] md:hidden"
                >
                    {countryBadge}
                    <span className="truncate">{current?.name ?? "Select a spot"}</span>
                    <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                </button>

                {/* Desktop: one switcher for every spot, the same on every page whatever the country */}
                <div className="hidden md:block">
                    <SpotSwitcher
                        open={switcher.open}
                        instant={switcher.instant}
                        onOpenChange={setSwitcherOpen}
                        current={current}
                        recent={recent}
                        label={
                            <>
                                {countryBadge}
                                {current?.name ?? "Select a spot"}
                            </>
                        }
                    />
                </div>

            </div>

            <SpotSheet open={sheetOpen} onClose={closeSheet} returnFocusRef={sheetTriggerRef} current={current} recent={recent} />
        </header>
    );
}

export default Header;
