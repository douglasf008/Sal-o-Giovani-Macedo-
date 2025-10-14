
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Service } from '../types';
import { INITIAL_SERVICES } from '../constants';

interface ServicesContextType {
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (service: Service) => void;
  deleteService: (serviceId: string) => void;
  getServiceCategories: () => string[];
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const ServicesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);

  const addService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `s${Date.now()}`,
    };
    setServices(prev => [...prev, newService]);
  };
  
  const updateService = (updatedService: Service) => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const getServiceCategories = () => {
    return [...new Set(services.map(s => s.category))];
  }

  return (
    <ServicesContext.Provider value={{ services, addService, updateService, deleteService, getServiceCategories }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};