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