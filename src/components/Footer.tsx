function Footer() {
    return (
        <div className="flex flex-col gap-y-2 justify-center text-center py-8">
            <div>
                <span className="text-zinc-500">Data gathered from </span>
                <a className="text-zinc-200 text-xs" href="https://www.windguru.cz/208276" target="_blank" rel="noopener noreferrer">Windguru</a>
                <span className="text-zinc-500"> and </span>
                <a className="text-zinc-200 text-xs" href="https://mac-wind.appspot.com/" target="_blank" rel="noopener noreferrer">MAC Wind</a>
                <span className="text-zinc-500">.</span>
            </div>
            <span className="text-zinc-500">{new Date().getFullYear()} - Mikael Röthig</span>
        </div>
    );
}

export default Footer;