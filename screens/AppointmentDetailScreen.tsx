import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppointments } from '../contexts/AppointmentsContext';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import ClockIcon from '../components/icons/ClockIcon';
import ScissorsIcon from '../components/icons/ScissorsIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import { useSalonSettings } from '../salonSettings';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';

const AppointmentDetailScreen: React.FC = () => {
    const navigate = useNavigate();
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const { appointments } = useAppointments();
    const { settings } = useSalonSettings();

    const appointment = appointments.find(app => app.id === appointmentId);

    if (!appointment) {
        return (
            <div className="flex flex-col h-screen bg-black text-white p-4 items-center justify-center">
                <h1 className="text-xl font-bold mb-4">Agendamento não encontrado</h1>
                <button onClick={() => navigate(-1)} className="text-blue-400">Voltar</button>
            </div>
        );
    }

    const { service, professional, date, time, paymentStatus, transactionId } = appointment;
    const formattedDate = new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const isPast = new Date(date) < new Date();
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.salonAddress)}`;
    const sanitizedWhatsapp = settings.salonWhatsapp.replace(/\D/g, '');

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Detalhes do Agendamento</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <div className="flex-grow overflow-y-auto p-4 pb-24 space-y-6">
                {/* Main Details Card */}
                <div className="bg-gray-900 p-5 rounded-lg space-y-5">
                    <div className="flex items-start">
                        <ScissorsIcon className="w-6 h-6 mr-4 text-gray-400 mt-1" />
                        <div>
                            <p className="text-lg font-bold">{service.name}</p>
                            <p className="text-gray-300 font-semibold">R$ {service.price.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-5 space-y-5">
                        <div className="flex items-center">
                            <CalendarIcon className="w-6 h-6 mr-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-400">Data</p>
                                <p className="font-semibold">{formattedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <ClockIcon className="w-6 h-6 mr-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-400">Hora</p>
                                <p className="font-semibold">{time}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <img src={professional.avatarUrl} alt={professional.name} className="w-8 h-8 rounded-full mr-3" />
                            <div>
                                <p className="text-sm text-gray-400">Profissional</p>
                                <p className="font-semibold">{professional.name}</p>
                            </div>
                        </div>
                        {paymentStatus === 'paid' && (
                             <div className="flex items-center">
                                <CreditCardIcon className="w-6 h-6 mr-4 text-green-400" />
                                <div>
                                    <p className="text-sm text-gray-400">Pagamento</p>
                                    <p className="font-semibold text-green-400">Confirmado</p>
                                    {transactionId && <p className="text-xs text-gray-500">ID: {transactionId}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Location section */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Localização</h2>
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <p className="font-semibold">{settings.salonName}</p>
                        <p className="text-sm text-gray-400 mb-3">{settings.salonAddress}</p>
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                            <img 
                                src="https://www.showmetech.com.br/wp-content/uploads/2020/06/Google-Maps.jpg" 
                                alt="Mapa da localização do salão" 
                                className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                            />
                        </a>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!isPast && (
                <div className="fixed inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm p-2 rounded-2xl border border-gray-700 bg-gray-800/80 shadow-lg backdrop-blur-sm">
                    <div className="flex space-x-2">
                        {sanitizedWhatsapp && (
                            <a 
                                href={`https://wa.me/${sanitizedWhatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-500 transition-colors duration-300 flex items-center justify-center gap-2"
                            >
                                <WhatsAppIcon className="w-5 h-5" />
                                <span>WhatsApp</span>
                            </a>
                        )}
                        <button className="w-full bg-gray-700 text-white font-bold py-2 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                            Reagendar
                        </button>
                        <button className="w-full bg-red-800/50 text-red-400 border border-red-800 font-bold py-2 rounded-lg hover:bg-red-800/80 transition-colors duration-300">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentDetailScreen;