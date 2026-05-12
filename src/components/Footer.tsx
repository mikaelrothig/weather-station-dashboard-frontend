import { Tag } from "lucide-react";

function Footer() {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-md bg-zinc-900">
            <span className="hidden min-w-0 truncate md:block text-zinc-500">Data from <a className="font-normal transition-colors hover:text-rose-500" href="https://www.windguru.cz/" target="_blank" rel="noopener noreferrer">Windguru</a> and <a className="font-normal transition-colors hover:text-rose-500" href="https://mac-wind.appspot.com/" target="_blank" rel="noopener noreferrer">MAC Wind</a>. Personal project, not for official use</span>

            <div className="flex items-center gap-x-2 shrink-0">
                <span className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-500">Mikael Röthig · {new Date().getFullYear()}</span>
                <a href="https://github.com/mikaelrothig/weather-station-dashboard-frontend" target="_blank" rel="noopener noreferrer" className="flex items-center gap-x-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Tag className="w-3.5 h-3.5" />
                    v3.0
                </a>
            </div>
        </div>
    );
}

export default Footer;
