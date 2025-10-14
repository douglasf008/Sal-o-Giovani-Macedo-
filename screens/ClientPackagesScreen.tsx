import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePackages } from '../contexts/PackagesContext';
import { useAppointments } from '../contexts/AppointmentsContext';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import GiftIcon from '../components/icons/GiftIcon';

const ClientPackagesScreen: React.FC = () => {
    const navigate = useNavigate();
    const { getPackagesForClient } = usePackages();
    const { appointments } = useAppointments();

    // Mocking current user as client 'c1'
    const MOCKED_CLIENT_ID = 'c1';

    const clientPackages = getPackagesForClient(MOCKED_CLIENT_ID);

    const sortedPackages = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return [...clientPackages].sort((a, b) => {
            const aIsExpired = new Date(a.expiryDate) < today;
            const aIsActive = a.creditsRemaining > 0 && !aIsExpired;

            const bIsExpired = new Date(b.expiryDate) < today;
            const bIsActive = b.creditsRemaining > 0 && !bIsExpired;

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;

            return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        });
    }, [clientPackages]);

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Meus Pacotes</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-6">
                {sortedPackages.length > 0 ? (
                    sortedPackages.map(pkg => {
                        const usageHistory = appointments.filter(app => app.clientPackageId === pkg.id);
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const isExpired = new Date(pkg.expiryDate) < today;
                        const hasCredits = pkg.creditsRemaining > 0;
                        const isActive = hasCredits && !isExpired;
                        
                        let statusText = 'Ativo';
                        let statusColor = 'bg-blue-900/50 text-blue-300';
                        let borderColor = 'border-blue-500';

                        if (isExpired) {
                            statusText = 'Expirado';
                            statusColor = 'bg-red-900/50 text-red-300';
                            borderColor = 'border-red-500';
                        } else if (!hasCredits) {
                            statusText = 'Esgotado';
                            statusColor = 'bg-gray-700 text-gray-400';
                            borderColor = 'border-gray-600';
                        }


                        return (
                            <div key={pkg.id} className={`bg-gray-900 p-5 rounded-lg border-l-4 ${borderColor} ${!isActive ? 'opacity-70' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold">{pkg.template?.name}</h2>
                                        <p className="text-sm text-gray-400">Serviço: {pkg.template?.name.split(' ').slice(1).join(' ')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{pkg.creditsRemaining} <span className="text-base font-normal text-gray-300">Sessões</span></p>
                                        <p className="text-xs text-gray-500">Restantes</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-sm text-gray-300">
                                    <p>Validade: <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-white'}`}>{new Date(pkg.expiryDate).toLocaleDateString('pt-BR')}</span></p>
                                    <span className={`font-semibold px-3 py-1 rounded-full text-xs ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <h3 className="text-md font-semibold mb-2">Histórico de Uso</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {usageHistory.length > 0 ? usageHistory.map(app => (
                                            <div key={app.id} className={`flex justify-between items-center text-xs p-2 rounded-md ${app.status === 'canceled_late' ? 'bg-red-900/40' : 'bg-gray-800'}`}>
                                                <span>{new Date(app.date).toLocaleDateString('pt-BR')} com {app.professional.name}</span>
                                                <span className={`font-semibold px-2 py-0.5 rounded-full ${
                                                    app.status === 'completed' ? 'text-green-300 bg-green-900/50' :
                                                    app.status === 'canceled_late' ? 'text-red-300 bg-red-900/80' :
                                                    'text-yellow-300 bg-yellow-900/50'
                                                }`}>
                                                    {app.status === 'completed' ? 'Utilizado' : app.status === 'canceled_late' ? 'Perdido (Cancel. Tardio)' : 'Agendado'}
                                                </span>
                                            </div>
                                        )) : <p className="text-xs text-gray-500 text-center">Nenhuma sessão utilizada ainda.</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <GiftIcon className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Você não possui pacotes.</h2>
                        <p>Pacotes de serviços oferecem um ótimo custo-benefício. Compre no salão!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientPackagesScreen;