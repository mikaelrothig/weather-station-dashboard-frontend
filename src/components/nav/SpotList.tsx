import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { countries, groupSpotsByCountry, searchSpots, Spot } from "../../utils/spotUtils";

interface SpotListProps {
    current?: Spot;
    recent: Spot[];
    showSearch: boolean;
    autoFocus?: boolean;
    /** Larger rows and a 16px input for touch; compact for the desktop popover */
    touch?: boolean;
}

interface Section {
    key: string;
    title: string;
    spots: Spot[];
}

const MAX_RECENT = 3;

export const SpotList = ({ current, recent, showSearch, autoFocus = false, touch = false }: SpotListProps) => {
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus({ preventScroll: true });
    }, [autoFocus]);

    const results = searchSpots(query);
    const sections: Section[] = [];

    // Recents only earn their place once spots span more than one country
    if (!query && countries.length > 1 && recent.length > 0) {
        sections.push({ key: "recent", title: "Recent", spots: recent.slice(0, MAX_RECENT) });
    }
    for (const group of groupSpotsByCountry(results, current?.country)) {
        sections.push({ key: group.country.code, title: group.country.name, spots: group.spots });
    }

    const items = sections.flatMap((section) => section.spots.map((spot) => ({ section: section.key, spot })));
    const active = Math.min(activeIndex, Math.max(items.length - 1, 0));
    const optionId = (i: number) => `${listId}-option-${i}`;

    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }, [active]);

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((active + 1) % items.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((active - 1 + items.length) % items.length);
        } else if (e.key === "Enter" && items[active]) {
            e.preventDefault();
            window.location.href = items[active].spot.url;
        }
    };

    let index = -1;

    return (
        <div className="flex min-h-0 flex-col">
            {showSearch && (
                <label className="relative mb-2 block shrink-0">
                    <span className="sr-only">Search spots</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="search"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={listId}
                        aria-activedescendant={items.length ? optionId(active) : undefined}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="go"
                        placeholder="Search spots or countries"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        onKeyDown={onKeyDown}
                        className={`w-full rounded-lg bg-white/[0.06] pl-9 pr-3 text-zinc-100 placeholder:text-zinc-500 focus:bg-white/[0.08] focus:outline-none ${
                            touch ? "h-11 text-base" : "h-9 text-sm"
                        }`}
                    />
                </label>
            )}

            <div ref={listRef} id={listId} role="listbox" aria-label="Spots" className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain">
                {items.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-zinc-500">No spots match “{query}”</p>
                )}

                {sections.map((section) => (
                    <div key={section.key} role="group" aria-label={section.title} className="pb-1">
                        <p className={`eyebrow px-3 pb-1.5 ${touch ? "pt-3" : "pt-2"}`} aria-hidden="true">{section.title}</p>
                        {section.spots.map((spot) => {
                            index += 1;
                            const i = index;
                            const isCurrent = spot.url === current?.url;
                            const isActive = showSearch && i === active;

                            return (
                                <a
                                    key={`${section.key}-${spot.url}`}
                                    id={optionId(i)}
                                    data-index={i}
                                    role="option"
                                    aria-selected={isActive}
                                    aria-current={isCurrent ? "page" : undefined}
                                    href={spot.url}
                                    onMouseMove={() => setActiveIndex(i)}
                                    className={`pressable flex items-center gap-3 rounded-lg px-3 ${touch ? "h-14" : "h-11"} ${
                                        isActive ? "bg-white/[0.07]" : "active:bg-white/[0.06]"
                                    }`}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className={`block truncate font-medium ${touch ? "text-[15px]" : "text-sm"} ${isCurrent ? "text-zinc-50" : "text-zinc-200"}`}>
                                            {spot.name}
                                        </span>
                                        <span className="block truncate text-xs text-zinc-500">{spot.region}</span>
                                    </span>
                                    {isCurrent && <Check className="size-4 shrink-0 text-rose-400" aria-label="Current spot" />}
                                </a>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
