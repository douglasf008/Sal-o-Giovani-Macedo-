import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CreditFeeTier {
    installments: number;
    fee: number;
}

export interface CycleConfig {
    cycleType: 'days_5_20' | 'day_5' | 'business_day' | 'weekly';
    dayOne: string;
    dayTwo: string;
    businessDay: string;
    weeklyDay: string;
}

export interface FinancialSettings {
    acceptsDebit: boolean;
    debitFee: number;
    creditFeeType: 'tiered' | 'fixed';
    fixedCreditFee: number;
    creditFeeTiers: CreditFeeTier[];
    maxInstallments: number;
    feeBearer: 'salon' | 'employee';
    cycleConfig: CycleConfig;
    valeInstallmentThreshold: number;
    minInstallmentValue: number;
}

interface FinancialsContextType {
  settings: FinancialSettings;
  saveSettings: (settings: FinancialSettings) => void;
}

const FinancialsContext = createContext<FinancialsContextType | undefined>(undefined);

const defaultSettings: FinancialSettings = {
    acceptsDebit: true,
    debitFee: 1.99,
    creditFeeType: 'tiered',
    fixedCreditFee: 5.99,
    creditFeeTiers: [
        { installments: 1, fee: 4.99 },
        { installments: 6, fee: 12.00 },
        { installments: 12, fee: 18.00 },
    ],
    maxInstallments: 12,
    feeBearer: 'salon',
    cycleConfig: {
        cycleType: 'days_5_20',
        dayOne: '5',
        dayTwo: '20',
        businessDay: '5',
        weeklyDay: '5', // 5 = Sexta-feira
    },
    valeInstallmentThreshold: 300,
    minInstallmentValue: 30.00,
};

const SETTINGS_KEY = 'financialSettings';

export const FinancialsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<FinancialSettings>(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch (error) {
            console.error("Failed to load financial settings", error);
            return defaultSettings;
        }
    });

    const saveSettings = (newSettings: FinancialSettings) => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error("Failed to save financial settings", error);
        }
    };

    return (
        <FinancialsContext.Provider value={{ settings, saveSettings }}>
            {children}
        </FinancialsContext.Provider>
    );
};

export const useFinancials = () => {
    const context = useContext(FinancialsContext);
    if (!context) {
        throw new Error('useFinancials must be used within a FinancialsProvider');
    }
    return context;
};