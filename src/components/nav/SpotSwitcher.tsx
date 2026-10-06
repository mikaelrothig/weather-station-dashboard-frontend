import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Spot } from "../../utils/spotUtils";
import { SpotList } from "./SpotList";

interface SpotSwitcherProps {
    open: boolean;
    /** Opened from the keyboard shortcut: appear instantly, no animation */
    instant: boolean;
    onOpenChange: (open: boolean) => void;
    current?: Spot;
    recent: Spot[];
    label: ReactNode;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

// Desktop popover: anchored to its trigger, so it scales from the top-left corner it drops out of
export const SpotSwitcher = ({ open, instant, onOpenChange, current, recent, label }: SpotSwitcherProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const wasOpen = useRef(false);
    // A fresh list (empty search, first item active) every time it opens, kept mounted while it fades out
    const [session, setSession] = useState(0);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onOpenChange]);

    useEffect(() => {
        if (open) setSession((n) => n + 1);
    }, [open]);

    useEffect(() => {
        if (!open && wasOpen.current && rootRef.current?.contains(document.activeElement)) {
            triggerRef.current?.focus({ preventScroll: true });
        }
        wasOpen.current = open;
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`pressable flex h-9 items-center gap-2 rounded-lg pl-2.5 pr-2 text-sm font-medium text-zinc-100 hover:bg-white/[0.06] ${open ? "bg-white/[0.06]" : ""}`}
            >
                {label}
                <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            </button>

            <div
                role="dialog"
                aria-label="Switch spot"
                inert={!open}
                className={`card absolute left-0 top-full z-50 mt-2 flex max-h-[min(28rem,calc(100dvh-5rem))] w-80 origin-top-left flex-col p-2 shadow-2xl shadow-black/60 ${
                    instant ? "duration-0" : open ? "duration-150" : "duration-100"
                } transition-[opacity,transform,visibility] ease-out motion-reduce:transition-none ${
                    open ? "visible scale-100 opacity-100" : "invisible scale-[0.97] opacity-0"
                }`}
            >
                <SpotList key={session} current={current} recent={recent} showSearch autoFocus={open} />
                <p className="mt-1 flex items-center justify-between border-t border-white/[0.06] px-3 pt-2 text-[11px] text-zinc-500">
                    <span>
                        <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to move · <kbd className="font-sans">↵</kbd> to open
                    </span>
                    <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-sans text-zinc-400">{isMac ? "⌘" : "Ctrl"} K</kbd>
                </p>
            </div>
        </div>
    );
};
