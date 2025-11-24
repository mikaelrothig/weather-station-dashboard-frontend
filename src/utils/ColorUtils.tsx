export function getWindBackgroundColor(entry: number): string {
    let bgColor;

    switch (true) {
        case entry >= 42:
            bgColor = 'bg-indigo-600';
            break;
        case entry >= 39:
            bgColor = 'bg-violet-600';
            break;
        case entry >= 36:
            bgColor = 'bg-purple-600';
            break;
        case entry >= 33:
            bgColor = 'bg-fuchsia-600';
            break;
        case entry >= 30:
            bgColor = 'bg-pink-600';
            break;
        case entry >= 27:
            bgColor = 'bg-rose-600';
            break;
        case entry >= 24:
            bgColor = 'bg-orange-600';
            break;
        case entry >= 21:
            bgColor = 'bg-amber-600';
            break;
        case entry >= 18:
            bgColor = 'bg-yellow-600';
            break;
        case entry >= 15:
            bgColor = 'bg-lime-600';
            break;
        case entry >= 12:
            bgColor = 'bg-green-600';
            break;
        case entry >= 9:
            bgColor = 'bg-emerald-600';
            break;
        case entry >= 6:
            bgColor = 'bg-teal-600';
            break;
        case entry >= 3:
            bgColor = 'bg-cyan-600';
            break;
        default:
            bgColor = 'bg-sky-600';
    }

    return bgColor;
}

export function getWaveBackgroundColor(entry: number): string {
    let bgColor;

    switch (true) {
        case entry >= 3:
            bgColor = 'bg-indigo-600';
            break;
        case entry >= 2.5:
            bgColor = 'bg-blue-600';
            break;
        case entry >= 2:
            bgColor = 'bg-sky-600';
            break;
        case entry >= 1.5:
            bgColor = 'bg-cyan-600';
            break;
        case entry >= 1:
            bgColor = 'bg-teal-600';
            break;
        default:
            bgColor = 'bg-emerald-600';
    }

    return bgColor;
}

export function getWavePeriodBackgroundColor(entry: number): string {
    let bgColor;

    switch (true) {
        case entry >= 20:
            bgColor = 'bg-rose-600';
            break;
        case entry >= 18:
            bgColor = 'bg-pink-600';
            break;
        case entry >= 16:
            bgColor = 'bg-fuchsia-600';
            break;
        case entry >= 14:
            bgColor = 'bg-purple-600';
            break;
        case entry >= 12:
            bgColor = 'bg-violet-600';
            break;
        default:
            bgColor = 'bg-indigo-600';
    }

    return bgColor;
}

export function getGraphStrokeColor(entry: number): string {
    switch (true) {
        case entry >= 42:
            return '#4f46e5';
        case entry >= 39:
            return '#7c3aed';
        case entry >= 36:
            return '#9333ea';
        case entry >= 33:
            return '#c026d3';
        case entry >= 30:
            return '#db2777';
        case entry >= 27:
            return '#e11d48';
        case entry >= 24:
            return '#ea580c';
        case entry >= 21:
            return '#d97706';
        case entry >= 18:
            return '#ca8a04';
        case entry >= 15:
            return '#65a30d';
        case entry >= 12:
            return '#16a34a';
        case entry >= 9:
            return '#059669';
        case entry >= 6:
            return '#0d9488';
        case entry >= 3:
            return '#0891b2';
        default:
            return '#0284c7';
    }
};