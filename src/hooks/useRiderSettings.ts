import { useSyncExternalStore } from "react";
import { EXPERIENCE_PROFILES, Experience, OWNABLE_KITE_SIZES } from "../utils/kiteUtils";

const WEIGHT_KEY = "kite-rider-weight";
const EXPERIENCE_KEY = "kite-rider-experience";
const KITES_KEY = "kite-rider-kites";
export const MIN_WEIGHT = 40;
export const MAX_WEIGHT = 120;

interface RiderSettings {
    weight: number;
    experience: Experience;
    /** Kite sizes the rider owns, smallest first; empty until they set it */
    kites: number[];
}

const readKites = (): number[] => {
    const parsed = JSON.parse(localStorage.getItem(KITES_KEY) ?? "[]");
    return Array.isArray(parsed)
        ? parsed.filter((size): size is number => OWNABLE_KITE_SIZES.includes(size)).sort((a, b) => a - b)
        : [];
};

const read = (): RiderSettings => {
    try {
        const weight = Number(localStorage.getItem(WEIGHT_KEY));
        const experience = localStorage.getItem(EXPERIENCE_KEY);
        return {
            weight: weight >= MIN_WEIGHT && weight <= MAX_WEIGHT ? weight : 80,
            experience: experience && experience in EXPERIENCE_PROFILES ? (experience as Experience) : "advanced",
            kites: readKites(),
        };
    } catch {
        return { weight: 80, experience: "advanced", kites: [] };
    }
};

// One shared copy so every card that suggests a kite agrees with the others
let settings = read();
const listeners = new Set<() => void>();

const update = (patch: Partial<RiderSettings>) => {
    settings = { ...settings, ...patch };
    try {
        // Only explicit changes are saved, so defaults can evolve for people who never touched them
        if (patch.weight !== undefined) localStorage.setItem(WEIGHT_KEY, String(settings.weight));
        if (patch.experience !== undefined) localStorage.setItem(EXPERIENCE_KEY, settings.experience);
        if (patch.kites !== undefined) localStorage.setItem(KITES_KEY, JSON.stringify(settings.kites));
    } catch {
        // Storage unavailable; the settings still apply for this visit
    }
    listeners.forEach((listener) => listener());
};

export const useRiderSettings = () => {
    const current = useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => settings,
    );

    return {
        ...current,
        profile: EXPERIENCE_PROFILES[current.experience],
        setWeight: (weight: number) => update({ weight: Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weight)) }),
        setExperience: (experience: Experience) => update({ experience }),
        toggleKite: (size: number) =>
            update({
                kites: settings.kites.includes(size)
                    ? settings.kites.filter((s) => s !== size)
                    : [...settings.kites, size].sort((a, b) => a - b),
            }),
    };
};
