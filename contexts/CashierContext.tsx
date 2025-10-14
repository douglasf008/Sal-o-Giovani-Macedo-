import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface DailyTransaction {
    type: 'sangria' | 'suprimento';
    amount: number;
    reason: string;
    timestamp: string;
}

export interface ClosedCashierSummary {
    id: string;
    date: string; // YYYY-MM-DD
    closeTime: string; // ISO string
    initialCash: number;
    finalCash: number; 
    difference: number;
    totalSales: number;
    payments: { cash: number; card: number; pix: number; };
    totalVales: number;
    totalSangrias: number;
    closedBy: string;
}

interface CashierState {
    isOpen: boolean;
    initialCash: number;
    date: string | null;
    openTimestamp: string | null;
    transactions: DailyTransaction[];
}

interface CashierContextType {
  cashierState: CashierState;
  cashierHistory: ClosedCashierSummary[];
  openCashier: (initialAmount: number) => void;
  closeCashier: () => void;
  addTransaction: (transaction: Omit<DailyTransaction, 'timestamp'>) => void;
  addSessionToHistory: (summary: Omit<ClosedCashierSummary, 'id'>) => void;
}

const CashierContext = createContext<CashierContextType | undefined>(undefined);

const getTodaysDateKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const CashierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cashierState, setCashierState] = useState<CashierState>({
        isOpen: false,
        initialCash: 0,
        date: null,
        openTimestamp: null,
        transactions: [],
    });

    const [history, setHistory] = useState<ClosedCashierSummary[]>([]);
    
    const updateStateAndStorage = (newState: CashierState) => {
        if (!newState.date) return;
        try {
            localStorage.setItem(`cashierState_${newState.date}`, JSON.stringify(newState));
            setCashierState(newState);
        } catch (error) {
            console.error("Failed to save cashier state to localStorage", error);
        }
    };

    useEffect(() => {
        const dateKey = getTodaysDateKey();
        try {
            const storedState = localStorage.getItem(`cashierState_${dateKey}`);
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                if (parsedState.date === dateKey && parsedState.isOpen) {
                    setCashierState({ transactions: [], ...parsedState });
                }
            }
            const storedHistory = localStorage.getItem('cashierHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to load cashier state from localStorage", error);
        }
    }, []);

    const openCashier = (initialAmount: number) => {
        const dateKey = getTodaysDateKey();
        const newState: CashierState = {
            isOpen: true,
            initialCash: initialAmount,
            date: dateKey,
            openTimestamp: new Date().toISOString(),
            transactions: [],
        };
        updateStateAndStorage(newState);
    };

    const closeCashier = () => {
        const resetState: CashierState = { 
            isOpen: false, 
            initialCash: 0, 
            date: null,
            openTimestamp: null,
            transactions: [],
        };
        if (cashierState.date) {
            localStorage.removeItem(`cashierState_${cashierState.date}`);
        }
        setCashierState(resetState);
    };
    
    const addSessionToHistory = (summary: Omit<ClosedCashierSummary, 'id'>) => {
        const newEntry = { ...summary, id: `session-${Date.now()}` };
        setHistory(prev => {
            const updatedHistory = [newEntry, ...prev];
            try {
                localStorage.setItem('cashierHistory', JSON.stringify(updatedHistory));
            } catch (error) {
                 console.error("Failed to save cashier history to localStorage", error);
            }
            return updatedHistory;
        });
    };

    const addTransaction = (transaction: Omit<DailyTransaction, 'timestamp'>) => {
        if (!cashierState.isOpen || !cashierState.date) {
            console.error("Cannot add transaction: Cashier is not open.");
            return;
        }
        
        const newTransaction: DailyTransaction = {
            ...transaction,
            timestamp: new Date().toISOString(),
        };

        const newState: CashierState = {
            ...cashierState,
            transactions: [...(cashierState.transactions || []), newTransaction],
        };
        updateStateAndStorage(newState);
    };
  
    return (
        <CashierContext.Provider value={{ cashierState, cashierHistory: history, openCashier, closeCashier, addTransaction, addSessionToHistory }}>
            {children}
        </CashierContext.Provider>
    );
};

export const useCashier = () => {
    const context = useContext(CashierContext);
    if (context === undefined) {
        throw new Error('useCashier must be used within a CashierProvider');
    }
    return context;
};