import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { WeeklyDiscount } from '../types';

const getInitialState = (): WeeklyDiscount[] => {
    try {
        const item = window.localStorage.getItem('weeklyDiscounts');
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.warn('Error reading localStorage for weeklyDiscounts:', error);
    }
    return [
        {
            id: 'promo-corte-segunda',
            name: 'Segunda do Corte',
            itemId: 's1',
            itemType: 'service',
            days: [1], // Monday
            discountValue: 10,
            discountType: 'PERCENT',
        },
    ];
};

interface DiscountsContextType {
  discounts: WeeklyDiscount[];
  addDiscount: (discountData: Omit<WeeklyDiscount, 'id'>) => void;
  updateDiscount: (updatedDiscount: WeeklyDiscount) => void;
  deleteDiscount: (discountId: string) => void;
}

const DiscountsContext = createContext<DiscountsContextType | undefined>(undefined);

export const DiscountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [discounts, setDiscounts] = useState<WeeklyDiscount[]>(getInitialState);

  useEffect(() => {
      try {
          window.localStorage.setItem('weeklyDiscounts', JSON.stringify(discounts));
      } catch (error) {
          console.error('Error writing to localStorage for weeklyDiscounts:', error);
      }
  }, [discounts]);

  const addDiscount = (discountData: Omit<WeeklyDiscount, 'id'>) => {
    const newDiscount: WeeklyDiscount = {
      id: `wd-${Date.now()}`,
      ...discountData,
    };
    setDiscounts(prev => [...prev, newDiscount]);
  };
  
  const updateDiscount = (updatedDiscount: WeeklyDiscount) => {
    setDiscounts(prev => prev.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
  };

  const deleteDiscount = (discountId: string) => {
    setDiscounts(prev => prev.filter(d => d.id !== discountId));
  };
  
  return (
    <DiscountsContext.Provider value={{ discounts, addDiscount, updateDiscount, deleteDiscount }}>
      {children}
    </DiscountsContext.Provider>
  );
};

export const useDiscounts = () => {
  const context = useContext(DiscountsContext);
  if (context === undefined) {
    throw new Error('useDiscounts must be used within a DiscountsProvider');
  }
  return context;
};