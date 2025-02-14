export function getBackgroundColor(entry: number): string {
    let bgColor;

    switch (true) {
        case entry >= 40:
            bgColor = 'bg-purple-600';
            break;
        case entry >= 35:
            bgColor = 'bg-pink-600';
            break;
        case entry >= 30:
            bgColor = 'bg-rose-600';
            break;
        case entry >= 25:
            bgColor = 'bg-orange-600';
            break;
        case entry >= 20:
            bgColor = 'bg-yellow-600';
            break;
        case entry >= 15:
            bgColor = 'bg-emerald-600';
            break;
        case entry >= 10:
            bgColor = 'bg-teal-600';
            break;
        default:
            bgColor = 'bg-cyan-600';
    }

    return bgColor;
}