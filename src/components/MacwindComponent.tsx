import { useState } from 'react';
import { LucideRefreshCw } from 'lucide-react';
import { useMacwindData } from '../hooks/useMacwindData';
import { useResponsiveView } from '../hooks/useResponsiveView';
import { useDirectionToggle } from '../hooks/useDirectionToggle';
import { MacwindHeader } from './macwind/MacwindHeader';
import { MacwindControls } from './macwind/MacwindControls';
import { MacwindTableView } from './macwind/MacwindTableView';
import { MacwindGraphView } from './macwind/MacwindGraphView';

const MacwindComponent = () => {
    const [timeFrame, setTimeFrame] = useState<'1min' | '15min'>('15min');
    
    const { windData, error, loading, refetch } = useMacwindData(timeFrame);
    const { showLabels, graphView, toggleLabels, toggleGraphView } = useResponsiveView();
    const { showText, toggleDirection } = useDirectionToggle();

    return (
        <div className="space-y-2">
            {error && <p className="p-4 font-bold text-rose-600 text-wrap">{error}</p>}
            
            {!error && (
                <div className="overflow-hidden w-full min-h-36 bg-zinc-900 rounded-md">
                    <MacwindHeader
                        showLabels={showLabels}
                        graphView={graphView}
                        onToggleLabels={toggleLabels}
                    />

                    <MacwindControls
                        graphView={graphView}
                        onToggleView={toggleGraphView}
                        loading={loading}
                        onRefresh={refetch}
                        timeFrame={timeFrame}
                        onTimeFrameChange={setTimeFrame}
                    />

                    {loading && !windData ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-y-3">
                            <LucideRefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
                            <p className="text-zinc-400 text-sm font-bold">
                                Fetching {timeFrame === '1min' ? '1 minute' : '15 minute'} average data...
                            </p>
                        </div>
                    ) : windData && windData.length === 0 ? (
                        <p className="p-4 font-bold text-zinc-600">
                            No wind data available.<br/>Likely due to loadshedding.
                        </p>
                    ) : windData && windData.length > 0 ? (
                        !graphView ? (
                            <MacwindTableView
                                windData={windData}
                                showLabels={showLabels}
                                showText={showText}
                                onToggleDirection={toggleDirection}
                            />
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-y-3">
                                <LucideRefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
                                <p className="text-zinc-400 text-sm font-bold">
                                    Fetching {timeFrame === '1min' ? '1 minute' : '15 minute'} average data...
                                </p>
                            </div>
                        ) : (
                            <MacwindGraphView
                                windData={windData}
                                timeFrame={timeFrame}
                            />
                        )
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default MacwindComponent;
