import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Client } from '../types';
import { CLIENTS as INITIAL_CLIENTS } from '../constants';
import { useAuth } from './AuthContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, query } from "firebase/firestore";

interface ClientsContextType {
  clients: Client[];
  addClient: (clientData: Omit<Client, 'id' | 'avatarUrl' | 'notes'>) => Promise<Client>;
  updateClient: (updatedClient: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const { db, isFirebaseAvailable } = useAuth();

  useEffect(() => {
    if (!isFirebaseAvailable || !db) {
        console.log("Firebase not available, using mock client data.");
        setClients(INITIAL_CLIENTS);
        return;
    }

    const fetchClients = async () => {
      try {
        const clientsCollection = collection(db, "clients");
        const q = query(clientsCollection);
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("Seeding Firebase 'clients' collection...");
            const batch = writeBatch(db);
            INITIAL_CLIENTS.forEach((client) => {
                const { id, ...clientData } = client;
                const docRef = doc(db, "clients", id);
                batch.set(docRef, clientData);
            });
            await batch.commit();
            setClients(INITIAL_CLIENTS);
        } else {
            const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            setClients(clientsData);
        }
      } catch (error) {
          console.error("Error fetching or seeding clients from Firebase: ", error);
          setClients(INITIAL_CLIENTS);
      }
    };

    fetchClients();
  }, [isFirebaseAvailable, db]);

  const addClient = async (clientData: Omit<Client, 'id' | 'avatarUrl' | 'notes'>): Promise<Client> => {
    const avatarUrl = `https://i.pravatar.cc/150?u=${clientData.name.replace(/\s/g, '')}`;
    
    if (!isFirebaseAvailable || !db) {
      console.log("Firebase not available. Adding client locally.");
      const newClient: Client = {
        id: `c${Date.now()}`,
        avatarUrl,
        ...clientData,
      };
      setClients(prev => [...prev, newClient]);
      return newClient;
    }

    try {
        const clientsCollection = collection(db, "clients");
        const docRef = await addDoc(clientsCollection, {...clientData, avatarUrl});
        const newClient: Client = {
            id: docRef.id,
            avatarUrl,
            ...clientData,
        };
        setClients(prev => [...prev, newClient]);
        return newClient;
    } catch (error) {
        console.error("Error adding client to Firebase: ", error);
        throw error;
    }
  };
  
  const updateClient = async (updatedClient: Client) => {
    if (!isFirebaseAvailable || !db) {
        console.log("Firebase not available. Updating client locally.");
        setClients(prev => prev.map(client => client.id === updatedClient.id ? updatedClient : client));
        return;
    }
    
    try {
        const clientDoc = doc(db, "clients", updatedClient.id);
        const { id, ...clientData } = updatedClient;
        await updateDoc(clientDoc, clientData as any); // Use any to bypass strict type check for firestore
        setClients(prev => prev.map(client => client.id === updatedClient.id ? updatedClient : client));
    } catch (error) {
        console.error("Error updating client in Firebase: ", error);
        throw error;
    }
  };

  const deleteClient = async (clientId: string) => {
      if (!isFirebaseAvailable || !db) {
        console.log("Firebase not available. Deleting client locally.");
        setClients(prev => prev.filter(client => client.id !== clientId));
        return;
    }

    try {
        const clientDoc = doc(db, "clients", clientId);
        await deleteDoc(clientDoc);
        setClients(prev => prev.filter(client => client.id !== clientId));
    } catch (error) {
        console.error("Error deleting client from Firebase: ", error);
        throw error;
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, deleteClient }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};