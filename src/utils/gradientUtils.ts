import { getGraphStrokeColor } from './ColorUtils';

export const createGradientStops = (data: number[]) => {
    if (data.length === 0) return [{ offset: '0%', color: '#0284c7' }];

    return data.map((value, i) => {
        const offset = (i / (data.length - 1)) * 100;
        const color = getGraphStrokeColor(value);
        return { offset: `${offset}%`, color };
    });
};
