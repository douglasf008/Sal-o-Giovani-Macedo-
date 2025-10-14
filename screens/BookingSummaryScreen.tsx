import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Service, Professional, ServicePackageTemplate } from '../types';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import ScissorsIcon from '../components/icons/ScissorsIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import { useAppointments } from '../contexts/AppointmentsContext';
import PaymentModal from '../components/PaymentModal';
import { usePayment } from '../contexts/PaymentContext';
import { useFinancials } from '../contexts/FinancialsContext';
import { useSalonSettings } from '../salonSettings';
import { usePackages } from '../contexts/PackagesContext';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import { useAuth } from '../contexts/AuthContext';

const BookingSummaryScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { state } = location;
    const { addAppointment } = useAppointments();
    const { processPayment } = usePayment();
    const { settings: financialSettings } = useFinancials();
    const { settings: salonSettings } = useSalonSettings();
    const { useCredit, buyPackage, clientPackages } = usePackages();
    const { professionals: allProfessionals } = useProfessionals();
    const { currentClient } = useAuth();
    const clientId = currentClient?.id;
    
    if (!state) {
        return (
            <div className="p-4 text-center">
                <p>Nenhum detalhe de agendamento encontrado.</p>
                <button onClick={() => navigate('/agendar')} className="mt-4 text-blue-400">Voltar</button>
            </div>
        );
    }
    
    const { services, professional, date, time, clientPackageId, packageToPurchase } = state as { services: Service[], professional?: Professional | null, date: string | null, time: string | null, clientPackageId?: string, packageToPurchase?: ServicePackageTemplate };
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(professional || null);
    const [isChangingProfessional, setIsChangingProfessional] = useState(false);
    
    const isPurchaseOnly = !!(packageToPurchase && !time);

    const availableProfessionals = useMemo(() => {
        if (!services || services.length === 0) return [];

        if (clientPackageId) {
            const clientPackage = clientPackages.find(p => p.id === clientPackageId);
            if (clientPackage) {
                const templateId = clientPackage.packageTemplateId;
                const serviceId = services[0].id;

                const professionalsForPackage = allProfessionals.filter(p => 
                    p.packageTemplateIds?.includes(templateId)
                );
                
                const professionalsForService = allProfessionals.filter(p =>
                    p.serviceIds.includes(serviceId)
                );
                
                const combined = [...professionalsForPackage, ...professionalsForService];
                const uniqueProfessionalIds = new Set(combined.map(p => p.id));
                
                return Array.from(uniqueProfessionalIds).map(id => combined.find(p => p.id === id)!);
            }
        }
        
        const serviceIds = services.map(s => s.id);
        return allProfessionals.filter(p => serviceIds.every(sId => p.serviceIds.includes(sId)));
    }, [services, allProfessionals, clientPackageId, clientPackages]);

    const appointmentDate = date ? new Date(date) : null;
    const formattedDate = appointmentDate?.toLocaleString('pt-BR', { day: 'numeric', month: 'long' });
    const isBuyingPackage = !!packageToPurchase;
    const totalPrice = isBuyingPackage ? packageToPurchase.price : services.reduce((total, s) => total + s.price, 0);

    const timeSlots = time ? time.split(' / ').filter(t => t.trim() !== '') : [];
    const startTime = timeSlots[0];
    let endTime = startTime;

    if (timeSlots.length > 1) {
        const lastSlotTime = timeSlots[timeSlots.length - 1];
        const [h, m] = lastSlotTime.split(':').map(Number);
        const endDateTemp = new Date();
        endDateTemp.setHours(h, m + 30); // Assuming 30-min slots
        endTime = endDateTemp.toTimeString().substring(0, 5);
    }
    
    const displayTime = timeSlots.length > 1 ? `${startTime} - ${endTime}` : startTime;

    const handleConfirm = (paymentStatus: 'paid' | 'pending', transactionId?: string) => {
        if (!clientId) {
            alert("Erro: cliente não identificado. Faça o login novamente.");
            navigate('/login');
            return;
        }

        if (isPurchaseOnly && packageToPurchase) {
            if (paymentStatus === 'paid') {
                buyPackage(clientId, packageToPurchase.id);
                alert('Pacote comprado com sucesso! Você pode agendar sua primeira sessão a qualquer momento.');
                navigate('/pacotes');
            }
            return;
        }

        if (!appointmentDate || !time || !selectedProfessional) {
            alert("Erro: informações de agendamento ausentes.");
            return;
        }

        if (isBuyingPackage && packageToPurchase) {
            if (paymentStatus === 'paid') {
                const newClientPackage = buyPackage(clientId, packageToPurchase.id);
                addAppointment({
                    service: services[0],
                    professional: selectedProfessional,
                    date: appointmentDate,
                    time,
                    paymentStatus: 'paid_with_package',
                    clientPackageId: newClientPackage.id,
                    transactionId,
                    ownerId: services[0].ownerId,
                    clientId: clientId,
                });
                useCredit(newClientPackage.id);
                alert('Pacote comprado e agendamento da primeira sessão realizado com sucesso!');
                navigate('/agendamentos');
            } else {
                addAppointment({
                    service: services[0],
                    professional: selectedProfessional,
                    date: appointmentDate,
                    time,
                    paymentStatus: 'pending_package_purchase',
                    pendingPackagePurchaseId: packageToPurchase.id,
                    ownerId: services[0].ownerId,
                    clientId: clientId,
                });
                alert('Agendamento confirmado! O pagamento do pacote será realizado no salão.');
                navigate('/agendamentos');
            }
        } else {
            services.forEach(service => {
                addAppointment({
                    service,
                    professional: selectedProfessional,
                    date: appointmentDate,
                    time,
                    paymentStatus,
                    transactionId,
                    ownerId: service.ownerId,
                    clientId: clientId,
                });
            });
            alert(paymentStatus === 'paid' ? 'Pagamento confirmado e agendamento realizado com sucesso!' : 'Agendamento confirmado! O pagamento será realizado no salão.');
            navigate('/agendamentos');
        }
    };

    const handlePaymentSuccess = (transactionId: string) => {
        handleConfirm('paid', transactionId);
        setIsPaymentModalOpen(false);
    };

    const handleConfirmBookingWithoutPayment = () => {
        handleConfirm('pending');
    };

    const handleConfirmBookingWithPackage = () => {
        if (!clientPackageId || !appointmentDate || !time || !selectedProfessional || !clientId) return;
    
        services.forEach(service => {
            addAppointment({
                service,
                professional: selectedProfessional,
                date: appointmentDate,
                time,
                paymentStatus: 'paid_with_package',
                clientPackageId: clientPackageId,
                ownerId: service.ownerId,
                clientId: clientId,
            });
        });
    
        useCredit(clientPackageId);
    
        alert('Agendamento confirmado com seu pacote!');
        navigate('/agendamentos');
    };

    return (
        <div className="bg-black text-white min-h-screen">
            <div className="p-4 pb-60">
                <header className="flex items-center mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                    <h1 className="text-xl font-bold mx-auto">{isPurchaseOnly ? 'Resumo da Compra' : 'Resumo do Agendamento'}</h1>
                </header>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{isPurchaseOnly ? 'Detalhes da Compra' : 'Detalhes do Agendamento'}</h2>
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="flex items-start pb-4">
                            <ScissorsIcon className="w-6 h-6 mr-4 text-gray-400 mt-1" />
                            <div className="flex-grow">
                                <p className="text-sm text-gray-400 mb-2">Serviço(s)</p>
                                <div className="space-y-2">
                                     {isBuyingPackage && packageToPurchase ? (
                                        <>
                                            <div className="flex justify-between">
                                                <p>Compra de Pacote: {packageToPurchase.name}</p>
                                                <p className="text-gray-300">R$ {packageToPurchase.price.toFixed(2).replace('.',',')}</p>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-400">
                                                <p>+ {packageToPurchase.sessionCount} sessões de {services[0].name}</p>
                                                <p>Inclusas</p>
                                            </div>
                                        </>
                                    ) : (
                                        services.map(s => (
                                            <div key={s.id} className="flex justify-between">
                                                <p>{s.name}</p>
                                                {!clientPackageId && (
                                                    <p className="text-gray-300">R$ {s.price.toFixed(2).replace('.',',')}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 py-4 flex justify-between items-center font-bold">
                            <span>Total</span>
                            {clientPackageId ? (
                                <span className="text-blue-400">1 crédito do pacote</span>
                            ) : (
                                <span>R$ {totalPrice.toFixed(2).replace('.',',')}</span>
                            )}
                        </div>

                        <div className="border-t border-gray-800 pt-4 space-y-4">
                            {isPurchaseOnly ? (
                                <div className="text-center p-4 bg-gray-800 rounded-lg">
                                    <p className="font-semibold text-yellow-300">Apenas compra de pacote.</p>
                                    <p className="text-sm text-gray-400">Nenhum horário foi selecionado. O pacote estará disponível em seu perfil para agendamentos futuros.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center">
                                        <CalendarIcon className="w-6 h-6 mr-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-400">Data e Hora</p>
                                            <p>{formattedDate}, {displayTime}</p>
                                        </div>
                                    </div>
                                    {selectedProfessional && (
                                    <div className="flex items-center">
                                         <img src={selectedProfessional.avatarUrl} alt={selectedProfessional.name} className="w-8 h-8 rounded-full mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-400">Profissional</p>
                                            <p>{selectedProfessional.name}</p>
                                        </div>
                                        <button onClick={() => setIsChangingProfessional(prev => !prev)} className="ml-auto text-sm text-blue-400 font-semibold hover:text-blue-300">
                                            {isChangingProfessional ? 'Fechar' : 'Trocar'}
                                        </button>
                                    </div>
                                    )}
                                    {isChangingProfessional && (
                                        <div className="bg-gray-800 p-4 rounded-lg mt-2 space-y-2">
                                            <h3 className="font-semibold text-gray-300 mb-2">Escolha outro profissional</h3>
                                            {availableProfessionals.map(prof => (
                                                <button
                                                    key={prof.id}
                                                    onClick={() => {
                                                        setSelectedProfessional(prof);
                                                        setIsChangingProfessional(false);
                                                    }}
                                                    className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors ${
                                                        selectedProfessional?.id === prof.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <img src={prof.avatarUrl} alt={prof.name} className="w-8 h-8 rounded-full" />
                                                    <span>{prof.name}</span>
                                                </button>
                                            ))}
                                            {availableProfessionals.length === 0 && (
                                                <p className="text-sm text-center text-gray-500 py-2">Nenhum outro profissional disponível para este serviço.</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-24 mx-auto w-[calc(100%-2rem)] max-w-sm">
                 {clientPackageId ? (
                    <button 
                        onClick={handleConfirmBookingWithPackage}
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-2xl text-lg hover:bg-white transition-colors duration-300 shadow-lg">
                        Confirmar Agendamento
                    </button>
                 ) : isPurchaseOnly ? (
                    <div className="space-y-3">
                        <button 
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full bg-gray-200 text-black font-bold py-3 rounded-2xl text-lg hover:bg-white transition-colors duration-300 shadow-lg">
                            {`Pagar Pacote R$ ${totalPrice.toFixed(2).replace('.', ',')}`}
                        </button>
                        <p className="text-xs text-center text-gray-500">
                            Para comprar o pacote sem agendar, o pagamento online é necessário. Para pagar no salão, volte e selecione um horário.
                        </p>
                    </div>
                ) : salonSettings.onlinePaymentsEnabled ? (
                    <div className="space-y-3">
                        <button 
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full bg-gray-200 text-black font-bold py-3 rounded-2xl text-lg hover:bg-white transition-colors duration-300 shadow-lg">
                            {isBuyingPackage ? `Pagar Pacote` : 'Pagar Online'}
                        </button>
                        <button 
                            onClick={handleConfirmBookingWithoutPayment}
                            className="w-full bg-gray-800 text-white font-bold py-3 rounded-2xl text-lg hover:bg-gray-700 transition-colors duration-300 shadow-lg border border-gray-700">
                            Pagar no Salão
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleConfirmBookingWithoutPayment}
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-2xl text-lg hover:bg-white transition-colors duration-300 shadow-lg">
                        Confirmar Agendamento
                    </button>
                )}
            </div>
            
            {!clientPackageId && salonSettings.onlinePaymentsEnabled && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    amount={totalPrice}
                    onPaymentSuccess={handlePaymentSuccess}
                    maxInstallments={financialSettings.maxInstallments}
                    acceptsDebit={financialSettings.acceptsDebit}
                    minInstallmentValue={financialSettings.minInstallmentValue}
                />
            )}
        </div>
    );
};

export default BookingSummaryScreen;