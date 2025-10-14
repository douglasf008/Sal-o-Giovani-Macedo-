import { useState, useEffect } from 'react';

export interface CashierSettings {
    titleScale: number;
    iconScale: number;
    headerLayout: 'default' | 'side-by-side';
    titleFont: string;
}

const SETTINGS_KEY = 'cashierHeaderSettings';

const defaultSettings: CashierSettings = {
    titleScale: 1.25,
    iconScale: 1,
    headerLayout: 'default',
    titleFont: 'System Default',
};

export const useCashierSettings = (): [CashierSettings, (settings: CashierSettings) => void] => {
    const [settings, setSettings] = useState<CashierSettings>(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure all default keys are present
                return { ...defaultSettings, ...parsed };
            }
        } catch (error) {
            console.error("Failed to load cashier settings from localStorage", error);
        }
        return defaultSettings;
    });

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save cashier settings to localStorage", error);
        }
    }, [settings]);

    return [settings, setSettings];
};
