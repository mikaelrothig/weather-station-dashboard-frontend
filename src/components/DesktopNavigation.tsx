import { useState, useEffect } from "react";
import { Menu, Bug } from "lucide-react";

function DesktopNavigation() {
    const [expanded, setExpanded] = useState<boolean>(() => {
        const saved = localStorage.getItem("navExpanded");
        return saved !== null ? JSON.parse(saved) : true;
    });

    const toggleMenu = () => setExpanded((prev: boolean) => !prev);

    useEffect(() => {
        localStorage.setItem("navExpanded", JSON.stringify(expanded));
    }, [expanded]);

    const currentPath = window.location.pathname;

    const spots = [
        { abbr: "01", name: "Blouberg", url: "/" },
        { abbr: "02", name: "Hermanus", url: "/hermanus" },
        { abbr: "03", name: "Langebaan", url: "/langebaan" },
        { abbr: "04", name: "Misty Cliffs", url: "/misty-cliffs" },
        { abbr: "05", name: "Witsand", url: "/witsand" },
    ];

    return (
        <div
            className={`p-3 space-y-8 bg-zinc-900 rounded-md w-fit h-full overflow-x-auto no-scrollbar flex flex-col ${
                expanded ? "min-w-48 max-w-48" : "w-fit"
            }`}
        >
            <button
                onClick={toggleMenu}
                className={`flex items-center gap-x-2 px-3 py-2 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-md w-full ${
                    expanded ? "" : "justify-center"
                }`}
            >
                <Menu className="stroke-zinc-200 w-4 h-4 flex-shrink-0" />
                {expanded && <div className="flex gap-x-1 text-zinc-200">Menu</div>}
            </button>

            <div className="flex flex-col gap-0.5 flex-grow">
                {spots.map(({ abbr, name, url }, index) => {
                    const isActive = currentPath === url;
                    const isFirst = index === 0;
                    const isLast = index === spots.length - 1;

                    return (
                        <a
                            key={abbr}
                            href={url}
                            className={`flex items-center gap-x-2 px-3 py-2 h-9 text-nowrap
                                ${isActive ? "bg-zinc-200 hover:bg-zinc-300" : "bg-zinc-800 hover:bg-zinc-700"}
                                ${expanded ? "" : "justify-center"}
                                ${isFirst ? "rounded-bl-none rounded-t-md" : ""}
                                ${isLast ? "rounded-r-md rounded-tr-none rounded-b-md" : ""}`}
                        >
                            <span className={`inline ${isActive ? "text-zinc-950" : "text-zinc-200"}`}>{abbr}</span>

                            <span
                                className={`text-zinc-200 ${expanded ? "inline" : "hidden"} ${isActive ? "text-zinc-950" : "text-zinc-200"} block`}
                            >
                                {name}
                            </span>
                        </a>
                    );
                })}
            </div>

            <a
                href="mailto:mrrothig@gmail.com"
                className={`flex items-center gap-x-2 px-3 py-2 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-md w-full mt-auto ${
                    expanded ? "" : "justify-center"
                }`}
            >
                <Bug className="stroke-zinc-200 w-4 h-4" />
                {expanded && <div className="flex gap-x-1 text-zinc-200">Report a bug</div>}
            </a>
        </div>
    );
}

export default DesktopNavigation;