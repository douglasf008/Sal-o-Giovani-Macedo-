
import React, { createContext, useContext, ReactNode } from 'react';

interface PaymentContextType {
  processPayment: (amount: number, method: 'card' | 'pix' | 'debit', details: any) => Promise<{ success: boolean; transactionId: string }>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const processPayment = (amount: number, method: 'card' | 'pix' | 'debit', details: any): Promise<{ success: boolean; transactionId: string }> => {
    console.log(`Processing ${method} payment of R$${amount.toFixed(2)} with details:`, details);
    
    // Simulate API call delay
    return new Promise(resolve => {
        setTimeout(() => {
            const success = true; // Always succeed for simulation
            const transactionId = `txn_${Date.now()}`;
            console.log(`Payment successful. Transaction ID: ${transactionId}`);
            resolve({ success, transactionId });
        }, 2000);
    });
  };

  return (
    <PaymentContext.Provider value={{ processPayment }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};