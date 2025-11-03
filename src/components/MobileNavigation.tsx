function MobileNavigation() {
    const currentPath = window.location.pathname;

    const spots = [
        { abbr: "01", name: "Blouberg", url: "/" },
        { abbr: "02", name: "Langebaan", url: "/langebaan" },
        { abbr: "03", name: "Witsand", url: "/witsand" },
        { abbr: "04", name: "Misty Cliffs", url: "/misty-cliffs" },
    ];

    const maskLayers = [
        "linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0) 37.5%)",
        "linear-gradient(rgba(0, 0, 0, 0) 12.5%, rgb(0, 0, 0) 25%, rgb(0, 0, 0) 37.5%, rgba(0, 0, 0, 0) 50%)",
        "linear-gradient(rgba(0, 0, 0, 0) 25%, rgb(0, 0, 0) 37.5%, rgb(0, 0, 0) 50%, rgba(0, 0, 0, 0) 62.5%)",
        "linear-gradient(rgba(0, 0, 0, 0) 37.5%, rgb(0, 0, 0) 50%, rgb(0, 0, 0) 62.5%, rgba(0, 0, 0, 0) 75%)",
        "linear-gradient(rgba(0, 0, 0, 0) 50%, rgb(0, 0, 0) 62.5%, rgb(0, 0, 0) 75%, rgba(0, 0, 0, 0) 87.5%)",
        "linear-gradient(rgba(0, 0, 0, 0) 62.5%, rgb(0, 0, 0) 75%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%)",
        "linear-gradient(rgba(0, 0, 0, 0) 75%, rgb(0, 0, 0) 87.5%, rgb(0, 0, 0) 100%)",
        "linear-gradient(rgba(0, 0, 0, 0) 87.5%, rgb(0, 0, 0) 100%)",
    ];

    const blurValues = [
        "0.078125px",
        "0.15625px",
        "0.3125px",
        "0.625px",
        "1.25px",
        "2.5px",
        "5px",
        "10px",
    ];

    const topMaskLayers = maskLayers.map(m => m.replace("linear-gradient(", "linear-gradient(to top,"));

    return (
        <header className="sticky inset-0 z-50 lg:hidden">
            <div className="absolute z-20 pointer-events-none">
                <div className="flex justify-center p-4 items-center gap-0.5 w-screen h-screen">
                    <div className="flex gap-1.5 p-2 mb-auto rounded-md h-fit pointer-events-auto bg-zinc-900 backdrop-blur shadow">
                        {spots.map(({ abbr, name, url }) => {
                            const isActive = currentPath === url;
                            return (
                                <a
                                    key={abbr}
                                    href={url}
                                    className={`flex items-center gap-x-2 px-3 py-2 h-9 rounded-md whitespace-nowrap
                                        ${isActive ? "bg-rose-600 hover:bg-rose-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
                                >
                                    <span className="text-zinc-200 block">{isActive ? name : abbr}</span>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex lg:hidden fixed top-0 left-0 right-0 pointer-events-none">
                <div className="flex">
                    <div className="relative w-screen h-[200px] rounded-none">
                        {topMaskLayers.map((mask, index) => (
                            <div
                                key={index}
                                className="absolute inset-0 z-10 rounded-none pointer-events-none"
                                style={{
                                    backdropFilter: `blur(${blurValues[index]})`,
                                    WebkitBackdropFilter: `blur(${blurValues[index]})`,
                                    maskImage: mask,
                                    WebkitMaskImage: mask,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default MobileNavigation;