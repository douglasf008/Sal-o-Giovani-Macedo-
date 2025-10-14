import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Vale {
    id: number;
    employeeId: string;
    employeeName: string;
    date: string; // ISO string date
    items: { name: string; quantity: number; price: number }[];
    totalAmount: number;
    status: 'Ativo' | 'Quitado';
    installments?: {
        total: number;
        paid: number;
    };
}

interface ValesContextType {
  vales: Vale[];
  addVale: (valeData: Omit<Vale, 'id' | 'status'>) => void;
  updateValeStatus: (valeId: number, status: 'Ativo' | 'Quitado') => void;
  updateVale: (updatedVale: Vale) => void;
  deleteVale: (valeId: number) => void;
}

const ValesContext = createContext<ValesContextType | undefined>(undefined);

const MOCK_VALES: Vale[] = [
    { 
        id: 1, 
        employeeId: 'p2', 
        employeeName: 'Ana Silva', 
        date: '2024-07-18T12:00:00.000Z', 
        items: [{ name: 'Corte Feminino', quantity: 1, price: 40.00 }], 
        totalAmount: 40.00, 
        status: 'Ativo' 
    },
    { 
        id: 2, 
        employeeId: 'p3', 
        employeeName: 'Carlos Souza', 
        date: '2024-07-15T12:00:00.000Z', 
        items: [{ name: 'Shampoo (Revenda)', quantity: 1, price: 45.00 }], 
        totalAmount: 45.00, 
        status: 'Ativo' 
    },
    { 
        id: 3, 
        employeeId: 'p2', 
        employeeName: 'Ana Silva', 
        date: '2024-06-25T12:00:00.000Z', 
        items: [{ name: 'Manicure', quantity: 1, price: 25.00 }], 
        totalAmount: 25.00, 
        status: 'Quitado' 
    },
    { 
        id: 4, 
        employeeId: 'p4', 
        employeeName: 'Mariana Silva', 
        date: '2024-07-10T12:00:00.000Z', 
        items: [{ name: 'Adiantamento', quantity: 1, price: 150.00 }], 
        totalAmount: 150.00, 
        status: 'Ativo',
        installments: {
            total: 3,
            paid: 0,
        }
    },
];


export const ValesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vales, setVales] = useState<Vale[]>(MOCK_VALES);

  const addVale = (valeData: Omit<Vale, 'id' | 'status'>) => {
    const newVale: Vale = {
      ...valeData,
      id: Date.now(),
      status: 'Ativo',
    };
    setVales(prev => [newVale, ...prev]);
  };

  const updateValeStatus = (valeId: number, status: 'Ativo' | 'Quitado') => {
      setVales(prev => prev.map(vale => vale.id === valeId ? { ...vale, status } : vale));
  };
  
  const updateVale = (updatedVale: Vale) => {
    setVales(prev => prev.map(vale => (vale.id === updatedVale.id ? updatedVale : vale)));
  };

  const deleteVale = (valeId: number) => {
    setVales(prev => prev.filter(vale => vale.id !== valeId));
  };

  return (
    <ValesContext.Provider value={{ vales, addVale, updateValeStatus, updateVale, deleteVale }}>
      {children}
    </ValesContext.Provider>
  );
};

export const useVales = () => {
  const context = useContext(ValesContext);
  if (context === undefined) {
    throw new Error('useVales must be used within a ValesProvider');
  }
  return context;
};