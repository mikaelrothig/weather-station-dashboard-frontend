import { useState, useEffect } from "react";
import { LayoutGrid, Bug } from "lucide-react";

function Navigation() {
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
        { abbr: "02", name: "Langebaan", url: "/langebaan" },
        { abbr: "03", name: "Witsand", url: "/witsand" },
        { abbr: "04", name: "Misty Cliffs", url: "/misty-cliffs" },
    ];

    return (
        <div
            className={`p-3 lg:space-y-8 bg-zinc-900 rounded-md w-full lg:w-fit lg:h-full overflow-x-auto no-scrollbar flex flex-col ${
                expanded ? "lg:min-w-48 lg:max-w-48" : "w-fit"
            }`}
        >
            <button
                onClick={toggleMenu}
                className={`hidden lg:flex items-center gap-x-2 px-3 py-2 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-md w-full ${
                    expanded ? "" : "justify-center"
                }`}
            >
                <LayoutGrid className="stroke-zinc-200 w-4 h-4 flex-shrink-0" />
                {expanded && <div className="flex gap-x-1 text-zinc-200">Menu</div>}
            </button>

            <div className="grid grid-cols-4 lg:flex lg:flex-col gap-0.5 flex-grow">
                {spots.map(({ abbr, name, url }, index) => {
                    const isActive = currentPath === url;
                    const isFirst = index === 0;
                    const isLast = index === spots.length - 1;

                    return (
                        <a
                            key={abbr}
                            href={url}
                            className={`flex items-center gap-x-2 px-3 py-2 h-9 text-nowrap
                                ${isActive ? "bg-rose-600 hover:bg-rose-500" : "bg-zinc-800 hover:bg-zinc-700"}
                                ${expanded ? "" : "justify-center"}
                                ${isFirst ? "rounded-l-md lg:rounded-bl-none lg:rounded-t-md" : ""}
                                ${isLast ? "rounded-r-md lg:rounded-tr-none lg:rounded-b-md" : ""}`}
                        >
                            <span className="hidden lg:inline text-zinc-200">{abbr}</span>

                            <span
                                className={`text-zinc-200 ${
                                    expanded ? "lg:inline" : "lg:hidden"
                                } block lg:block`}
                            >
                                {name}
                            </span>
                        </a>
                    );
                })}
            </div>

            <a
                href="mailto:mrrothig@gmail.com"
                className={`hidden lg:flex items-center gap-x-2 px-3 py-2 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-md w-full mt-auto ${
                    expanded ? "" : "justify-center"
                }`}
            >
                <Bug className="stroke-zinc-200 w-4 h-4" />
                {expanded && <div className="flex gap-x-1 text-zinc-200">Report a bug</div>}
            </a>
        </div>
    );
}

export default Navigation;