import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PlusIcon from '../components/icons/PlusIcon';
import { useServices } from '../contexts/ServicesContext';
import { Professional } from '../types';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import DeleteEmployeeConfirmationModal from '../components/DeleteEmployeeConfirmationModal';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useAuth } from '../contexts/AuthContext';
import { usePackages } from '../contexts/PackagesContext';
import GiftIcon from '../components/icons/GiftIcon';


const weekDaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatWorkingDays = (days: number[]): string => {
    if (days.length === 7) return 'Todos os dias';
    if (days.length === 0) return 'Nenhum dia';
    return days.sort().map(d => weekDaysShort[d]).join(', ');
};

const AdminEmployeesScreen: React.FC = () => {
    const navigate = useNavigate();
    const { services } = useServices();
    const { professionals, deleteProfessional } = useProfessionals();
    const { deleteAppointmentsByProfessionalId } = useAppointments();
    const { loggedInProfessional } = useAuth();
    const { packageTemplates } = usePackages();
    
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Professional | null>(null);

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        } else if (!loggedInProfessional.permissions?.includes('Funcionários')) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate]);

    const handleAddClick = () => {
        navigate('/admin/adicionar-funcionario');
    };

    const handleDeleteClick = (prof: Professional) => {
        setEmployeeToDelete(prof);
        setIsDeleteConfirmOpen(true);
        setActiveMenu(null);
    };

    const confirmDelete = () => {
        if (employeeToDelete) {
            deleteAppointmentsByProfessionalId(employeeToDelete.id);
            deleteProfessional(employeeToDelete.id);
        }
        setIsDeleteConfirmOpen(false);
        setEmployeeToDelete(null);
    };

    const getProfessionalSpecialties = (serviceIds: string[]): string => {
        const categories = serviceIds.map(id => {
            const service = services.find(s => s.id === id);
            return service ? service.category : '';
        });
        return [...new Set(categories)].filter(Boolean).join(', ');
    };

    const getProfessionalPackages = (packageTemplateIds: string[] = []): string => {
        const names = packageTemplateIds.map(id => {
            const pkg = packageTemplates.find(p => p.id === id);
            return pkg ? pkg.name.split(' ').slice(1).join(' ') : '';
        }).filter(Boolean);
        
        if (names.length > 1) {
            return `${names.length} pacotes`;
        }
        return names.join(', ');
    };

    const getSalarySourceInfo = (prof: Professional): string => {
        if (prof.salarySource && prof.salarySource !== 'salon') {
            const payingEmployee = professionals.find(p => p.id === prof.salarySource);
            return payingEmployee ? `Pago por ${payingEmployee.name}` : 'Fonte desconhecida';
        }
        return 'Pago pelo Salão';
    };

    if (!loggedInProfessional || !loggedInProfessional.permissions?.includes('Funcionários')) {
        return null;
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white" onClick={() => activeMenu && setActiveMenu(null)}>
            <header className="flex items-center p-4">
                <button onClick={() => navigate('/admin')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Funcionários</h1>
                <div className="w-6 h-6"></div> {/* Spacer to balance the title */}
            </header>

            <div className="flex-grow overflow-y-auto px-4 pb-24 pt-4">
                <section>
                     <div className="space-y-3">
                        {professionals.map(prof => (
                            <div 
                                key={prof.id} 
                                onDoubleClick={(e) => { e.stopPropagation(); setActiveMenu(prof.id); }}
                                className="bg-gray-800 p-4 rounded-lg flex justify-between items-start relative cursor-pointer"
                            >
                                <div className="flex items-start">
                                    <img src={prof.avatarUrl} alt={prof.name} className="w-12 h-12 rounded-full mr-4" />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{prof.name}</p>
                                        <p className="text-sm text-gray-400">{getProfessionalSpecialties(prof.serviceIds)}</p>
                                        
                                        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs">
                                            {prof.employmentType === 'salaried' ? (
                                                <span className={`px-2 py-0.5 rounded-full ${prof.isSalaryActive ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                                    Salário: R$ {prof.fixedSalary?.toFixed(2).replace('.', ',') ?? '0,00'} ({prof.isSalaryActive ? `Ativo - ${getSalarySourceInfo(prof)}` : 'Inativo'})
                                                </span>
                                            ) : prof.employmentType === 'rented' ? (
                                                <span className="bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded-full">
                                                    Aluguel: R$ {prof.rentValue?.toFixed(2).replace('.', ',') ?? '0,00'}
                                                </span>
                                            ) : (
                                                <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">
                                                    Comissionado
                                                </span>
                                            )}
                                            {prof.packageTemplateIds && prof.packageTemplateIds.length > 0 && (
                                                <span className="bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <GiftIcon className="w-3 h-3"/>
                                                    {getProfessionalPackages(prof.packageTemplateIds)}
                                                </span>
                                            )}
                                            {prof.startTime && prof.endTime && (
                                                <p className="text-gray-300 bg-gray-700 px-2 py-0.5 rounded-full">{prof.startTime} - {prof.endTime}</p>
                                            )}
                                            {prof.workingDays && (
                                                <p className="text-gray-300 bg-gray-700 px-2 py-0.5 rounded-full">{formatWorkingDays(prof.workingDays)}</p>
                                            )}
                                        </div>

                                        <div className="mt-2">
                                            <p className="text-xs text-gray-400 font-medium">Login ID: <span className="text-gray-300 font-normal">{prof.loginId}</span></p>
                                            <p className="text-xs text-gray-400 font-medium">Permissões: <span className="text-gray-300 font-normal">{prof.permissions?.join(', ') || 'Nenhuma'}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {activeMenu === prof.id && (
                                    <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center p-2 space-x-2 z-10" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => navigate(`/admin/editar-funcionario/${prof.id}`)} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md">
                                            <PencilIcon className="w-4 h-4" /> Editar
                                        </button>
                                        <button onClick={() => handleDeleteClick(prof)} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-800 hover:bg-red-700 text-white rounded-md">
                                            <TrashIcon className="w-4 h-4" /> Apagar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            
            <div className="fixed bottom-6 right-6 max-w-md mx-auto w-full flex justify-end pr-10">
                 <button onClick={handleAddClick} className="bg-gray-200 text-black rounded-full p-4 shadow-lg flex items-center font-bold hover:bg-white pl-6 pr-8">
                    <PlusIcon className="w-6 h-6 mr-2" /> Adicionar Funcionário
                </button>
            </div>

            {employeeToDelete && (
                <DeleteEmployeeConfirmationModal
                    isOpen={isDeleteConfirmOpen}
                    onClose={() => setIsDeleteConfirmOpen(false)}
                    onConfirm={confirmDelete}
                    employeeName={employeeToDelete.name}
                />
            )}
        </div>
    );
};

export default AdminEmployeesScreen;