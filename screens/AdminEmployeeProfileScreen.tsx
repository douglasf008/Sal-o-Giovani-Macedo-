import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Icons
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import VerifiedIcon from '../components/icons/VerifiedIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import PencilIcon from '../components/icons/PencilIcon';
import KeyIcon from '../components/icons/KeyIcon';
import CameraIcon from '../components/icons/CameraIcon';
import DashboardIcon from '../components/icons/DashboardIcon';

// Hooks & Contexts
import { useProfessionals } from '../contexts/ProfessionalsContext';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useServices } from '../contexts/ServicesContext';
import { Service, Client, Professional } from '../types';
import ChangeEmployeePasswordModal from '../components/ChangeEmployeePasswordModal';
import { useAuth } from '../contexts/AuthContext';
import AdminChangeAvatarModal from '../components/AdminChangeAvatarModal';
import { useFinancials } from '../contexts/FinancialsContext';
import { useSalesHistory } from '../contexts/SalesHistoryContext';

const getProfessionalSpecialties = (serviceIds: string[], allServices: Service[]): string => {
    const categories = serviceIds.map(id => {
        const service = allServices.find(s => s.id === id);
        return service ? service.category : '';
    });
    const uniqueCategories = [...new Set(categories)].filter(Boolean);
    if (uniqueCategories.includes('Corte') && uniqueCategories.includes('Coloração')) {
        return 'Cabeleireiro';
    }
    return uniqueCategories.join(', ');
};

const AdminEmployeeProfileScreen: React.FC = () => {
    const navigate = useNavigate();
    const { employeeId } = useParams<{ employeeId: string }>();
    
    const { professionals, updateProfessional } = useProfessionals();
    const { appointments } = useAppointments();
    const { services } = useServices();
    const { loggedInProfessional, setLoggedInProfessional } = useAuth();
    const { settings: financialSettings } = useFinancials();
    const { sales } = useSalesHistory();

    const employee = professionals.find(p => p.id === employeeId);

    const [loginId, setLoginId] = useState(employee?.loginId || '');
    const [cpf, setCpf] = useState(employee?.cpf || '');
    const [phone, setPhone] = useState(employee?.phone || '');
    const [email, setEmail] = useState(employee?.email || '');
    const [toolbarItems, setToolbarItems] = useState(employee?.toolbarItems || []);
    const [notes, setNotes] = useState(employee?.notes || '');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const isInitialMount = useRef(true);

    const [fontScale, setFontScale] = useState(() => {
        const savedScale = localStorage.getItem('app-font-scale');
        return savedScale ? parseFloat(savedScale) : 1;
    });

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontScale * 16}px`;
        localStorage.setItem('app-font-scale', fontScale.toString());
    }, [fontScale]);

    const increaseFontSize = () => setFontScale(s => Math.min(1.3, s + 0.1));
    const decreaseFontSize = () => setFontScale(s => Math.max(0.8, s - 0.1));


    useEffect(() => {
        if (!employeeId) return; // Wait for employeeId to be available

        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
            return;
        }
        
        const canView = loggedInProfessional.permissions?.includes('Funcionários') || loggedInProfessional.id === employeeId;

        if (!canView) {
            alert('Você não tem permissão para acessar este perfil.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate, employeeId]);

    useEffect(() => {
        if (employee) {
            setLoginId(employee.loginId);
            setCpf(employee.cpf || '');
            setPhone(employee.phone || '');
            setEmail(employee.email || '');
            setToolbarItems(employee.toolbarItems || []);
            setNotes(employee.notes || '');
        }
    }, [employee]);
    
    // Auto-save useEffect
    useEffect(() => {
        // Prevent saving on initial component mount and state initialization
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const handler = setTimeout(() => {
            if (!employee) return; // Safety check

            const updatedEmployee = {
                ...employee,
                loginId,
                cpf: cpf || undefined,
                phone: phone || undefined,
                email: email || undefined,
                toolbarItems,
                notes,
            };
            updateProfessional(updatedEmployee);
    
            if (loggedInProfessional && loggedInProfessional.id === updatedEmployee.id) {
                setLoggedInProfessional(updatedEmployee);
            }
    
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1500); // Debounce time: 1.5 seconds

        return () => clearTimeout(handler);
    }, [loginId, cpf, phone, email, toolbarItems, notes]);

    const canView = loggedInProfessional && (loggedInProfessional.permissions?.includes('Funcionários') || loggedInProfessional.id === employeeId);

    const salaryDeductions = useMemo(() => {
        if (!employee) return [];
        // Find other professionals whose salary is paid by the current employee
        return professionals.filter(p => p.salarySource === employee.id && p.isSalaryActive && p.fixedSalary && p.fixedSalary > 0);
    }, [professionals, employee]);
    
    const totalDeductions = useMemo(() => 
        salaryDeductions.reduce((sum, p) => sum + (p.fixedSalary || 0), 0),
    [salaryDeductions]);
    
    const getSalarySourceInfo = (employee: Professional): string => {
        if (employee.employmentType !== 'salaried') return '';
        if (employee.salarySource === 'salon') return 'Pago pelo Salão';
        const payer = professionals.find(p => p.id === employee.salarySource);
        return payer ? `Pago por ${payer.name}` : 'Fonte Desconhecida';
    };

    const { dailyCommission, dailyAppointmentsCount } = useMemo(() => {
        if (!employee) {
            return { dailyCommission: 0, dailyAppointmentsCount: 0 };
        }
    
        const today = new Date();
        const todayString = today.toDateString(); 
    
        const salesToday = sales.filter(sale => new Date(sale.date).toDateString() === todayString);
    
        const commission = salesToday
            .flatMap(sale => sale.items)
            .filter(item => item.professionalId === employee.id)
            .reduce((sum, item) => sum + item.finalCommissionValue, 0);
    
        const apptCount = appointments.filter(app => {
            const appDate = new Date(app.date);
            return app.professional.id === employee.id && appDate.toDateString() === todayString;
        }).length;
    
        return { dailyCommission: commission, dailyAppointmentsCount: apptCount };
    }, [employee, sales, appointments]);

    if (!loggedInProfessional || !canView) {
        return null;
    }

    if (!employee) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <p>Funcionário não encontrado.</p>
                 <button onClick={() => navigate('/admin/funcionarios')} className="mt-4 text-blue-400">Voltar</button>
            </div>
        );
    }

    const handlePasswordSave = (newPassword: string) => {
        const updatedEmployee = { ...employee, password: newPassword };
        updateProfessional(updatedEmployee);
        
        if (loggedInProfessional && loggedInProfessional.id === updatedEmployee.id) {
            setLoggedInProfessional(updatedEmployee);
        }

        setIsPasswordModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleAvatarSave = (newAvatarUrl: string) => {
        if (!employee) return;
        const updatedEmployee = { ...employee, avatarUrl: newAvatarUrl };
        updateProfessional(updatedEmployee);

        if (loggedInProfessional && loggedInProfessional.id === updatedEmployee.id) {
            setLoggedInProfessional(updatedEmployee);
        }

        setIsAvatarModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const toolbarOptions = [
        { label: 'Caixa', permission: 'Caixa' },
        { label: 'Agenda', permission: 'Agenda de Serviços' },
        { label: 'Clientes', permission: 'Clientes' },
        { label: 'Funcionários', permission: 'Funcionários' },
        { label: 'Estoque', permission: 'Estoque' },
        { label: 'Gestão Financeira', permission: 'Gestão Financeira' },
        { label: 'Meu Salão', permission: 'Meu Salão' },
    ];
    
    const availableToolbarOptions = toolbarOptions.filter(opt => employee.permissions.includes(opt.permission));
    
    const handleToolbarItemToggle = (permission: string) => {
        setToolbarItems(prev => {
            const isSelected = prev.includes(permission);
            if (isSelected) {
                return prev.filter(p => p !== permission);
            } else {
                if (prev.length >= 3) {
                    alert('Você pode selecionar no máximo 3 atalhos para a barra de ferramentas.');
                    return prev;
                }
                return [...prev, permission];
            }
        });
    };
    
    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="text-xl font-bold mx-auto">Perfil do Funcionário</h1>
                <div className="w-6"></div> {/* Spacer */}
            </header>

            {showSuccess && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
                    <p className="font-semibold">Informações salvas com sucesso!</p>
                </div>
            )}

            <main className="flex-grow overflow-y-auto p-6 space-y-8 pb-24">
                {/* --- Profile Header and Stats --- */}
                <section className="flex flex-col lg:flex-row items-center text-center lg:text-left gap-6 bg-gray-900 p-6 rounded-lg">
                    <div className="relative flex-shrink-0">
                        <img src={employee.avatarUrl} alt={employee.name} className="w-28 h-28 rounded-full border-4 border-gray-700 object-cover" />
                        <button
                            onClick={() => setIsAvatarModalOpen(true)}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center border-2 border-black hover:bg-white"
                            aria-label="Alterar foto do perfil"
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute -bottom-1 -left-1 bg-gray-900 rounded-full p-1 pointer-events-none">
                            <VerifiedIcon className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-3xl font-bold">{employee.name}</h2>
                        <p className="text-gray-400 mt-1">{getProfessionalSpecialties(employee.serviceIds, services)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full lg:w-auto mt-4 lg:mt-0 flex-shrink-0">
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold">R$ {dailyCommission.toFixed(2).replace('.', ',')}</p>
                            <p className="text-xs text-gray-400">Comissão (Hoje)</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold">{dailyAppointmentsCount}</p>
                            <p className="text-xs text-gray-400">Agendamentos (Hoje)</p>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h3 className="text-xl font-semibold mb-4">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => navigate(`/admin/perfil/${employee.id}/financas`)}
                            className="w-full bg-gray-900 p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-800 p-3 rounded-lg">
                                    <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Finanças</p>
                                    <p className="text-sm text-gray-400">Ver pagamentos</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-6 h-6 text-gray-400" />
                        </button>
                        <button 
                            onClick={() => navigate(`/admin/perfil/${employee.id}/caixa-do-dia`)}
                            className="w-full bg-gray-900 p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-800 p-3 rounded-lg">
                                    <ArchiveBoxIcon className="w-6 h-6 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Caixa do Dia</p>
                                    <p className="text-sm text-gray-400">Vendas de hoje</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-6 h-6 text-gray-400" />
                        </button>
                        {employee.employmentType === 'rented' && (
                             <button 
                                onClick={() => navigate(`/admin/perfil/${employee.id}/gestao-pessoal`)}
                                className="w-full bg-gray-900 p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors md:col-span-2"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-800 p-3 rounded-lg">
                                        <DashboardIcon className="w-6 h-6 text-teal-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">Painel de Gestão Pessoal</p>
                                        <p className="text-sm text-gray-400">Caixa, estoque e vendas independentes</p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-6 h-6 text-gray-400" />
                            </button>
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="text-xl font-semibold mb-4">Remuneração</h3>
                    <div className="bg-gray-900 p-6 rounded-lg space-y-4">
                        <div className="flex justify-between items-center pb-3">
                            <p className="text-gray-400">Tipo de Contrato</p>
                            <p className="font-semibold text-lg capitalize">{
                                employee.employmentType === 'salaried' ? 'Salariado' : 
                                employee.employmentType === 'rented' ? 'Aluguel de Sala' : 'Comissionado'
                            }</p>
                        </div>

                        {employee.employmentType === 'salaried' && (
                            <>
                                <div className="flex justify-between items-center border-t border-gray-700/50 pt-3">
                                    <p className="text-gray-400">
                                        {financialSettings.cycleConfig.cycleType === 'days_5_20' ? 'Salário (por quinzena)' : 'Salário Fixo Mensal'}
                                    </p>
                                    <p className="font-semibold text-lg text-green-400">
                                        R$ {(
                                            financialSettings.cycleConfig.cycleType === 'days_5_20' && employee.fixedSalary
                                                ? employee.fixedSalary / 2
                                                : employee.fixedSalary || 0
                                        ).toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-700/50 pt-3">
                                    <p className="text-gray-400">Status do Salário</p>
                                    <p className={`font-semibold px-2 py-0.5 rounded-full text-xs ${employee.isSalaryActive ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                        {employee.isSalaryActive ? 'Ativo' : 'Inativo'}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-700/50 pt-3">
                                    <p className="text-gray-400">Fonte do Salário</p>
                                    <p className="font-semibold">{getSalarySourceInfo(employee)}</p>
                                </div>
                            </>
                        )}
                        
                        {employee.employmentType === 'rented' && (
                            <div className="flex justify-between items-center border-t border-gray-700/50 pt-3">
                                <p className="text-gray-400">Aluguel da Sala (Mensal)</p>
                                <p className="font-semibold text-lg text-teal-400">
                                    R$ {(employee.rentValue || 0).toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        )}


                        {totalDeductions > 0 && (
                            <div className="border-t border-gray-700 pt-4">
                                <h4 className="font-semibold text-gray-300 mb-2">Descontos para Pagamento de Salários</h4>
                                {salaryDeductions.map(p => (
                                     <div key={p.id} className="flex justify-between items-center text-sm py-1">
                                         <p className="text-gray-400">Salário de {p.name}</p>
                                         <p className="font-semibold text-red-400">- R$ {p.fixedSalary?.toFixed(2).replace('.', ',')}</p>
                                     </div>
                                ))}
                                <div className="flex justify-between items-center text-md font-bold mt-2 pt-2 border-t border-gray-800">
                                    <p>Total de Descontos</p>
                                    <p className="text-red-400">- R$ {totalDeductions.toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                
                 <section>
                    <h3 className="text-xl font-semibold mb-4">Anotações</h3>
                    <div className="bg-gray-900 p-6 rounded-lg">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={8}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Adicione anotações sobre o funcionário, como fórmulas de coloração, preferências, etc."
                        />
                    </div>
                </section>
                
                <section>
                    <h3 className="text-xl font-semibold mb-4">Aparência</h3>
                    <div className="bg-gray-900 p-6 rounded-lg">
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-300">Tamanho da Fonte</p>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={decreaseFontSize}
                                    className="text-2xl font-bold text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
                                    aria-label="Diminuir fonte"
                                    disabled={fontScale <= 0.8}
                                >
                                    A-
                                </button>
                                <span className="text-base font-semibold w-12 text-center text-gray-300">{Math.round(fontScale * 100)}%</span>
                                <button
                                    onClick={increaseFontSize}
                                    className="text-2xl font-bold text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
                                    aria-label="Aumentar fonte"
                                    disabled={fontScale >= 1.3}
                                >
                                    A+
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xl font-semibold mb-4">Segurança e Acesso</h3>
                    <div className="bg-gray-900 p-6 rounded-lg space-y-6">
                        <div>
                            <h4 className="font-semibold text-lg text-gray-300 mb-4">Credenciais de Acesso</h4>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="loginId" className="block text-sm font-medium text-gray-400 mb-2">Código de Acesso (Login)</label>
                                    <input
                                        type="text"
                                        id="loginId"
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Senha</label>
                                    <button
                                        onClick={() => setIsPasswordModalOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 rounded-lg text-base hover:bg-gray-600 transition-colors"
                                    >
                                        <KeyIcon className="w-5 h-5" />
                                        <span>Alterar Senha</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-6">
                            <h4 className="font-semibold text-lg text-gray-300 mb-4">Informações de Recuperação</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                Para recuperar a senha, o funcionário precisará acertar 2 dos 3 campos abaixo.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-400 mb-2">CPF</label>
                                    <input type="text" id="cpf" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="___.___.___-__" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="(__) _____-____" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="email@exemplo.com" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {employee.employmentType !== 'rented' && (
                    <section>
                        <h3 className="text-xl font-semibold mb-4">Personalizar Barra de Ferramentas</h3>
                        <div className="bg-gray-900 p-6 rounded-lg space-y-4">
                            <p className="text-sm text-gray-400">
                                Selecione até 3 atalhos para exibir na barra de ferramentas inferior para acesso rápido. O Dashboard é sempre exibido.
                            </p>
                            <div className="space-y-3">
                                {availableToolbarOptions.map(option => (
                                    <div key={option.permission} className="flex items-center justify-between">
                                        <p>{option.label}</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={toolbarItems.includes(option.permission)}
                                                onChange={() => handleToolbarItemToggle(option.permission)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>
                                ))}
                                {availableToolbarOptions.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">Nenhuma opção disponível com suas permissões atuais.</p>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <AdminChangeAvatarModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSave={handleAvatarSave}
                client={{
                    id: employee.id,
                    name: employee.name,
                    email: employee.email || '',
                    phone: employee.phone || '',
                    avatarUrl: employee.avatarUrl,
                }}
                showUploadOption={true}
            />

            <ChangeEmployeePasswordModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSave={handlePasswordSave}
                employee={employee}
            />
        </div>
    );
};

export default AdminEmployeeProfileScreen;
