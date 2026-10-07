import { ReactNode } from "react";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";

interface PageShellProps {
    children: ReactNode;
    /** Rendered after the footer, outside the page flow: dialogs and dev tools */
    after?: ReactNode;
}

/**
 * Every page's frame: the header, the main column and the footer. The spacing lives here once, so the home page and
 * the spot pages can't drift apart: 16 px gutters and gaps on phones (12 px between cards), 24 px gutters on tablets,
 * 32 px from lg, with 16 px between cards and 24 px above and below the content from md.
 */
export const PageShell = ({ children, after }: PageShellProps) => (
    <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-3 px-4 py-4 md:gap-4 md:px-6 md:py-6 lg:px-8">
            {children}
        </main>
        <Footer />
        {after}
    </div>
);
