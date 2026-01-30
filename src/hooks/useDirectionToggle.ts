import { useState, useEffect } from 'react';

export const useDirectionToggle = () => {
    const [showText, setShowText] = useState<boolean>(() => {
        const saved = localStorage.getItem('macwind-show-direction-text');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem(
            'macwind-show-direction-text',
            String(showText)
        );
    }, [showText]);

    const toggleDirection = () => setShowText(prev => !prev);

    return {
        showText,
        toggleDirection,
    };
};