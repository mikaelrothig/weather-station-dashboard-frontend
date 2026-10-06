import { ReactNode } from "react";

interface SegmentedOption<T extends string> {
    value: T;
    label: ReactNode;
    ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
    label: string;
    value: T;
    options: SegmentedOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange, className = "" }: SegmentedControlProps<T>) {
    const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={`relative grid h-9 shrink-0 auto-cols-fr grid-flow-col rounded-lg bg-white/[0.06] p-1 ${className}`}
        >
            <div
                aria-hidden="true"
                className="absolute inset-y-1 left-1 rounded-md bg-white/10 shadow-sm shadow-black/40 transition-transform duration-200 ease-out motion-reduce:transition-none"
                style={{
                    width: `calc((100% - 0.5rem) / ${options.length})`,
                    transform: `translateX(${activeIndex * 100}%)`,
                }}
            />
            {options.map((option) => {
                const checked = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        aria-label={option.ariaLabel}
                        onClick={() => onChange(option.value)}
                        className={`pressable relative z-10 flex min-w-10 items-center justify-center rounded-md px-2.5 text-xs font-medium ${
                            checked ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
