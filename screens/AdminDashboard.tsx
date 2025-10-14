import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useStock } from '../contexts/StockContext';
import { useClients } from '../contexts/ClientsContext';
import { useAuth } from '../contexts/AuthContext';
import { useRetouchAlerts } from '../hooks/useRetouchAlerts';
import Calendar from '../components/Calendar';
import { Appointment } from '../types';
import { usePackages } from '../contexts/PackagesContext';

// Icons
import ScissorsIcon from '../components/icons/ScissorsIcon';
import UsersIcon from '../components/icons/UsersIcon';
import CubeIcon from '../components/icons/CubeIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import CogIcon from '../components/icons/CogIcon';
import BottomNav from '../components/BottomNav';
import DashboardIcon from '../components/icons/DashboardIcon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import WarningIcon from '../components/icons/WarningIcon';
import LogoutIcon from '../components/icons/LogoutIcon';
import CakeIcon from '../components/icons/CakeIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import ArrowPathIcon from '../components/icons/ArrowPathIcon';
import ProfileIcon from '../components/icons/ProfileIcon';
import ClockIcon from '../components/icons/ClockIcon';
import PlusIcon from '../components/icons/PlusIcon';
import PersonalBookingModal from '../components/PersonalBookingModal';
import EllipsisVerticalIcon from '../components/icons/EllipsisVerticalIcon';
import GiftIcon from '../components/icons/GiftIcon';


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

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { appointments, addAdminAppointment, updateAppointment, deleteAppointment } = useAppointments();
    const { stockItems } = useStock();
    const { clients } = useClients();
    const { loggedInProfessional, logout } = useAuth();
    const { getUniqueClientAlerts } = useRetouchAlerts();
    const { useCredit, returnCredit } = usePackages();
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isPersonalBookingModalOpen, setIsPersonalBookingModalOpen] = useState(false);
    
    const [activeMenuAppointmentId, setActiveMenuAppointmentId] = useState<string | null>(null);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        }
    }, [loggedInProfessional, navigate]);
    
    const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Cliente';
    
    const handleEditClick = (app: Appointment) => {
        setAppointmentToEdit(app);
        setIsPersonalBookingModalOpen(true);
        setActiveMenuAppointmentId(null);
    };

    const handleDeleteClick = (app: Appointment) => {
        setAppointmentToDelete(app);
        setIsDeleteConfirmOpen(true);
        setActiveMenuAppointmentId(null);
    };

    const handleConfirmDelete = () => {
        if (appointmentToDelete) {
            // If the deleted appointment used a package, return the credit.
            if (appointmentToDelete.clientPackageId) {
                returnCredit(appointmentToDelete.clientPackageId);
            }
            deleteAppointment(appointmentToDelete.id);
        }
        setIsDeleteConfirmOpen(false);
        setAppointmentToDelete(null);
    };


    // Memoized appointments for the logged-in professional
    const appointmentsForProfessional = useMemo(() => {
        if (!loggedInProfessional) return [];
        return appointments.filter(app => app.professional.id === loggedInProfessional.id);
    }, [appointments, loggedInProfessional]);

    // Memoized appointments for the selected date
    const appointmentsForSelectedDate = useMemo(() => {
        const selectedDayString = selectedDate.toDateString();
        return appointmentsForProfessional
            .filter(app => new Date(app.date).toDateString() === selectedDayString)
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [appointmentsForProfessional, selectedDate]);
    
    const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'status'> & { id?: string }, packageToUseId?: string) => {
        if (appointmentData.id) { // This is an update
            const { id, ...updates } = appointmentData;
            const originalAppointment = appointments.find(app => app.id === id);
            
            // Handle package credit changes on edit
            if (originalAppointment?.clientPackageId && originalAppointment.clientPackageId !== packageToUseId) {
                returnCredit(originalAppointment.clientPackageId); // Return old credit
            }
            if (packageToUseId && originalAppointment?.clientPackageId !== packageToUseId) {
                useCredit(packageToUseId); // Use new credit
            }
            
            updateAppointment(id, updates as Partial<Omit<Appointment, 'id'>>);
            alert("Agendamento atualizado com sucesso!");
        } else { // This is a new appointment
            addAdminAppointment(appointmentData);
            if (packageToUseId) {
                useCredit(packageToUseId);
            }
            alert("Agendamento pessoal criado com sucesso!");
        }
        setIsPersonalBookingModalOpen(false);
        setAppointmentToEdit(null); // Clear editing state
    };
    
    const DeleteConfirmationModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => void;
        appointment: Appointment | null;
    }> = ({ isOpen, onClose, onConfirm, appointment }) => {
        if (!isOpen || !appointment) return null;

        return (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                    <p className="text-gray-300 mb-6">
                        Tem certeza que deseja apagar o agendamento de <span className="font-bold">{appointment.service.name}</span> para <span className="font-bold">{getClientName(appointment.clientId)}</span>? Esta ação não pode ser desfeita.
                    </p>
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

    const renderPaymentStatusBadge = (status: Appointment['paymentStatus']) => {
        switch (status) {
            case 'paid':
                return <span className="ml-2 text-xs font-bold bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full">PAGO</span>;
            case 'paid_with_package':
                return <span className="ml-2 text-xs font-bold bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><GiftIcon className="w-3 h-3"/>PACOTE</span>;
            case 'pending_package_purchase':
                 return <span className="ml-2 text-xs font-bold bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">COMPRAR PACOTE</span>;
            case 'pending':
            case 'not_applicable':
            default:
                return <span className="ml-2 text-xs font-bold bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">PENDENTE</span>;
        }
    };


    if (!loggedInProfessional) {
        return null; // Or a loading spinner while redirecting
    }

    // --- Rented Employee View ---
    if (loggedInProfessional.employmentType === 'rented') {
        const handleLogout = () => {
            logout();
            navigate('/');
        };
        const adminNavItems = [
             { path: '/admin', label: 'Agenda', icon: <CalendarIcon className="w-7 h-7" />, permission: 'Dashboard' },
             { path: `/admin/perfil/${loggedInProfessional.id}`, label: 'Meu Perfil', icon: <ProfileIcon className="w-7 h-7" />, permission: 'Meu Perfil' },
             { path: `/admin/perfil/${loggedInProfessional.id}/gestao-pessoal`, label: 'Gestão', icon: <CurrencyDollarIcon className="w-7 h-7" />, permission: 'Gestão Pessoal' },
        ];

        const rentedManagementLinks = [
            { label: 'Meu Caixa', icon: <CreditCardIcon className="w-6 h-6 text-gray-400" />, to: `/admin/perfil/${loggedInProfessional.id}/meu-caixa` },
            { label: 'Meu Estoque', icon: <CubeIcon className="w-6 h-6 text-gray-400" />, to: `/admin/perfil/${loggedInProfessional.id}/meu-estoque` },
            { label: 'Clientes do Salão', icon: <UserGroupIcon className="w-6 h-6 text-gray-400" />, to: '/admin/clientes' },
            { label: 'Minha Gestão Financeira', icon: <CurrencyDollarIcon className="w-6 h-6 text-gray-400" />, to: `/admin/perfil/${loggedInProfessional.id}/gestao-pessoal` },
        ];

        return (
            <div className="flex flex-col h-screen justify-between bg-black text-white" onClick={() => activeMenuAppointmentId && setActiveMenuAppointmentId(null)}>
                <div className="p-4 flex-grow overflow-y-auto pb-24">
                    <header className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-gray-400 text-sm">Bem-vindo,</p>
                            <h1 className="text-2xl font-bold">{loggedInProfessional.name}</h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                            aria-label="Sair"
                        >
                            <LogoutIcon className="w-6 h-6 text-gray-400" />
                        </button>
                    </header>

                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        disablePastDates={false}
                    />
                    
                    {/* Quick Management Links */}
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-3">Gerenciamento Rápido</h2>
                        <div className="space-y-2">
                            {rentedManagementLinks.map(item => (
                                <Link to={item.to} key={item.label} className="flex items-center bg-gray-900 p-4 rounded-lg hover:bg-gray-800 transition-colors">
                                    {item.icon}
                                    <div className="ml-4 flex-grow">
                                        <p className="font-semibold">{item.label}</p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-3">Agenda de {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</h2>
                        <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                            {appointmentsForSelectedDate.length > 0 ? (
                                appointmentsForSelectedDate.map(app => {
                                    const isCompleted = app.status === 'completed';
                                    return (
                                    <div key={app.id} className={`relative flex items-center gap-4 ${isCompleted ? 'opacity-60' : ''}`}>
                                        <div className={`flex items-center gap-2 w-24 ${isCompleted ? 'text-gray-600' : 'text-gray-300'}`}>
                                            <ClockIcon className="w-5 h-5"/>
                                            <span className={`font-semibold ${isCompleted ? 'line-through' : ''}`}>{app.time.split('/')[0].trim()}</span>
                                        </div>
                                        <div className="flex-grow">
                                            <p className={`font-semibold flex items-center ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                                {getClientName(app.clientId)}
                                                {renderPaymentStatusBadge(app.paymentStatus)}
                                            </p>
                                            <p className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-400'}`}>{app.service.name}</p>
                                        </div>
                                        <div className="relative ml-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuAppointmentId(app.id === activeMenuAppointmentId ? null : app.id); }}
                                                className="p-2 text-gray-400 rounded-full hover:bg-gray-800"
                                            >
                                                <EllipsisVerticalIcon className="w-5 h-5" />
                                            </button>
                                            {activeMenuAppointmentId === app.id && (
                                                <div className="absolute right-0 top-full mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => handleEditClick(app)} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Editar</button>
                                                    <button onClick={() => handleDeleteClick(app)} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Apagar</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 text-center py-4">Nenhum agendamento para este dia.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-24 right-6 z-20">
                    <button onClick={() => { setAppointmentToEdit(null); setIsPersonalBookingModalOpen(true); }} className="bg-gray-200 text-black rounded-full p-4 shadow-lg hover:bg-white transition-transform hover:scale-110">
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>

                {isPersonalBookingModalOpen && (
                    <PersonalBookingModal
                        isOpen={isPersonalBookingModalOpen}
                        onClose={() => {
                            setIsPersonalBookingModalOpen(false);
                            setAppointmentToEdit(null);
                        }}
                        onSave={handleSaveAppointment}
                        employee={loggedInProfessional}
                        appointmentToEdit={appointmentToEdit}
                        initialDate={selectedDate}
                    />
                )}
                
                <DeleteConfirmationModal 
                    isOpen={isDeleteConfirmOpen}
                    onClose={() => setIsDeleteConfirmOpen(false)}
                    onConfirm={handleConfirmDelete}
                    appointment={appointmentToDelete}
                />
                
                <BottomNav items={adminNavItems} />
            </div>
        );
    }
    
    // --- Data processing for non-rented employees ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsToday = appointments.filter(app => new Date(app.date).setHours(0,0,0,0) === today.getTime());
    
    const lowStockItemsCount = stockItems.filter(item => item.quantity < item.lowStockThreshold).length;

    const upcomingBirthdaysCount = clients.filter(client => {
        const days = getDaysUntilNextBirthday(client.birthdate);
        return days !== null && days >= 0 && days <= 15;
    }).length;

    const retouchAlertsCount = getUniqueClientAlerts(15).length;

    const ADMIN_NAV_DEFINITIONS = [
        { path: '/admin', label: 'Dashboard', icon: <DashboardIcon className="w-7 h-7" />, permission: 'Dashboard' },
        { path: '/admin/caixa', label: 'Caixa', icon: <CreditCardIcon className="w-7 h-7" />, permission: 'Caixa' },
        { path: '/admin/servicos', label: 'Agenda', icon: <CalendarIcon className="w-7 h-7" />, permission: 'Agenda de Serviços' },
        { path: '/admin/clientes', label: 'Clientes', icon: <UserGroupIcon className="w-7 h-7" />, permission: 'Clientes' },
        { path: '/admin/funcionarios', label: 'Funcionários', icon: <UsersIcon className="w-7 h-7" />, permission: 'Funcionários' },
        { path: '/admin/estoque', label: 'Estoque', icon: <CubeIcon className="w-7 h-7" />, permission: 'Estoque' },
        { path: '/admin/gestao', label: 'Gestão', icon: <CurrencyDollarIcon className="w-7 h-7" />, permission: 'Gestão Financeira' },
        { path: '/admin/meu-salao', label: 'Salão', icon: <CogIcon className="w-7 h-7" />, permission: 'Meu Salão' },
    ];
    
    let adminNavItems;
    const userPermissions = loggedInProfessional.permissions || [];

    if (loggedInProfessional.toolbarItems && loggedInProfessional.toolbarItems.length > 0) {
        const dashboardItem = ADMIN_NAV_DEFINITIONS.find(item => item.permission === 'Dashboard')!;
        const customItems = loggedInProfessional.toolbarItems
            .map(permission => ADMIN_NAV_DEFINITIONS.find(item => item.permission === permission))
            .filter((item): item is typeof item & {} => !!item);
        
        adminNavItems = [dashboardItem, ...customItems];
    } else {
        // Fallback to old logic
        const defaultPermissions = ['Dashboard', 'Caixa', 'Agenda de Serviços', 'Clientes'];
        adminNavItems = ADMIN_NAV_DEFINITIONS
            .filter(item => defaultPermissions.includes(item.permission)) // to keep the old set of items
            .filter(item => item.permission === 'Dashboard' || userPermissions.includes(item.permission));
    }


    const clientNotifications: string[] = [];
    if (upcomingBirthdaysCount > 0) clientNotifications.push(`${upcomingBirthdaysCount} aniversário(s)`);
    if (retouchAlertsCount > 0) clientNotifications.push(`${retouchAlertsCount} retoque(s)`);
    
    const allManagementLinks = [
        { label: 'Caixa', icon: <CreditCardIcon className="w-6 h-6 text-gray-400" />, path: '/admin/caixa', notification: null },
        { label: 'Agenda de Serviços', icon: <ScissorsIcon className="w-6 h-6 text-gray-400" />, path: '/admin/servicos', notification: null },
        { label: 'Funcionários', icon: <UsersIcon className="w-6 h-6 text-gray-400" />, path: '/admin/funcionarios', notification: null },
        { label: 'Clientes', icon: <UserGroupIcon className="w-6 h-6 text-gray-400" />, path: '/admin/clientes', notification: clientNotifications.join(' | ') || null },
        { label: 'Estoque', icon: <CubeIcon className="w-6 h-6 text-gray-400" />, path: '/admin/estoque', notification: lowStockItemsCount > 0 ? `${lowStockItemsCount} item(s) em baixa` : null },
        { label: 'Gestão Financeira', icon: <CurrencyDollarIcon className="w-6 h-6 text-gray-400" />, path: '/admin/gestao', notification: null },
        { label: 'Meu Perfil', icon: <ProfileIcon className="w-6 h-6 text-gray-400" />, path: `/admin/perfil/${loggedInProfessional.id}`, notification: null },
        { label: 'Meu Salão', icon: <CogIcon className="w-6 h-6 text-gray-400" />, path: '/admin/meu-salao', notification: null },
    ];

    const managementLinks = allManagementLinks.filter(link => userPermissions.includes(link.label) || link.label === 'Meu Perfil');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="flex flex-col h-screen justify-between bg-black text-white">
            <div className="p-4 flex-grow overflow-y-auto pb-24">
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-gray-400 text-sm">Bem-vindo de volta,</p>
                        <h1 className="text-2xl font-bold">{loggedInProfessional.name}</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                        aria-label="Sair"
                    >
                        <LogoutIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Agendamentos Hoje</p>
                        <p className="text-2xl font-bold">{appointmentsToday.length}</p>
                    </div>
                     <div className="bg-gray-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Aniversários Próximos</p>
                        <p className={`text-2xl font-bold ${upcomingBirthdaysCount > 0 ? 'text-red-500' : ''}`}>{upcomingBirthdaysCount}</p>
                    </div>
                     <div className="bg-gray-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Retoques Próximos</p>
                        <p className={`text-2xl font-bold ${retouchAlertsCount > 0 ? 'text-red-500' : ''}`}>{retouchAlertsCount}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Estoque Baixo</p>
                        <p className={`text-2xl font-bold ${lowStockItemsCount > 0 ? 'text-red-500' : ''}`}>{lowStockItemsCount}</p>
                    </div>
                </div>

                {/* Today's Agenda */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-3">Agenda de Hoje</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                        {appointmentsToday.length > 0 ? appointmentsToday.slice(0, 3).map(app => (
                            <div key={app.id} className="flex items-center">
                                <span className="font-semibold text-gray-300 w-16">{app.time}</span>
                                <div className="flex-grow">
                                    <p>{app.service.name}</p>
                                    <p className="text-sm text-gray-400">{getClientName(app.clientId)}</p>
                                </div>
                                <img src={app.professional.avatarUrl} alt={app.professional.name} className="w-8 h-8 rounded-full ml-2" />
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">Nenhum agendamento para hoje.</p>
                        )}
                        <Link to="/admin/servicos" className="block text-center w-full text-gray-300 font-semibold py-2 mt-2 rounded-lg hover:bg-gray-800 transition-colors">
                            Ver agenda completa
                        </Link>
                    </div>
                </div>

                {/* Management Links */}
                <div>
                     <h2 className="text-lg font-semibold mb-3">Gerenciamento</h2>
                     <div className="space-y-2">
                        {managementLinks.map(item => (
                             <Link to={item.path} key={item.label} className="flex items-center bg-gray-900 p-4 rounded-lg hover:bg-gray-800 transition-colors">
                                {item.icon}
                                <div className="ml-4 flex-grow">
                                    <p className="font-semibold">{item.label}</p>
                                    {item.notification && (
                                        <div className="flex items-center mt-1">
                                            {item.label === 'Estoque' && <WarningIcon className="w-4 h-4 text-red-500 mr-1" />}
                                            {item.label === 'Clientes' && (
                                                <>
                                                    {upcomingBirthdaysCount > 0 && <CakeIcon className="w-4 h-4 text-red-500 mr-1" />}
                                                    {retouchAlertsCount > 0 && <ArrowPathIcon className="w-4 h-4 text-red-500 ml-1 mr-1" />}
                                                </>
                                            )}
                                            <p className={`text-xs ${item.label === 'Estoque' || item.label === 'Clientes' ? 'text-red-400' : 'text-gray-400'}`}>{item.notification}</p>
                                        </div>
                                    )}
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                            </Link>
                        ))}
                     </div>
                </div>

            </div>
            <BottomNav items={adminNavItems} />
        </div>
    );
};

export default AdminDashboard;