import { CSSProperties, useId, useMemo } from "react";

interface WindStreaksProps {
    /** Degrees the wind comes from */
    direction: number;
    /** Knots; more wind means more, faster streaks */
    speed: number;
    paused: boolean;
}

// Three depths for parallax: far streaks are dim, short and slow; near ones bright, long and quick
const LAYERS = [
    { share: 0.4, opacity: [0.08, 0.14], length: [30, 60], thickness: 1.5, pace: 1.35, sway: 2 },
    { share: 0.35, opacity: [0.14, 0.24], length: [55, 100], thickness: 2, pace: 1, sway: 4 },
    { share: 0.25, opacity: [0.24, 0.38], length: [90, 160], thickness: 2.5, pace: 0.75, sway: 6 },
];

// Repeatable "random" layout, so streaks don't reshuffle on every render
const seeded = (seed: number) => {
    const x = Math.sin(seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
};
const between = ([min, max]: number[], seed: number) => min + seeded(seed) * (max - min);

/**
 * Soft white wind lines drifting across a card in the real direction, at a pace that follows the knots. It explains the wind rather
 * than decorates, so it travels at constant (linear) speed; only the sideways sway eases, like air does.
 */
export const WindStreaks = ({ direction, speed, paused }: WindStreaksProps) => {
    // useId can contain characters that break an SVG url(#…) reference, so keep it to safe ones
    const fade = `wind-fade-${useId().replace(/[^\w-]/g, "")}`;
    const streaks = useMemo(() => {
        // The rotated layer is oversized, so only about a third of these are over the card at any moment
        const count = Math.round(Math.min(24 + speed * 1.4, 64));
        // Seconds for a mid-depth streak to cross: about 10 s in a light breeze, 4 s when it's nuking
        const base = Math.min(Math.max(13 - speed * 0.33, 3.5), 11);
        let i = 0;
        return LAYERS.flatMap((layer) =>
            Array.from({ length: Math.round(count * layer.share) }, () => {
                i++;
                const duration = base * layer.pace * (0.9 + seeded(i + 80) * 0.2);
                return {
                    top: `${seeded(i + 1) * 100}%`,
                    width: between(layer.length, i + 40),
                    thickness: layer.thickness,
                    duration,
                    // Negative delays start every streak part-way across, so the card is never empty at first
                    delay: -seeded(i + 120) * duration,
                    opacity: between(layer.opacity, i + 160),
                    sway: layer.sway,
                    // A gentle S-bend, alternating which way it curls, so the lines read as air rather than rain
                    bend: (2 + seeded(i + 280) * 4) * (i % 2 ? 1 : -1),
                    swayDuration: 2.4 + seeded(i + 200) * 2.4,
                    swayDelay: -seeded(i + 240) * 4.8,
                };
            }),
        );
    }, [speed]);

    if (!Number.isFinite(direction) || speed < 1) return null;

    return (
        <div className="wind-streaks pointer-events-none absolute inset-0 overflow-hidden" data-paused={paused || undefined} aria-hidden="true">
            <svg width="0" height="0" className="absolute">
                <defs>
                    {/* Shared by every streak: each path's own box runs tail (left) to head (right) */}
                    <linearGradient id={fade} x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0" stopColor="#fff" stopOpacity="0" />
                        <stop offset="0.7" stopColor="#fff" stopOpacity="0.6" />
                        <stop offset="1" stopColor="#fff" stopOpacity="1" />
                    </linearGradient>
                </defs>
            </svg>
            {/* Oversized and rotated so the streaks cover the corners whatever the angle; +x points downwind */}
            <div className="absolute left-1/2 top-1/2 size-[170%]" style={{ transform: `translate(-50%, -50%) rotate(${direction + 90}deg)` }}>
                {streaks.map((s, i) => (
                    <div
                        key={i}
                        className="wind-streak absolute inset-x-0"
                        style={{ top: s.top, "--duration": `${s.duration}s`, "--delay": `${s.delay}s`, "--peak": s.opacity } as CSSProperties}
                    >
                        <div
                            className="wind-sway"
                            style={{ "--sway": `${s.sway}px`, "--sway-duration": `${s.swayDuration}s`, "--sway-delay": `${s.swayDelay}s` } as CSSProperties}
                        >
                            {/* A curved stroke with round caps, fading in from the tail to a soft white head */}
                            <svg
                                width={s.width}
                                height={s.thickness + Math.abs(s.bend) * 2 + 2}
                                viewBox={`0 ${-Math.abs(s.bend) - 1 - s.thickness / 2} ${s.width} ${s.thickness + Math.abs(s.bend) * 2 + 2}`}
                                className="block -translate-y-1/2 overflow-visible"
                            >
                                <path
                                    d={`M${s.thickness} 0 C${s.width * 0.35} ${-s.bend} ${s.width * 0.65} ${s.bend} ${s.width - s.thickness} 0`}
                                    fill="none"
                                    stroke={`url(#${fade})`}
                                    strokeWidth={s.thickness}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
