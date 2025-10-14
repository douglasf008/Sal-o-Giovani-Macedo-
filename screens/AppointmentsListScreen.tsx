import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../contexts/AppointmentsContext';
import { Appointment } from '../types';
import { useSalonSettings } from '../salonSettings';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import { useAuth } from '../contexts/AuthContext';

const CancelConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-center">
                <h2 className="text-xl font-bold mb-4">Confirmar Cancelamento</h2>
                <p className="text-gray-300 mb-6">Tem certeza que deseja cancelar este agendamento?</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Voltar
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


const AppointmentsListScreen: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Próximos');
    const { appointments, deleteAppointment } = useAppointments();
    const { settings } = useSalonSettings();
    const { currentClient } = useAuth();

    const clientId = currentClient?.id;

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

    const { upcomingAppointments, pastAppointments } = useMemo(() => {
        if (!clientId) return { upcomingAppointments: [], pastAppointments: [] };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const clientAppointments = appointments.filter(a => a.clientId === clientId);
        
        const upcoming = clientAppointments.filter(app => 
                app.status === 'scheduled' && 
                new Date(app.date) >= today
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
            
        const past = clientAppointments.filter(app => 
                app.status === 'completed' || 
                new Date(app.date) < today
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 7); // Show only the 7 most recent past appointments

        return { upcomingAppointments: upcoming, pastAppointments: past };
    }, [appointments, clientId]);

    const appointmentsToShow = activeTab === 'Próximos' ? upcomingAppointments : pastAppointments;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const handleCancelClick = (appointment: Appointment) => {
        setAppointmentToCancel(appointment);
        setIsConfirmOpen(true);
    };

    const handleConfirmCancel = () => {
        if (appointmentToCancel) {
            deleteAppointment(appointmentToCancel.id);
        }
        setIsConfirmOpen(false);
        setAppointmentToCancel(null);
    };

    const sanitizedWhatsapp = settings.salonWhatsapp ? settings.salonWhatsapp.replace(/\D/g, '') : '';

    return (
        <div className="flex flex-col h-screen justify-between bg-black text-white">
            <div className="flex-grow overflow-y-auto pb-20">
                <header className="p-4 text-center">
                    <h1 className="text-xl font-bold">Meus Agendamentos</h1>
                </header>
                
                <div className="px-4 border-b border-gray-700">
                    <div className="flex space-x-6">
                        {['Próximos', 'Anteriores'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-3 text-sm font-semibold ${activeTab === tab ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {appointmentsToShow.length > 0 ? appointmentsToShow.map(app => (
                        <div key={app.id} className="bg-gray-900 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{app.service.name}</p>
                                    <p className="text-sm text-gray-400">com {app.professional.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatDate(app.date)}</p>
                                    <p className="text-sm text-gray-400">{app.time}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <div>
                                     {app.paymentStatus === 'paid' && (
                                        <span className="text-xs font-bold bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                                            Pago
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => navigate(`/agendamentos/${app.id}`)} className="text-xs px-3 py-1 border border-gray-600 rounded-full hover:bg-gray-800 transition-colors">Detalhes</button>
                                    {activeTab === 'Próximos' && <button onClick={() => handleCancelClick(app)} className="text-xs px-3 py-1 bg-red-800/50 text-red-400 border border-red-800 rounded-full hover:bg-red-800/80 transition-colors">Cancelar</button>}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-16 text-gray-500">
                            <p className="mb-4">Nenhum agendamento {activeTab === 'Próximos' ? 'próximo' : 'anterior'}.</p>
                            {activeTab === 'Próximos' && (
                                <button onClick={() => navigate('/agendar')} className="px-6 py-2 bg-gray-200 text-black font-bold rounded-lg hover:bg-white transition-colors">
                                    Agendar um serviço
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <CancelConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmCancel}
            />
        </div>
    );
};

export default AppointmentsListScreen;