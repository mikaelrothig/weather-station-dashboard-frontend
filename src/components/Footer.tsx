import { Mail, Linkedin, Github, Instagram } from "lucide-react";

function Footer() {
    return (
        <div className="flex flex-col p-3 bg-zinc-900 rounded-md gap-y-3">
            <span className="text-zinc-500">
                Data gathered from
                <a className="font-normal hover:text-rose-500" href="https://www.windguru.cz/" target="_blank" rel="noopener noreferrer"> Windguru </a>
                and
                <a className="font-normal hover:text-rose-500" href="https://mac-wind.appspot.com/" target="_blank" rel="noopener noreferrer"> MAC Wind</a>
                . This is a personal project built for learning and experimentation, not for commercial use or official forecasting.
            </span>

            <div className="flex gap-x-0.5">
                <a href="https://github.com/mikaelrothig/weather-station-dashboard-frontend" target="_blank" className="flex gap-x-2 items-center px-3 py-2 bg-zinc-800 rounded-l-md font-normal hover:text-rose-500">
                    <div className="relative">
                        <div className="flex w-2 h-2 bg-rose-500 rounded-full">
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-rose-500 opacity-75 animate-ping"></div>
                        </div>
                    </div>
                    v2.0
                </a>
                <span className="px-3 py-2 bg-zinc-800 text-zinc-500">{new Date().getFullYear()}</span>
                <span className="flex flex-grow px-3 py-2 bg-zinc-800 text-zinc-500">Mikael Röthig</span>
                <div className="flex gap-x-2 px-3 py-2 items-center bg-zinc-800 text-zinc-500 rounded-r-md">
                    <a href="mailto:mrrothig@gmail.com">
                        <Mail className="stroke-zinc-500 hover:stroke-zinc-200 h-4 w-4"/>
                    </a>
                    <a href="https://www.linkedin.com/in/mikael-r%C3%B6thig-104227185" target="_blank">
                        <Linkedin className="stroke-zinc-500 hover:stroke-zinc-200 h-4 w-4"/>
                    </a>
                    <a href="https://github.com/MikaelRothig" target="_blank">
                        <Github className="stroke-zinc-500 hover:stroke-zinc-200 h-4 w-4"/>
                    </a>
                    <a href="https://www.instagram.com/mikaelrothig/" target="_blank">
                        <Instagram className="stroke-zinc-500 hover:stroke-zinc-200 h-4 w-4"/>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Footer;