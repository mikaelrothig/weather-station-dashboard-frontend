import { useState, useEffect } from "react";
import { Radio, Menu, X } from "lucide-react";
import { spots } from "../utils/spotUtils";

function MobileNavigation() {
    const [open, setOpen] = useState(false);
    const currentPath = window.location.pathname;

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const activeSpot = spots.find((s) => s.url === currentPath);

    return (
        <>
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-4 md:pt-8 md:pb-0 lg:hidden md:px-8 bg-zinc-950">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600 shrink-0">
                    <Radio className="w-4 h-4 text-white" />
                </div>

                <div className="flex items-center w-full gap-3 px-3 overflow-hidden rounded-md h-9 bg-zinc-800">
                    {activeSpot ? (
                        <>
                            <span className="font-medium tabular-nums text-zinc-500 shrink-0">{activeSpot.abbr}</span>
                            <span className="text-sm font-medium truncate text-zinc-200">{activeSpot.name}</span>
                        </>
                    ) : (
                        <span className="text-zinc-500">Select a spot</span>
                    )}
                </div>

                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open spot menu"
                    className="flex items-center justify-center transition-colors rounded-md w-9 h-9 bg-zinc-800 hover:bg-zinc-700 shrink-0"
                >
                    <Menu className="w-4 h-4 text-zinc-200" />
                </button>
            </div>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[60] bg-black/60 lg:hidden transition-opacity duration-300 ${
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* Bottom sheet */}
            <div
                className={`fixed inset-x-0 bottom-0 z-[70] flex flex-col bg-zinc-900 rounded-t-xl shadow-2xl lg:hidden transition-transform duration-300 ease-out max-h-[85vh] ${
                    open ? "translate-y-0" : "translate-y-full"
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="Select a spot"
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-8 h-1 rounded-full bg-zinc-700" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600">
                            <Radio className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-zinc-200">Kite Beach Forecast</span>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                        className="flex items-center justify-center w-8 h-8 transition-colors rounded-md bg-zinc-800 hover:bg-zinc-700"
                    >
                        <X className="w-4 h-4 text-zinc-200" />
                    </button>
                </div>

                {/* Spot list */}
                <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-0.5 no-scrollbar">
                    {spots.map(({ abbr, name, url }) => {
                        const isActive = currentPath === url;
                        return (
                            <a
                                key={abbr}
                                href={url}
                                aria-current={isActive ? "page" : undefined}
                                onClick={() => setOpen(false)}
                                className={`group flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                                    isActive
                                        ? "text-zinc-100 bg-zinc-800"
                                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                }`}
                            >
                                <span className={`font-medium tabular-nums flex-shrink-0 text-sm ${
                                    isActive ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-500"
                                }`}>
                                    {abbr}
                                </span>
                                <span className="flex-1 text-sm truncate">{name}</span>
                            </a>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default MobileNavigation;
