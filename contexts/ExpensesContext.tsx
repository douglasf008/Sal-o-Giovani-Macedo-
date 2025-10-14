import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SalonExpense } from '../types';
import { STOCK_ITEMS as INITIAL_STOCK_ITEMS } from '../constants';

const getInitialState = (): SalonExpense[] => {
    try {
        const item = window.localStorage.getItem('salonExpenses');
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.warn('Error reading localStorage for salonExpenses:', error);
    }
    
    // Generate expenses from initial stock
    const stockExpenses: SalonExpense[] = INITIAL_STOCK_ITEMS
        .filter(item => item.cost && item.quantity > 0)
        .map((item, index) => {
            const purchaseDate = new Date();
            // Stagger purchase dates over the last 45 days for realism
            purchaseDate.setDate(purchaseDate.getDate() - (index * 3 + 5)); 
            return {
                id: `exp-stock-${item.id}`,
                date: purchaseDate.toISOString().split('T')[0],
                description: `Compra inicial: ${item.quantity}x ${item.name}`,
                category: 'Compra de Produtos',
                amount: item.cost! * item.quantity,
            };
        });
    
    // Return mock data if localStorage is empty or fails
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const otherExpenses: SalonExpense[] = [
        { id: 'exp1', date: today.toISOString().split('T')[0], description: 'Pagamento de comissões', category: 'Pagamentos de Equipe', amount: 1250.75 },
        { id: 'exp2', date: yesterday.toISOString().split('T')[0], description: 'Aluguel do espaço', category: 'Despesas Fixas', amount: 2500.00 },
        { id: 'exp4', date: new Date(new Date().setDate(today.getDate() - 5)).toISOString().split('T')[0], description: 'Reparo ar condicionado', category: 'Despesas Diversas', amount: 350.00 },
    ];

    return [...stockExpenses, ...otherExpenses];
};


interface ExpensesContextType {
  expenses: SalonExpense[];
  addExpense: (expenseData: Omit<SalonExpense, 'id'> & { id?: string }) => void;
  updateExpense: (updatedExpense: SalonExpense) => void;
  deleteExpense: (expenseId: string) => void;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<SalonExpense[]>(getInitialState);

  useEffect(() => {
      try {
          window.localStorage.setItem('salonExpenses', JSON.stringify(expenses));
      } catch (error) {
          console.error('Error writing to localStorage for salonExpenses:', error);
      }
  }, [expenses]);


  const addExpense = (expenseData: Omit<SalonExpense, 'id'> & { id?: string }) => {
    const { id, ...rest } = expenseData;
    const newExpense: SalonExpense = {
      id: id || `exp-${Date.now()}`,
      ...rest,
    };
    setExpenses(prev => [...prev, newExpense]);
  };
  
  const updateExpense = (updatedExpense: SalonExpense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };
  
  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within a ExpensesProvider');
  }
  return context;
};