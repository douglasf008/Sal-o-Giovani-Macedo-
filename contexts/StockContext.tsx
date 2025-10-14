import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StockItem } from '../types';
import { STOCK_ITEMS as INITIAL_STOCK_ITEMS } from '../constants';

interface StockContextType {
  stockItems: StockItem[];
  addStockItem: (item: Omit<StockItem, 'id'>) => StockItem;
  updateStockItem: (item: StockItem) => void;
  deleteStockItem: (itemId: string) => void;
  updateStockQuantity: (itemId: string, newQuantity: number) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);

  const addStockItem = (itemData: Omit<StockItem, 'id'>): StockItem => {
    const newItem: StockItem = {
      id: `st${Date.now()}`,
      ...itemData,
    };
    setStockItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updateStockItem = (updatedItem: StockItem) => {
    setStockItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteStockItem = (itemId: string) => {
    setStockItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateStockQuantity = (itemId: string, newQuantity: number) => {
    setStockItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
      )
    );
  };
  
  return (
    <StockContext.Provider value={{ stockItems, addStockItem, updateStockItem, deleteStockItem, updateStockQuantity }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};