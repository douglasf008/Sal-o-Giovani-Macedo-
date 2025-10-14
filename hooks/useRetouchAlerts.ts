import { useMemo } from 'react';
import { useClients } from '../contexts/ClientsContext';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useServices } from '../contexts/ServicesContext';
import { Client, Service, Appointment } from '../types';

export interface RetouchAlert {
    client: Client;
    service: Service;
    lastAppointment: Appointment;
    dueDate: Date;
    daysUntilDue: number;
}

const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

const calculateDaysBetween = (date1: Date, date2: Date): number => {
    const oneDay = 1000 * 60 * 60 * 24;
    const diffTime = date1.getTime() - date2.getTime();
    return Math.ceil(diffTime / oneDay);
};

export const useRetouchAlerts = () => {
    const { clients } = useClients();
    const { appointments } = useAppointments();
    const { services } = useServices();

    const getAlerts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const servicesToTrack = services.filter(s => s.retouchPeriod && s.retouchPeriod > 0);

        return (dayThreshold: number = 15): RetouchAlert[] => {
            if (servicesToTrack.length === 0) return [];
            
            const allAlerts: RetouchAlert[] = [];

            for (const client of clients) {
                const clientAppointments = appointments
                    .filter(a => a.clientId === client.id && a.status === 'completed')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (clientAppointments.length === 0) continue;

                for (const service of servicesToTrack) {
                    const lastAppointmentForService = clientAppointments.find(a => a.service.id === service.id);

                    if (lastAppointmentForService) {
                        const dueDate = addMonths(new Date(lastAppointmentForService.date), service.retouchPeriod!);
                        const daysUntilDue = calculateDaysBetween(dueDate, today);

                        if (daysUntilDue <= dayThreshold) {
                            allAlerts.push({
                                client,
                                service,
                                lastAppointment: lastAppointmentForService,
                                dueDate,
                                daysUntilDue
                            });
                        }
                    }
                }
            }
            return allAlerts;
        };
    }, [clients, appointments, services]);

    const getUniqueClientAlerts = (dayThreshold: number = 15): RetouchAlert[] => {
        const allAlerts = getAlerts(dayThreshold);
        const clientAlertMap = new Map<string, RetouchAlert>();

        for (const alert of allAlerts) {
            if (!clientAlertMap.has(alert.client.id) || alert.daysUntilDue < clientAlertMap.get(alert.client.id)!.daysUntilDue) {
                clientAlertMap.set(alert.client.id, alert);
            }
        }
        
        return Array.from(clientAlertMap.values()).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    };
    
    const getAlertsForClient = (clientId: string, dayThreshold: number = 15): RetouchAlert[] => {
        return getAlerts(dayThreshold).filter(alert => alert.client.id === clientId);
    };

    return { getUniqueClientAlerts, getAlertsForClient };
};
