import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, Mail, Linkedin, Github, Instagram, Radio } from "lucide-react";

const socialLinks = [
    { href: "mailto:mrrothig@gmail.com", icon: Mail, label: "Email" },
    { href: "https://www.linkedin.com/in/mikael-r%C3%B6thig-104227185", icon: Linkedin, label: "LinkedIn" },
    { href: "https://github.com/MikaelRothig", icon: Github, label: "GitHub" },
    { href: "https://www.instagram.com/mikaelrothig/", icon: Instagram, label: "Instagram" },
];
import { spots } from "../utils/spotUtils";

function DesktopNavigation() {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        const saved = localStorage.getItem("navExpanded");
        return saved !== null ? !JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem("navExpanded", JSON.stringify(!collapsed));
    }, [collapsed]);

    const currentPath = window.location.pathname;

    return (
        <nav
            aria-label="Spot navigation"
            className={`flex flex-col h-full overflow-hidden ${
                collapsed ? "w-10" : "w-40"
            }`}
        >
            {/* Toggle + logo row */}
            <div className={`flex items-center gap-2 shrink-0 ${collapsed ? "justify-center" : ""}`}>
                {collapsed ? (
                    <button
                        type="button"
                        onClick={() => setCollapsed(false)}
                        aria-label="Open sidebar"
                        aria-expanded={false}
                        className="flex-shrink-0 transition-colors rounded-md group hover:bg-zinc-800"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600">
                            <Radio className="w-4 h-4 text-white group-hover:hidden" />
                            <PanelLeftOpen className="hidden w-3.5 h-3.5 text-white group-hover:block" />
                        </div>
                    </button>
                ) : (
                    <>
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-rose-600">
                            <Radio className="w-4 h-4 text-white" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setCollapsed(true)}
                            aria-label="Close sidebar"
                            aria-expanded={true}
                            className="ml-auto flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            {/* Spot links */}
            <div className={`flex flex-col flex-grow pt-6 overflow-y-auto gap-y-0.5 no-scrollbar ${
                    collapsed ? "items-center" : ""
                }`}
            >
                {spots.map(({ abbr, name, url }) => {
                    const isActive = currentPath === url;
                    return (
                        <a
                            key={abbr}
                            href={url}
                            aria-current={isActive ? "page" : undefined}
                            title={collapsed ? name : undefined}
                            className={`group flex items-center rounded-md py-2 text-sm font-medium h-9 ${
                                collapsed ? "justify-center px-1 w-9" : "gap-3 px-3"
                            } ${
                                isActive
                                    ? "text-zinc-100 bg-zinc-800"
                                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                            }`}
                        >
                            <span className={`font-medium tabular-nums flex-shrink-0 text-xs ${
                                isActive ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-500"
                            }`}>
                                {abbr}
                            </span>
                            {!collapsed && <span className="flex-1 text-sm truncate">{name}</span>}
                        </a>
                    );
                })}
            </div>

            {/* Social links */}
            <div className={`mt-4 shrink-0 flex gap-1 ${collapsed ? "flex-col items-center" : "flex-row px-1.5"}`}>
                {socialLinks.map(({ href, icon: Icon, label }) => (
                    <a
                        key={label}
                        href={href}
                        target={href.startsWith("mailto:") ? undefined : "_blank"}
                        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                        title={label}
                        className="flex items-center justify-center p-1.5 rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
                    >
                        <Icon className="w-4 h-4" />
                    </a>
                ))}
            </div>
        </nav>
    );
}

export default DesktopNavigation;
