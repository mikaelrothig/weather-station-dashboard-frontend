function MobileNavigation() {
    const currentPath = window.location.pathname;

    const spots = [
        { abbr: "01", name: "Blouberg", url: "/" },
        { abbr: "02", name: "Hermanus", url: "/hermanus" },
        { abbr: "03", name: "Langebaan", url: "/langebaan" },
        { abbr: "04", name: "Misty Cliffs", url: "/misty-cliffs" },
        { abbr: "05", name: "Witsand", url: "/witsand" },
    ];

    return (
        <div className="sticky top-0 z-50 lg:hidden bg-zinc-950 shadow-md px-4 md:px-8 py-4">
            <div className="flex gap-2 sm:justify-center overflow-x-scroll no-scrollbar">
                {spots.map(({ name, url }) => {
                    const isActive = currentPath === url;
                    return (
                        <a
                            key={url}
                            href={url}
                            className={`flex justify-center items-center h-9 rounded-md px-3 py-2 min-w-28 text-sm font-medium text-nowrap transition-colors ${isActive ? "bg-zinc-200 text-zinc-950" : "bg-zinc-800 text-zinc-200"}`}
                        >
                            {name}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

export default MobileNavigation;