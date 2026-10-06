import { useState, useEffect } from 'react';

export const useDirectionToggle = (storageKey: string) => {
    const [showText, setShowText] = useState<boolean>(() => {
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, String(showText));
        } catch {
            // Storage unavailable (private mode); the toggle still works for this visit
        }
    }, [storageKey, showText]);

    const toggleDirection = () => setShowText(prev => !prev);

    return {
        showText,
        toggleDirection,
    };
};
