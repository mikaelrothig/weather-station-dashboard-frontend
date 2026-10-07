import { ArrowUp, ArrowUpRight, Github, Instagram, Linkedin, Mail, Tag } from "lucide-react";
import { getCurrentSpot, spots } from "../utils/spotUtils";
import { getWindBackgroundColor, WIND_SCALE } from "../utils/ColorUtils";
import { Logo } from "./ui/Logo";

const socialLinks = [
    { href: "mailto:mrrothig@gmail.com", icon: Mail, label: "Email" },
    { href: "https://www.linkedin.com/in/mikael-r%C3%B6thig-104227185", icon: Linkedin, label: "LinkedIn" },
    { href: "https://github.com/MikaelRothig", icon: Github, label: "GitHub" },
    { href: "https://www.instagram.com/mikaelrothig/", icon: Instagram, label: "Instagram" },
];

const sourceLinks = [
    { href: "https://www.windguru.cz/", label: "Windguru", note: "Forecasts" },
    { href: "https://mac-wind.appspot.com/", label: "MAC Wind", note: "Live station" },
    { href: "https://github.com/mikaelrothig/weather-station-dashboard-frontend", label: "Frontend", note: "Source on GitHub" },
    { href: "https://github.com/mikaelrothig/weather-station-dashboard-backend", label: "Backend", note: "Source on GitHub" },
];

const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
};

function Footer() {
    const current = getCurrentSpot();

    return (
        <footer className="mx-auto w-full max-w-[1440px] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6 md:px-6 md:pt-10 lg:px-8">
            <div className="card overflow-hidden">
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 p-5 md:grid-cols-4 md:p-6 lg:grid-cols-[2fr_1fr_1fr_1.5fr]">
                    <div className="col-span-2 flex flex-col gap-4 md:col-span-4 lg:col-span-1">
                        <div className="flex items-center gap-2.5">
                            <Logo />
                            <span className="text-sm font-semibold tracking-tight text-zinc-100">Kite Beach Forecast</span>
                        </div>
                        <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                            Live wind and model forecasts for kite spots in the Western Cape, South Africa.
                        </p>
                        <ul className="-ml-2 flex items-center gap-1">
                            {socialLinks.map(({ href, icon: Icon, label }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target={href.startsWith("mailto:") ? undefined : "_blank"}
                                        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                                        aria-label={label}
                                        className="pressable flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
                                    >
                                        <Icon className="size-4" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <nav aria-labelledby="footer-spots">
                        <h2 id="footer-spots" className="eyebrow mb-3">Spots</h2>
                        <ul className="flex flex-col gap-0.5">
                            {spots.map((spot) => (
                                <li key={spot.url}>
                                    <a
                                        href={spot.url}
                                        aria-current={spot === current ? "page" : undefined}
                                        className="flex h-8 items-center text-sm text-zinc-400 transition-colors hover:text-zinc-100 aria-[current=page]:text-zinc-100"
                                    >
                                        {spot.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <h2 className="eyebrow mb-3">Data</h2>
                        <ul className="flex flex-col gap-0.5">
                            {sourceLinks.map(({ href, label, note }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex min-h-8 flex-col justify-center py-1 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                                    >
                                        <span className="flex items-center gap-1">
                                            {label}
                                            <ArrowUpRight className="size-3.5 text-zinc-600 transition-transform duration-150 ease-out group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-zinc-400" aria-hidden="true" />
                                        </span>
                                        <span className="text-xs text-zinc-500">{note}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                        <h2 className="eyebrow mb-3">Wind scale</h2>
                        <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-0.5" role="img" aria-label="Wind colour scale from 0 to over 42 knots">
                            {WIND_SCALE.map((knots) => (
                                <div key={knots} className={`h-5 rounded-[3px] first:rounded-l-md last:rounded-r-md ${getWindBackgroundColor(knots)}`} />
                            ))}
                        </div>
                        <div className="mt-1.5 grid grid-cols-[repeat(15,minmax(0,1fr))] font-mono text-[11px] tabular-nums text-zinc-500" aria-hidden="true">
                            {WIND_SCALE.map((knots, i) =>
                                i % 4 === 0 ? <span key={knots} style={{ gridColumnStart: i + 1 }}>{knots}</span> : null,
                            )}
                            <span className="justify-self-end whitespace-nowrap" style={{ gridColumnStart: WIND_SCALE.length }}>kn</span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                            Forecast cells use this scale for speed, gusts and temperature.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                    <p className="text-xs leading-relaxed text-zinc-500">
                        © {new Date().getFullYear()} Mikael Röthig · Personal project, not for official use.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 font-mono text-[11px] text-zinc-400">
                            <Tag className="size-3" aria-hidden="true" />
                            v4.0
                        </span>
                        <button
                            type="button"
                            onClick={scrollToTop}
                            className="pressable flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                        >
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                            Back to top
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
