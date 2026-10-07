import { RefObject, useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { describeKites, EXPERIENCE_PROFILES, Experience, OWNABLE_KITE_SIZES } from "../utils/kiteUtils.ts";
import { MAX_WEIGHT, MIN_WEIGHT, useRiderSettings } from "../hooks/useRiderSettings.ts";
import { useMediaQuery } from "../hooks/useMediaQuery.ts";
import { SegmentedControl } from "./ui/SegmentedControl.tsx";
import { BottomSheet } from "./ui/BottomSheet.tsx";

interface RiderSettingsButtonProps {
    open: boolean;
    onToggle: () => void;
    /** id of the panel it opens */
    controls: string;
    buttonRef?: RefObject<HTMLButtonElement | null>;
    className?: string;
}

/** Shows the current settings at a glance ("Advanced · 80 kg · 9, 12 m²") and opens the panel to change them */
const RiderSettingsButton = ({ open, onToggle, controls, buttonRef, className = "" }: RiderSettingsButtonProps) => {
    const { weight, kites, profile } = useRiderSettings();

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={controls}
            className={`pressable flex h-9 min-w-0 items-center gap-2 rounded-lg px-3 text-xs font-medium text-zinc-200 hover:bg-white/10 ${
                open ? "bg-white/10" : "bg-white/[0.06]"
            } ${className}`}
        >
            <SlidersHorizontal className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
            <span className="truncate">{profile.label} · {weight} kg · {describeKites(kites)}</span>
            <ChevronDown
                className={`size-3.5 shrink-0 text-zinc-500 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
            />
        </button>
    );
};

// Saved on the device and shared by every spot, so it only needs setting up once
interface RiderSettingsPanelProps {
    id: string;
    onDone: () => void;
    /** Bigger tap targets, for the phone sheet */
    touch?: boolean;
}

const RiderSettingsPanel = ({ id, onDone, touch = false }: RiderSettingsPanelProps) => {
    const { weight, experience, kites, setWeight, setExperience, toggleKite } = useRiderSettings();
    const stepper = touch ? "size-11" : "size-9";

    return (
        <div id={id} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="text-xs font-medium text-zinc-400">Experience</span>
                <SegmentedControl
                    label="Rider experience"
                    value={experience}
                    onChange={setExperience}
                    options={(Object.keys(EXPERIENCE_PROFILES) as Experience[]).map((level) => ({
                        value: level,
                        label: EXPERIENCE_PROFILES[level].label,
                    }))}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="text-xs font-medium text-zinc-400">Weight</span>
                <div className={`flex items-center rounded-lg bg-white/[0.06] ${touch ? "h-11" : "h-9"}`} role="group" aria-label="Rider weight">
                    <button
                        type="button"
                        onClick={() => setWeight(weight - 5)}
                        disabled={weight <= MIN_WEIGHT}
                        aria-label="Decrease rider weight"
                        className={`pressable grid ${stepper} place-items-center rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-40`}
                    >
                        <Minus className="size-3.5" />
                    </button>
                    <span className="w-14 text-center text-xs font-medium tabular-nums text-zinc-200" aria-live="polite">{weight} kg</span>
                    <button
                        type="button"
                        onClick={() => setWeight(weight + 5)}
                        disabled={weight >= MAX_WEIGHT}
                        aria-label="Increase rider weight"
                        className={`pressable grid ${stepper} place-items-center rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-40`}
                    >
                        <Plus className="size-3.5" />
                    </button>
                </div>
            </div>

            <fieldset>
                <legend className="text-xs font-medium text-zinc-400">Your kites</legend>
                <p className="mt-0.5 text-[11px] text-zinc-500">Select every size you own, in m².</p>
                <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                    {OWNABLE_KITE_SIZES.map((size) => {
                        const owned = kites.includes(size);
                        return (
                            <button
                                key={size}
                                type="button"
                                aria-pressed={owned}
                                aria-label={`${size} square metre kite`}
                                onClick={() => toggleKite(size)}
                                className={`pressable rounded-lg text-sm font-semibold tabular-nums ring-1 ring-inset ${touch ? "h-11" : "h-10"} ${
                                    owned
                                        ? "bg-rose-500/15 text-rose-200 ring-rose-500/40"
                                        : "bg-white/[0.04] text-zinc-400 ring-transparent hover:bg-white/[0.08] hover:text-zinc-200"
                                }`}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                <p className="text-[11px] text-zinc-500">Saved on this device and used for every spot.</p>
                <button
                    type="button"
                    onClick={onDone}
                    className="pressable h-8 rounded-lg bg-white/10 px-3 text-xs font-medium text-zinc-100 hover:bg-white/[0.14]"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

const DESCRIPTION = "Used for the kite windows and kite sizes at every spot.";

/**
 * Rider settings, the same on the home page and in the spot page's Kite windows card.
 * Desktop: a popover anchored to its button, scaling out of the corner it drops from. No backdrop, so the cards
 * behind stay visible and update as the settings change. Phones: a bottom sheet with bigger tap targets.
 * The same split as the spot switcher in the header.
 */
interface RiderSettingsMenuProps {
    /** Pass both to open it from elsewhere too, like the Kite windows card's "Add kites" prompt */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const RiderSettingsMenu = ({ open: controlledOpen, onOpenChange }: RiderSettingsMenuProps = {}) => {
    const [ownOpen, setOwnOpen] = useState(false);
    const open = controlledOpen ?? ownOpen;
    const setOpen = useCallback((next: boolean) => (onOpenChange ?? setOwnOpen)(next), [onOpenChange]);
    const desktop = useMediaQuery("(min-width: 768px)");
    const id = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const wasOpen = useRef(false);
    const close = useCallback(() => setOpen(false), [setOpen]);

    // Popover: a press outside it or Escape closes it
    useEffect(() => {
        if (!open || !desktop) return;
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) close();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, desktop, close]);

    // Popover focus: into it on open, back to the button on close if it was inside (the sheet does its own)
    useEffect(() => {
        if (desktop) {
            if (open) popoverRef.current?.focus({ preventScroll: true });
            else if (wasOpen.current && rootRef.current?.contains(document.activeElement)) triggerRef.current?.focus({ preventScroll: true });
        }
        wasOpen.current = open;
    }, [open, desktop]);

    return (
        <div ref={rootRef} className="relative">
            <RiderSettingsButton open={open} onToggle={() => setOpen(!open)} controls={id} buttonRef={triggerRef} />

            {desktop ? (
                // Enters in 150 ms and leaves in 100 ms: exits are faster than entrances
                <div
                    ref={popoverRef}
                    role="dialog"
                    aria-label="Rider settings"
                    tabIndex={-1}
                    inert={!open}
                    // Visibility switches on instantly when opening (a hidden element can't take focus, even for the first
                    // frame of a transition) and only waits out the fade when closing
                    className={`card absolute right-0 top-full z-50 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] origin-top-right p-4 shadow-2xl shadow-black/60 outline-none ease-out motion-reduce:transition-none ${
                        open
                            ? "visible scale-100 opacity-100 transition-[opacity,transform] duration-150"
                            : "invisible scale-[0.97] opacity-0 transition-[opacity,transform,visibility] duration-100"
                    }`}
                >
                    <p className="text-sm font-semibold text-zinc-100">Rider settings</p>
                    <p className="mb-4 mt-0.5 text-xs text-zinc-500">{DESCRIPTION}</p>
                    <RiderSettingsPanel id={id} onDone={close} />
                </div>
            ) : (
                <BottomSheet open={open} onClose={close} returnFocusRef={triggerRef} title="Rider settings">
                    <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-1">
                        <p className="mb-4 text-xs text-zinc-500">{DESCRIPTION}</p>
                        <RiderSettingsPanel id={id} onDone={close} touch />
                    </div>
                </BottomSheet>
            )}
        </div>
    );
};
