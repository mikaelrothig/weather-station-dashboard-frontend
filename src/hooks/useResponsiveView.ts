import { useState, useEffect } from 'react';

export const useResponsiveView = () => {
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [graphView, setGraphView] = useState<boolean>(true);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            setShowLabels(width >= 512);

            if (width < 1280) {
                setGraphView(false);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // run once on mount

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const toggleLabels = () => setShowLabels(prev => !prev);
    const toggleGraphView = () => setGraphView(prev => !prev);

    return {
        showLabels,
        graphView,
        toggleLabels,
        toggleGraphView,
    };
};