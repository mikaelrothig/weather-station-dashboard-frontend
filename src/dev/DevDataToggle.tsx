import { getScenario, SCENARIOS } from "./fixtures";

// Dev-only switcher between data scenarios. Plain chrome on purpose: it isn't part of the design under test.
const DevDataToggle = () => {
    const current = getScenario();
    if (!current) return null;

    const go = (scenario: string | null) => {
        const url = new URL(window.location.href);
        if (scenario) url.searchParams.set("data", scenario);
        else url.searchParams.delete("data");
        window.location.href = url.toString();
    };

    return (
        <div className="fixed bottom-3 left-1/2 z-[100] flex -translate-x-1/2 gap-0.5 rounded-full bg-zinc-700 p-0.5 font-sans text-[11px] shadow-lg">
            {[...SCENARIOS, "live"].map((scenario) => (
                <button
                    key={scenario}
                    type="button"
                    onClick={() => go(scenario === "live" ? null : scenario)}
                    className={`rounded-full px-2.5 py-1 capitalize ${scenario === current ? "bg-white text-zinc-900" : "text-zinc-200"}`}
                >
                    {scenario}
                </button>
            ))}
        </div>
    );
};

export default DevDataToggle;
