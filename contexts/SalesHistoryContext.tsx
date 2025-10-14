import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SaleRecord } from '../types';
import { PROFESSIONALS, INITIAL_SERVICES, STOCK_ITEMS } from '../constants';

const generateMockSales = (): SaleRecord[] => {
    const sales: SaleRecord[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) { // Generate sales for the last 30 days
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const salesPerDay = Math.floor(Math.random() * 5) + 2; // 2 to 6 sales per day

        for (let j = 0; j < salesPerDay; j++) {
            const professional = PROFESSIONALS[Math.floor(Math.random() * PROFESSIONALS.length)];
            const service = INITIAL_SERVICES.find(s => professional.serviceIds.includes(s.id)) || INITIAL_SERVICES[0];
            const discount = Math.random() > 0.8 ? service.price * 0.1 : 0; // 20% chance of 10% discount
            const finalPrice = service.price - discount;
            const tip = Math.random() > 0.8 ? finalPrice * 0.1 : 0; // 20% chance of 10% tip
            const totalWithTip = finalPrice + tip;
            const commission = service.commissionPercentage || 45;
            
            const saleItem = {
                id: `s${service.id}-${Date.now()}`,
                type: 'service' as const,
                item: service,
                professionalId: professional.id,
                commission: commission,
                discountValue: discount,
                discountType: 'FIXED' as const,
                finalPrice: finalPrice,
                finalCommissionValue: finalPrice * (commission / 100),
                isDoseApplied: false,
                manualDiscount: discount
            };

            sales.push({
                id: `sale-${date.getTime()}-${j}`,
                date: date.toISOString(),
                clientIds: [`c${(j % 4) + 1}`],
                clientNames: [`Cliente Mock ${j}`],
                items: [saleItem],
                totals: {
                    subtotal: service.price,
                    discount: discount,
                    tip: tip,
                    total: totalWithTip,
                },
                payment: {
                    method: ['Dinheiro', 'Pix', 'Débito', 'Crédito'][Math.floor(Math.random() * 4)],
                    installments: 1
                }
            });
        }
    }
    return sales;
};


const MOCK_SALES_HISTORY: SaleRecord[] = generateMockSales();

interface SalesHistoryContextType {
  sales: SaleRecord[];
  addSale: (saleData: Omit<SaleRecord, 'id'>) => void;
  updateSale: (updatedSale: SaleRecord) => void;
  deleteSale: (saleId: string) => void;
}

const SalesHistoryContext = createContext<SalesHistoryContextType | undefined>(undefined);

export const SalesHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<SaleRecord[]>(MOCK_SALES_HISTORY);

  const addSale = (saleData: Omit<SaleRecord, 'id'>) => {
    const newSale: SaleRecord = {
      ...saleData,
      id: `sale-${Date.now()}`,
    };
    setSales(prev => [newSale, ...prev]);
  };

  const updateSale = (updatedSale: SaleRecord) => {
    setSales(prev => prev.map(sale => sale.id === updatedSale.id ? updatedSale : sale));
  };

  const deleteSale = (saleId: string) => {
    setSales(prev => prev.filter(sale => sale.id !== saleId));
  };

  return (
    <SalesHistoryContext.Provider value={{ sales, addSale, updateSale, deleteSale }}>
      {children}
    </SalesHistoryContext.Provider>
  );
};

export const useSalesHistory = () => {
  const context = useContext(SalesHistoryContext);
  if (context === undefined) {
    throw new Error('useSalesHistory must be used within a SalesHistoryProvider');
  }
  return context;
};