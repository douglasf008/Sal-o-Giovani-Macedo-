import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appointment } from '../types';
import { APPOINTMENTS as INITIAL_APPOINTMENTS } from '../constants';

interface NewAppointmentData extends Omit<Appointment, 'id' | 'status'> {
    paymentStatus: 'paid' | 'pending' | 'not_applicable' | 'paid_with_package' | 'pending_package_purchase';
    transactionId?: string;
    clientPackageId?: string;
    pendingPackagePurchaseId?: string;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Omit<NewAppointmentData, 'clientId'> & { clientId: string }) => void;
  addAdminAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointment: (appointmentId: string, updates: Partial<Omit<Appointment, 'id'>>) => void;
  // FIX: Added a name to the second parameter to resolve a "Duplicate identifier" error.
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  deleteAppointment: (appointmentId: string) => void;
  deleteAppointmentsByClientId: (clientId: string) => void;
  deleteAppointmentsByServiceId: (serviceId: string) => void;
  deleteAppointmentsByProfessionalId: (professionalId: string) => void;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export const AppointmentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);

  const addAppointment = (appointmentData: Omit<NewAppointmentData, 'clientId'> & { clientId: string }) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `a${Date.now()}`,
      status: 'scheduled',
    };
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time)));
  };

  const addAdminAppointment = (appointmentData: Omit<Appointment, 'id' | 'status'>) => {
     const newAppointment: Appointment = {
      ...appointmentData,
      id: `a${Date.now()}`,
      status: 'scheduled',
      paymentStatus: appointmentData.paymentStatus || 'not_applicable',
    };
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time)));
  }
  
  const updateAppointment = (appointmentId: string, updates: Partial<Omit<Appointment, 'id'>>) => {
    setAppointments(prev =>
      prev.map(app => (app.id === appointmentId ? { ...app, ...updates } : app))
    );
  };

  const updateAppointmentStatus = (appointmentId: string, status: 'scheduled' | 'completed' | 'canceled' | 'canceled_late') => {
    updateAppointment(appointmentId, { status });
  };

  const deleteAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.filter(app => app.id !== appointmentId));
  };

  const deleteAppointmentsByClientId = (clientId: string) => {
    setAppointments(prev => prev.filter(app => app.clientId !== clientId));
  };

  const deleteAppointmentsByServiceId = (serviceId: string) => {
    setAppointments(prev => prev.filter(app => app.service.id !== serviceId));
  };

  const deleteAppointmentsByProfessionalId = (professionalId: string) => {
    setAppointments(prev => prev.filter(app => app.professional.id !== professionalId));
  };

  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment, addAdminAppointment, updateAppointment, updateAppointmentStatus, deleteAppointment, deleteAppointmentsByClientId, deleteAppointmentsByServiceId, deleteAppointmentsByProfessionalId }}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
};
