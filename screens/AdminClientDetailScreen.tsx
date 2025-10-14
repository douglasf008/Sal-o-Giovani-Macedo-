import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../contexts/ClientsContext';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { useAppointments } from '../contexts/AppointmentsContext';
import EyeIcon from '../components/icons/EyeIcon';
import EyeSlashIcon from '../components/icons/EyeSlashIcon';
import { useSalonSettings } from '../salonSettings';
import PasswordRevealModal from '../components/PasswordRevealModal';
import CakeIcon from '../components/icons/CakeIcon';
import CameraIcon from '../components/icons/CameraIcon';
import AdminChangeAvatarModal from '../components/AdminChangeAvatarModal';
import { useRetouchAlerts } from '../hooks/useRetouchAlerts';
import ArrowPathIcon from '../components/icons/ArrowPathIcon';
import { useAuth } from '../contexts/AuthContext';
import { usePackages } from '../contexts/PackagesContext';
import GiftIcon from '../components/icons/GiftIcon';

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    clientName: string;
}> = ({ isOpen, onClose, onConfirm, clientName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                <p className="text-gray-300 mb-6">Tem certeza que deseja apagar o cliente <span className="font-bold">{clientName}</span>? Todos os agendamentos associados serão perdidos. Esta ação não pode ser desfeita.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                        Apagar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface MaskedInfoProps {
    value: string;
    mask: (v: string) => string;
    isVisible: boolean;
    onRevealRequest: () => void;
}

const MaskedInfo: React.FC<MaskedInfoProps> = ({ value, mask, isVisible, onRevealRequest }) => {
    const displayValue = isVisible ? value : mask(value);
    
    return (
        <div className="flex items-center space-x-2 text-gray-400">
            <span>{displayValue}</span>
            <button onClick={onRevealRequest} className="focus:outline-none" aria-label={isVisible ? 'Ocultar' : 'Mostrar'}>
                {isVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>
    )
}

const maskEmail = (email: string) => {
    if (!email.includes('@')) return '****';
    const [user, domain] = email.split('@');
    return `${user.substring(0, 1)}****@${domain}`;
};

const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 5) return '****';
    return `(${digits.substring(0,2)}) ****-${digits.substring(digits.length - 4)}`;
};

const getDaysUntilNextBirthday = (birthdateStr?: string): number | null => {
  if (!birthdateStr) return null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = birthdateStr.split('-').map(Number);
    if (!year || !month || !day) return null;

    const birthDateThisYear = new Date(today.getFullYear(), month - 1, day);
    birthDateThisYear.setHours(0, 0, 0, 0);

    let nextBirthday = birthDateThisYear;
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (e) {
    console.error("Error parsing birthdate", e);
    return null;
  }
};


const AdminClientDetailScreen: React.FC = () => {
    const navigate = useNavigate();
    const { clientId } = useParams<{ clientId: string }>();
    const { appointments, deleteAppointmentsByClientId } = useAppointments();
    const { clients, updateClient, deleteClient } = useClients();
    const { settings } = useSalonSettings();
    const { getAlertsForClient } = useRetouchAlerts();
    const { loggedInProfessional } = useAuth();
    const { getPackagesForClient } = usePackages();

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isEmailVisible, setIsEmailVisible] = useState(false);
    const [isPhoneVisible, setIsPhoneVisible] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [revealCallback, setRevealCallback] = useState<(() => void) | null>(null);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        } else if (!loggedInProfessional.permissions?.includes('Clientes')) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate]);

    const client = useMemo(() => clients.find(c => c.id === clientId), [clientId, clients]);
    
    const sortedClientPackages = useMemo(() => {
        if (!client) return [];
        
        const packages = getPackagesForClient(client.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return [...packages].sort((a, b) => {
            const aIsExpired = new Date(a.expiryDate) < today;
            const aIsActive = a.creditsRemaining > 0 && !aIsExpired;

            const bIsExpired = new Date(b.expiryDate) < today;
            const bIsActive = b.creditsRemaining > 0 && !bIsExpired;

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;

            return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        });
    }, [client, getPackagesForClient]);

    const daysUntilBirthday = getDaysUntilNextBirthday(client?.birthdate);
    const isBirthdaySoon = daysUntilBirthday !== null && daysUntilBirthday <= 15;
    const clientRetouchAlerts = client ? getAlertsForClient(client.id, 15) : [];
    
    useEffect(() => {
        if (isEmailVisible) {
            const timer = setTimeout(() => setIsEmailVisible(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [isEmailVisible]);

    useEffect(() => {
        if (isPhoneVisible) {
            const timer = setTimeout(() => setIsPhoneVisible(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [isPhoneVisible]);

    const requestReveal = (revealFunction: () => void) => {
        if (!settings.privacyPassword) {
            revealFunction();
            return;
        }
        setRevealCallback(() => revealFunction);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = (password: string) => {
        if (password === settings.privacyPassword) {
            revealCallback?.();
            setIsPasswordModalOpen(false);
        } else {
            alert('Senha incorreta!');
        }
    };

    const clientAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return appointments
            .filter(a => 
                a.clientId === clientId && 
                (a.status === 'completed' || new Date(a.date) < today)
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time))
            .slice(0, 7);
    }, [clientId, appointments]);


    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      if (client) {
        setNotes(client.notes || '');
      }
    }, [client]);

    if (!loggedInProfessional || !loggedInProfessional.permissions?.includes('Clientes')) {
        return null;
    }

    if (!client) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <p>Cliente não encontrado.</p>
            </div>
        );
    }
    
    const handleSaveNotes = async () => {
        setIsSaving(true);
        if (client) {
            try {
                await updateClient({ ...client, notes });
                alert('Anotações salvas!');
            } catch (error) {
                console.error("Error saving notes:", error);
                alert("Erro ao salvar anotações.");
            }
        }
        setIsSaving(false);
    };

    const handleDeleteClient = async () => {
        if (!client) return;
        try {
            deleteAppointmentsByClientId(client.id);
            await deleteClient(client.id);
            navigate('/admin/clientes');
        } catch (error) {
            console.error("Failed to delete client:", error);
            alert("Erro ao apagar o cliente.");
        }
    };

    const handleAvatarSave = async (newAvatarUrl: string) => {
        if (client) {
            try {
                await updateClient({ ...client, avatarUrl: newAvatarUrl });
            } catch (error) {
                console.error("Failed to update avatar:", error);
                alert("Erro ao atualizar a foto.");
            }
        }
        setIsAvatarModalOpen(false);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatBirthdate = (birthdateStr?: string): string => {
        if (!birthdateStr) return 'Não informado';
        try {
            const [year, month, day] = birthdateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
        } catch {
            return 'Data inválida';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 border-b border-gray-800 sticky top-0 bg-black z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">{client.name}</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <div className="flex-grow overflow-y-auto">
                {clientRetouchAlerts.length > 0 && (
                    <div className="p-4">
                        <div className="bg-blue-900/50 border border-blue-700 text-blue-300 p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-3">
                                <ArrowPathIcon className="w-6 h-6 flex-shrink-0" />
                                <h3 className="font-bold text-lg">Lembrete de Retoque</h3>
                            </div>
                            {clientRetouchAlerts.map(alert => (
                                <div key={alert.service.id} className="text-sm">
                                    <p>
                                        <span className="font-semibold text-white">{alert.service.name}</span>: 
                                        {alert.daysUntilDue <= 0 
                                            ? ` Venceu há ${Math.abs(alert.daysUntilDue)} dia(s).` 
                                            : ` Vence em ${alert.daysUntilDue} dia(s).`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="p-4 pt-0 space-y-8">
                    {/* Client Info */}
                    <section className="flex flex-col items-center text-center">
                        <div className="relative">
                            <img src={client.avatarUrl} alt={client.name} className="w-24 h-24 rounded-full border-4 border-gray-700 object-cover" />
                            <button 
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center border-2 border-black hover:bg-white"
                                aria-label="Alterar foto do perfil"
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold mt-4">{client.name}</h2>
                        {client.email && <MaskedInfo value={client.email} mask={maskEmail} isVisible={isEmailVisible} onRevealRequest={() => requestReveal(() => setIsEmailVisible(true))} />}
                        {client.phone && <MaskedInfo value={client.phone} mask={maskPhone} isVisible={isPhoneVisible} onRevealRequest={() => requestReveal(() => setIsPhoneVisible(true))} />}
                        <div className="mt-2 flex items-center gap-2 text-gray-400">
                            <CakeIcon className="w-5 h-5"/>
                            <span>{formatBirthdate(client.birthdate)}</span>
                        </div>
                        {isBirthdaySoon && (
                            <div className="mt-2 text-red-400 font-bold animate-pulse">
                                {daysUntilBirthday === 0 ? 'Aniversário é Hoje!' : `Aniversário em ${daysUntilBirthday} dia(s)!`}
                            </div>
                        )}
                    </section>

                    {/* Active Packages */}
                    {sortedClientPackages.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-3">Pacotes do Cliente</h3>
                            <div className="space-y-3">
                                {sortedClientPackages.map(pkg => {
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
                                        <div key={pkg.id} className={`bg-gray-900 p-4 rounded-lg border-l-4 ${borderColor} ${!isActive ? 'opacity-70' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="font-bold">{pkg.template?.name}</h2>
                                                    <p className="text-xs text-gray-400">Validade: {new Date(pkg.expiryDate).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-4">
                                                    <p className="font-bold text-xl">{pkg.creditsRemaining}</p>
                                                    <p className="text-xs text-gray-500">Créditos</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end items-center">
                                                <span className={`font-semibold px-3 py-1 rounded-full text-xs ${statusColor}`}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2 text-gray-300">Histórico de Uso</h4>
                                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                                    {usageHistory.length > 0 ? usageHistory.map(app => (
                                                        <div key={app.id} className={`flex justify-between items-center text-xs p-2 rounded-md ${app.status === 'canceled_late' ? 'bg-red-900/40' : 'bg-gray-800'}`}>
                                                            <span>{new Date(app.date).toLocaleDateString('pt-BR')} com {app.professional.name}</span>
                                                            <span className={`font-semibold px-2 py-0.5 rounded-full ${
                                                                app.status === 'completed' ? 'text-green-300 bg-green-900/50' :
                                                                app.status === 'canceled_late' ? 'text-red-300 bg-red-900/80' :
                                                                'text-yellow-300 bg-yellow-900/50'
                                                            }`}>
                                                                {app.status === 'completed' ? 'Utilizado' : app.status === 'canceled_late' ? 'Perdido' : 'Agendado'}
                                                            </span>
                                                        </div>
                                                    )) : <p className="text-xs text-gray-500 text-center">Nenhuma sessão utilizada ainda.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}


                    {/* Last Services */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3">Últimos Serviços</h3>
                        <div className="space-y-3">
                            {clientAppointments.length > 0 ? clientAppointments.map(app => (
                                <div key={app.id} className="bg-gray-900 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{app.service.name}</p>
                                            <p className="text-sm text-gray-400">com {app.professional.name}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="font-semibold text-sm">{formatDate(app.date)}</p>
                                            <p className="text-sm text-gray-400">{app.time}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 bg-gray-900 rounded-lg">
                                    <p className="text-gray-500">Nenhum serviço registrado.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3">Anotações</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Adicione anotações sobre o cliente..."
                        />
                        <button
                            onClick={handleSaveNotes}
                            disabled={isSaving}
                            className="mt-4 w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Anotações'}
                        </button>
                        <button
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            className="mt-4 w-full text-red-500 font-bold py-3 rounded-lg text-lg hover:bg-red-500/10 transition-colors duration-300"
                        >
                            Apagar Cliente
                        </button>
                    </section>
                </div>
            </div>
            {client && <DeleteConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDeleteClient}
                clientName={client.name}
            />}
            <PasswordRevealModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />
             {client && (
                <AdminChangeAvatarModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onSave={handleAvatarSave}
                    client={client}
                />
            )}
        </div>
    );
};

export default AdminClientDetailScreen;