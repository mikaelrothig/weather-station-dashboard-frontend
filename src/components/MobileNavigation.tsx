function MobileNavigation() {
    const currentPath = window.location.pathname;

    const spots = [
        { abbr: "01", name: "Blouberg", url: "/" },
        { abbr: "02", name: "Langebaan", url: "/langebaan" },
        { abbr: "03", name: "Witsand", url: "/witsand" },
        { abbr: "04", name: "Misty Cliffs", url: "/misty-cliffs" },
    ];

    return (
        <div className="sticky top-0 z-50 lg:hidden bg-zinc-950 shadow-md px-4 md:px-8 py-4">
            <div className="grid grid-cols-4 gap-3">
                {spots.map(({ name, url }) => {
                    const isActive = currentPath === url;
                    return (
                        <a
                            key={url}
                            href={url}
                            className={`flex justify-center items-center h-9 rounded-md px-3 py-2 text-sm font-medium text-nowrap text-zinc-200 transition-colors ${isActive ? "bg-rose-600" : "bg-zinc-800"}`}
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