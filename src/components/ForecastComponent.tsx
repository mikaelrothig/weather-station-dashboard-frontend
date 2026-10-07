import { useState } from "react";
import { Navigation2, Thermometer, Timer, Waves, Wind, Zap } from "lucide-react";
import { getWaveBackgroundColor, getWavePeriodBackgroundColor, getWindBackgroundColor } from "../utils/ColorUtils.tsx";
import { getDegreesToCompass } from "../utils/DataUtils.tsx";
import { getDayLabel, getHourLabel } from "../utils/TimeUtils.tsx";
import { buildForecastHours, groupByDay } from "../utils/forecastUtils.ts";
import { Forecast, WaveForecast } from "../api/types.ts";
import { useDirectionToggle } from "../hooks/useDirectionToggle.ts";
import { ForecastCard, ForecastMessage, ForecastSkeleton } from "./ui/ForecastCard.tsx";
import { ForecastColumn, ForecastRow, ForecastTable } from "./ui/ForecastTable.tsx";
import { ForecastDayList } from "./ui/ForecastDayList.tsx";
import { DirectionArrow } from "./ui/DirectionArrow.tsx";
import { ModelStatus } from "./ui/ModelStatus.tsx";
import { SegmentedControl } from "./ui/SegmentedControl.tsx";

export type ForecastModel = "hires" | "gfs";
type Model = ForecastModel;

interface ModelSource {
    data: Forecast | null;
    loading: boolean;
    error: string | null;
}

interface ForecastProps {
    /** The high-resolution model: WRF 9 km Southern Africa */
    hires: ModelSource;
    gfs: ModelSource;
    waves: WaveForecast | null;
    index: number;
    /** Share a day of the model currently on screen */
    onShareDay?: (dayKey: string, model: ForecastModel) => void;
}

const MODEL_KEY = "forecast-model";

const MODELS: Record<Model, { label: string; name: string; step: number }> = {
    hires: { label: "High-res", name: "Regional high resolution", step: 1 },
    gfs: { label: "GFS 13 km", name: "GFS 13 km, 16-day global", step: 2 },
};

const useForecastModel = () => {
    const [model, setModel] = useState<Model>(() => {
        try {
            return localStorage.getItem(MODEL_KEY) === "gfs" ? "gfs" : "hires";
        } catch {
            return "hires";
        }
    });

    const update = (next: Model) => {
        setModel(next);
        try {
            localStorage.setItem(MODEL_KEY, next);
        } catch {
            // Storage unavailable; the choice still applies for this visit
        }
    };

    return [model, update] as const;
};

const ForecastComponent = ({ hires, gfs, waves, index, onShareDay }: ForecastProps) => {
    const [model, setModel] = useForecastModel();
    const { showText, toggleDirection } = useDirectionToggle("forecast-show-direction-text");
    // Show what works: if the high-res model failed and GFS loaded, fall back without making people switch
    const effectiveModel: Model = model === "hires" && hires.error && gfs.data ? "gfs" : model;
    const source = effectiveModel === "hires" ? hires : gfs;
    // Label each option with the model actually served for this spot, once it's known
    const label = (m: Model) => (m === "hires" ? hires.data?.model.name : gfs.data?.model.name) ?? MODELS[m].label;

    const actions = (
        <SegmentedControl
            label="Forecast model"
            value={effectiveModel}
            onChange={setModel}
            options={(Object.keys(MODELS) as Model[]).map((m) => ({ value: m, label: label(m) }))}
        />
    );

    if (source.loading || source.error || !source.data?.hours.length) {
        return (
            <ForecastCard title="Forecast" subtitle={MODELS[effectiveModel].name} actions={actions} index={index}>
                {source.loading ? (
                    <ForecastSkeleton rows={5} />
                ) : source.error ? (
                    <ForecastMessage tone="error">Couldn't load the {label(effectiveModel)} forecast.</ForecastMessage>
                ) : (
                    <ForecastMessage>No forecast data available.</ForecastMessage>
                )}
            </ForecastCard>
        );
    }

    const hours = buildForecastHours(source.data, waves, MODELS[effectiveModel].step);
    const showWaves = hours.some((h) => h.wave !== undefined);
    const windCell = (v: number) => ({ content: Math.round(v), className: `${getWindBackgroundColor(Math.round(v))} text-zinc-950` });

    const columns: ForecastColumn[] = hours.map((h) => ({
        key: String(h.time.getTime()),
        dayKey: h.dayKey,
        dayLabel: getDayLabel(h.time),
        timeLabel: getHourLabel(h.time),
        dim: h.night,
        isNow: h.isNow,
    }));

    const rows: ForecastRow[] = [
        { key: "speed", icon: Wind, label: "Speed", shortLabel: "Wind", unit: "kn", cells: hours.map((h) => windCell(h.speed)) },
        { key: "gusts", icon: Zap, label: "Gusts", shortLabel: "Gust", unit: "kn", cells: hours.map((h) => windCell(h.gust)) },
        {
            key: "direction", icon: Navigation2, label: "Direction", shortLabel: "Dir",
            onToggle: toggleDirection,
            toggleHint: showText ? "Show arrows" : "Show compass points",
            cells: hours.map((h) => ({
                content: showText ? <span className="text-[10px]">{getDegreesToCompass(h.direction)}</span> : <DirectionArrow degrees={h.direction} />,
                title: `${getDegreesToCompass(h.direction)} (${Math.round(h.direction)}°)`,
            })),
        },
    ];

    if (showWaves) {
        rows.push(
            {
                key: "wave", icon: Waves, label: "Waves", shortLabel: "Wave", unit: "m",
                cells: hours.map((h) => h.wave === undefined
                    ? { content: "–" }
                    : { content: Math.round(h.wave * 10) / 10, className: `${getWaveBackgroundColor(Math.round(h.wave * 10) / 10)} text-zinc-950` }),
            },
            {
                key: "period", icon: Timer, label: "Period", shortLabel: "Per.", unit: "s",
                cells: hours.map((h) => h.wavePeriod === undefined
                    ? { content: "–" }
                    : { content: Math.round(h.wavePeriod), className: `${getWavePeriodBackgroundColor(Math.round(h.wavePeriod))} text-zinc-950` }),
            },
            {
                key: "swell", icon: Navigation2, label: "Swell dir", shortLabel: "Swell",
                cells: hours.map((h) => h.waveDirection === undefined
                    ? { content: "–" }
                    : {
                        content: <DirectionArrow degrees={h.waveDirection} className="size-3.5 fill-sky-300 stroke-none" />,
                        title: `Swell from ${getDegreesToCompass(h.waveDirection)} (${Math.round(h.waveDirection)}°)`,
                    }),
            },
        );
    }

    rows.push({ key: "temp", icon: Thermometer, label: "Temp", shortLabel: "Temp", unit: "°C", cells: hours.map((h) => (h.temp === null ? { content: "–" } : windCell(h.temp))) });

    return (
        <ForecastCard
            title="Forecast"
            subtitle={<ModelStatus model={source.data.model} />}
            actions={actions}
            index={index}
        >
            <div className="hidden md:block">
                <ForecastTable columns={columns} rows={rows} onShareDay={onShareDay && ((key) => onShareDay(key, effectiveModel))} />
            </div>
            <div className="-mb-4 md:hidden">
                <ForecastDayList key={effectiveModel} days={groupByDay(hours)} showWaves={showWaves} onShareDay={onShareDay && ((key) => onShareDay(key, effectiveModel))} />
            </div>
        </ForecastCard>
    );
};

export default ForecastComponent;
