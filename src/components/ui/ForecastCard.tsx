import { CSSProperties, ReactNode } from "react";

interface ForecastCardProps {
    title: ReactNode;
    subtitle?: ReactNode;
    live?: boolean;
    actions?: ReactNode;
    index: number;
    children: ReactNode;
}

export const ForecastCard = ({ title, subtitle, live = false, actions, index, children }: ForecastCardProps) => (
    <section className="card animate-enter overflow-hidden" style={{ "--i": index } as CSSProperties}>
        <header className="flex flex-wrap items-center gap-3 px-4 pb-3 pt-4 md:px-5">
            <div className="mr-auto min-w-0">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    {title}
                    {live && <span className="live-dot" aria-label="Live" />}
                </h2>
                {subtitle && <div className="mt-0.5 text-xs text-zinc-500">{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <div className="pb-4">{children}</div>
    </section>
);

interface ForecastStateProps {
    rows: number;
}

export const ForecastSkeleton = ({ rows }: ForecastStateProps) => (
    <div className="px-4 md:px-5" aria-busy="true">
        <div className="animate-pulse rounded-lg bg-white/[0.04]" style={{ height: (rows + 2) * 30 }} />
    </div>
);

export const ForecastMessage = ({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) => (
    <p className={`px-4 py-8 text-sm md:px-5 ${tone === "error" ? "text-zinc-400" : "text-zinc-500"}`}>{children}</p>
);
