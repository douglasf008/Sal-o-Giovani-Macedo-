import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SalonDocument } from '../types';

const getInitialState = (): SalonDocument[] => {
    try {
        const item = window.localStorage.getItem('salonDocuments');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.warn('Error reading localStorage for salonDocuments:', error);
        return [];
    }
};

interface DocumentsContextType {
  documents: SalonDocument[];
  addDocument: (docData: Omit<SalonDocument, 'id' | 'createdAt'>) => void;
  deleteDocument: (docId: string) => void;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export const DocumentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<SalonDocument[]>(getInitialState);

  useEffect(() => {
      try {
          window.localStorage.setItem('salonDocuments', JSON.stringify(documents));
      } catch (error) {
          console.error('Error writing to localStorage for salonDocuments:', error);
      }
  }, [documents]);

  const addDocument = (docData: Omit<SalonDocument, 'id' | 'createdAt'>) => {
    const newDocument: SalonDocument = {
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...docData,
    };
    setDocuments(prev => [newDocument, ...prev]);
  };

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  return (
    <DocumentsContext.Provider value={{ documents, addDocument, deleteDocument }}>
      {children}
    </DocumentsContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentsProvider');
  }
  return context;
};
