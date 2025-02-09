function Header() {
    return <div>
        <div className="flex items-center gap-2">
            <h1>Blouberg - Wind</h1>
            <span
                className="flex h-fit px-1 py-0,5 rounded text-nowrap bg-rose-600 text-xs font-bold text-zinc-900">Live</span>
        </div>
        <h2>2025-02-08</h2>
        <p className="pt-4">
            This is an official weather station.<br/>
            I’m definitely not just scraping Mac wind data.
        </p>
    </div>
}

export default Header;