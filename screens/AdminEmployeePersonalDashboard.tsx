import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import { SaleRecord, StockItem, Service, ServicePackageTemplate, Professional } from '../types';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';
import WarningIcon from '../components/icons/WarningIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import CubeIcon from '../components/icons/CubeIcon';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import ScissorsIcon from '../components/icons/ScissorsIcon';
import { useServices } from '../contexts/ServicesContext';
import ChartIcon from '../components/icons/ChartIcon';
import GiftIcon from '../components/icons/GiftIcon';
import ClockIcon from '../components/icons/ClockIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';


interface PersonalExpense {
    id: string;
    date: string; // YYYY-MM-DD
    description: string;
    amount: number;
}

interface PersonalDashboardData {
    sales: SaleRecord[];
    stock: StockItem[];
    packages: ServicePackageTemplate[];
    expenses: PersonalExpense[];
}

const usePersonalDashboardData = (employeeId: string) => {
    const dataKey = `personal_dashboard_${employeeId}`;
    
    const [data, setData] = useState<PersonalDashboardData>({ 
        sales: [], 
        stock: [],
        packages: [],
        expenses: [],
    });
    
    useEffect(() => {
        const loadData = () => {
            try {
                const storedData = localStorage.getItem(dataKey);
                if (storedData) {
                    const parsed = JSON.parse(storedData);
                    setData({
                        sales: parsed.sales || [],
                        stock: parsed.stock || [],
                        packages: parsed.packages || [],
                        expenses: parsed.expenses || [],
                    });
                }
            } catch (e) {
                console.error("Failed to load personal dashboard data", e);
            }
        };
        loadData();
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === dataKey) {
                loadData();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);

    }, [employeeId, dataKey]);

    const saveData = (newData: Partial<PersonalDashboardData>) => {
        setData(currentData => {
            const dataToSave = { ...currentData, ...newData };
            try {
                localStorage.setItem(dataKey, JSON.stringify(dataToSave));
            } catch (e) {
                console.error("Failed to save personal dashboard data", e);
            }
            return dataToSave;
        });
    };

    return { data, saveData };
};

const PersonalFinanceiro: React.FC<{ employee: Professional, sales: SaleRecord[], expenses: PersonalExpense[] }> = ({ employee, sales, expenses }) => {
    const [monthOffset, setMonthOffset] = useState(0);
    const [detailsTab, setDetailsTab] = useState<'vendas' | 'despesas'>('vendas');

    const monthlyData = useMemo(() => {
        const targetDate = new Date();
        targetDate.setDate(1); // Avoid issues with end-of-month dates
        targetDate.setMonth(targetDate.getMonth() + monthOffset);

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const monthName = startDate.toLocaleString('pt-BR', { month: 'long' });

        const salesInMonth = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });

        const expensesInMonth = expenses.filter(exp => {
            const expDate = new Date(exp.date + 'T00:00:00'); // Ensure correct date parsing
            return expDate >= startDate && expDate <= endDate;
        });

        const totalSales = salesInMonth.reduce((sum, sale) => sum + sale.totals.total, 0);
        const rentValue = employee.rentValue || 0;
        const totalVariableExpenses = expensesInMonth.reduce((sum, exp) => sum + exp.amount, 0);
        const totalCost = rentValue + totalVariableExpenses;
        const netProfit = totalSales - totalCost;
        
        return {
            monthName: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`,
            totalSales,
            rentValue,
            totalVariableExpenses,
            totalCost,
            netProfit,
            salesInMonth: salesInMonth.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            expensesInMonth: expensesInMonth.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
    }, [monthOffset, sales, expenses, employee.rentValue]);
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                <button onClick={() => setMonthOffset(o => o - 1)} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeftIcon /></button>
                <h3 className="text-lg font-bold text-center">{monthlyData.monthName}</h3>
                <button onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50"><ChevronRightIcon /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Receita Bruta (Vendas)</p>
                    <p className="text-3xl font-bold text-green-400">R$ {monthlyData.totalSales.toFixed(2).replace('.', ',')}</p>
                </div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Custo Total</p>
                    <p className="text-3xl font-bold text-red-400">R$ {monthlyData.totalCost.toFixed(2).replace('.', ',')}</p>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-lg text-gray-300">Lucro Líquido do Mês</p>
                <p className={`text-5xl font-extrabold ${monthlyData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {monthlyData.netProfit.toFixed(2).replace('.', ',')}
                </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Detalhes dos Custos</h4>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Aluguel da Sala (Fixo)</span><span className="font-medium">- R$ {monthlyData.rentValue.toFixed(2).replace('.', ',')}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Despesas Variáveis</span><span className="font-medium">- R$ {monthlyData.totalVariableExpenses.toFixed(2).replace('.', ',')}</span></div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold mb-3">Detalhes do Mês</h3>
                <div className="border-b border-gray-700 mb-4">
                    <div className="flex space-x-4">
                        <button onClick={() => setDetailsTab('vendas')} className={`py-2 px-4 text-sm font-semibold ${detailsTab === 'vendas' ? 'border-b-2 text-white' : 'text-gray-400'}`}>Vendas ({monthlyData.salesInMonth.length})</button>
                        <button onClick={() => setDetailsTab('despesas')} className={`py-2 px-4 text-sm font-semibold ${detailsTab === 'despesas' ? 'border-b-2 text-white' : 'text-gray-400'}`}>Despesas ({monthlyData.expensesInMonth.length})</button>
                    </div>
                </div>
                <div className="space-y-3">
                    {detailsTab === 'vendas' && (
                        monthlyData.salesInMonth.length > 0 ? monthlyData.salesInMonth.map(sale => (
                            <div key={sale.id} className="bg-gray-800 p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{sale.clientNames.join(', ')}</p>
                                        <p className="text-xs text-gray-400">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <p className="font-bold text-green-400">R$ {sale.totals.total.toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                        )) : <p className="text-center text-gray-500 py-6">Nenhuma venda neste mês.</p>
                    )}
                     {detailsTab === 'despesas' && (
                        monthlyData.expensesInMonth.length > 0 ? monthlyData.expensesInMonth.map(exp => (
                            <div key={exp.id} className="bg-gray-800 p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{exp.description}</p>
                                        <p className="text-xs text-gray-400">{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <p className="font-bold text-red-400">- R$ {exp.amount.toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                        )) : <p className="text-center text-gray-500 py-6">Nenhuma despesa variável neste mês.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


const PersonalServiceModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string, category: string, price: number, duration?: number, description: string }, idToUpdate?: string) => void;
    serviceToEdit?: Service | null;
}> = ({ isOpen, onClose, onSave, serviceToEdit }) => {
    const isEditing = !!serviceToEdit;
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (serviceToEdit) {
            setName(serviceToEdit.name);
            setCategory(serviceToEdit.category);
            setPrice(String(serviceToEdit.price));
            setDuration(String(serviceToEdit.duration || ''));
            setDescription(serviceToEdit.description || '');
        } else {
            setName('');
            setCategory('');
            setPrice('');
            setDuration('');
            setDescription('');
        }
    }, [serviceToEdit]);

    if (!isOpen) return null;

    const handleSaveClick = () => {
        if (!name || !price || !category) {
            alert('Nome, categoria e preço são obrigatórios.');
            return;
        }
        const serviceData = {
            name,
            category,
            price: parseFloat(price),
            duration: parseInt(duration, 10) || undefined,
            description,
        };
        
        onSave(serviceData, serviceToEdit?.id);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Serviço' : 'Novo Serviço Pessoal'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">X</button>
                </header>
                <main className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Serviço</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="Ex: Corte Masculino Pessoal"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="Ex: Corte"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="35,00"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Duração (min)</label>
                            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="30"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Descrição (Opcional)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" rows={3}></textarea>
                    </div>
                </main>
                <footer className="mt-8">
                    <button onClick={handleSaveClick} disabled={!name || !price || !category} className="w-full bg-blue-600 font-bold py-3 rounded-lg text-lg hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400">
                        Salvar
                    </button>
                </footer>
            </div>
        </div>
    );
};

const PersonalServices: React.FC<{ employeeId: string }> = ({ employeeId }) => {
    const { services, addService, updateService, deleteService } = useServices();
    const { professionals, updateProfessional } = useProfessionals();
    const [modalOpen, setModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

    const employee = useMemo(() => professionals.find(p => p.id === employeeId), [professionals, employeeId]);
    const personalServices = useMemo(() => 
        services.filter(s => s.ownerId === employeeId).sort((a,b) => a.name.localeCompare(b.name)),
        [services, employeeId]
    );

    const handleSave = (data: { name: string, category: string, price: number, duration?: number, description: string }, idToUpdate?: string) => {
        if (idToUpdate) {
            const existingService = services.find(s => s.id === idToUpdate);
            if (existingService) {
                updateService({ ...existingService, ...data });
            }
        } else {
            const newServiceId = `personal-s-${Date.now()}`;
            const newService: Service = {
                id: newServiceId,
                commissionPercentage: 0,
                ownerId: employeeId,
                isPublic: false,
                ...data
            };
            addService(newService);
            if (employee) {
                updateProfessional({
                    ...employee,
                    clientBookablePersonalServiceIds: [...(employee.clientBookablePersonalServiceIds || []), newServiceId],
                    serviceIds: [...employee.serviceIds, newServiceId],
                });
            }
        }
        setModalOpen(false);
    };

    const handleRemove = (serviceId: string) => {
        if(window.confirm("Tem certeza que deseja remover este serviço?")) {
            deleteService(serviceId);
            if (employee) {
                updateProfessional({
                    ...employee,
                    serviceIds: employee.serviceIds.filter(id => id !== serviceId),
                    clientBookablePersonalServiceIds: (employee.clientBookablePersonalServiceIds || []).filter(id => id !== serviceId)
                });
            }
        }
    };

    const handleVisibilityToggle = (service: Service) => {
        const isCurrentlyPublic = employee?.clientBookablePersonalServiceIds?.includes(service.id);
        if (employee) {
            const updatedIds = isCurrentlyPublic
                ? (employee.clientBookablePersonalServiceIds || []).filter(id => id !== service.id)
                : [...(employee.clientBookablePersonalServiceIds || []), service.id];
            updateProfessional({ ...employee, clientBookablePersonalServiceIds: updatedIds });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Meus Serviços Pessoais</h3>
                <button onClick={() => { setServiceToEdit(null); setModalOpen(true); }} className="flex items-center gap-1.5 text-sm bg-blue-600 px-3 py-2 rounded-lg font-semibold">
                    <PlusIcon className="w-5 h-5"/> Novo Serviço
                </button>
            </div>
             <div className="space-y-2">
                {personalServices.length > 0 ? personalServices.map(service => {
                    const isPublic = employee?.clientBookablePersonalServiceIds?.includes(service.id) ?? false;
                    return (
                        <div key={service.id} className="bg-gray-800 p-3 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{service.name}</p>
                                    <p className="text-xs text-gray-400">
                                        Categoria: <span className="font-medium text-gray-300">{service.category}</span> | Preço: R$ {service.price.toFixed(2).replace('.',',')}
                                        {service.duration && ` | Duração: ${service.duration} min`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                   <button onClick={() => { setServiceToEdit(service); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                   <button onClick={() => handleRemove(service.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-3 mt-2 pt-2 border-t border-gray-700">
                                <label htmlFor={`visible-${service.id}`} className="text-sm text-gray-400 cursor-pointer">Visível para cliente</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id={`visible-${service.id}`}
                                        checked={isPublic}
                                        onChange={() => handleVisibilityToggle(service)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>
                    );
                }) : <p className="text-center text-gray-500 py-8">Nenhum serviço pessoal cadastrado.</p>}
             </div>
            <PersonalServiceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} serviceToEdit={serviceToEdit} />
        </div>
    );
};

const PersonalPackages: React.FC<{
    packages: ServicePackageTemplate[];
    personalServices: Service[];
    onPackagesChange: (newPackages: ServicePackageTemplate[]) => void;
    employeeId: string;
}> = ({ packages, personalServices, onPackagesChange, employeeId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<ServicePackageTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<ServicePackageTemplate | null>(null);

    const handleSave = (templateData: Omit<ServicePackageTemplate, 'id'> | ServicePackageTemplate) => {
        let newPackages;
        if ('id' in templateData) {
            newPackages = packages.map(p => p.id === templateData.id ? { ...templateData, ownerId: employeeId } : p);
        } else {
            newPackages = [...packages, { ...templateData, id: `personal-pkg-${Date.now()}`, ownerId: employeeId }];
        }
        onPackagesChange(newPackages);
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (templateToDelete) {
            onPackagesChange(packages.filter(p => p.id !== templateToDelete.id));
            setTemplateToDelete(null);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Meus Pacotes de Serviços</h3>
                <button onClick={() => { setTemplateToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-1.5 text-sm bg-blue-600 px-3 py-2 rounded-lg font-semibold">
                    <PlusIcon className="w-5 h-5"/> Novo Pacote
                </button>
            </div>
            <div className="space-y-3">
                {packages.map(pkg => (
                    <div key={pkg.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{pkg.name}</p>
                            <p className="text-sm text-gray-400">R$ {pkg.price.toFixed(2)} - {pkg.sessionCount} sessões de {personalServices.find(s => s.id === pkg.serviceId)?.name || '?'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setTemplateToEdit(pkg); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => setTemplateToDelete(pkg)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <PersonalPackageModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    services={personalServices}
                    templateToEdit={templateToEdit}
                />
            )}
            {templateToDelete && (
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p>Tem certeza que deseja apagar o pacote "{templateToDelete.name}"?</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setTemplateToDelete(null)} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 rounded">Apagar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PersonalPackageModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ServicePackageTemplate, 'id'> | ServicePackageTemplate) => void;
    services: Service[];
    templateToEdit?: ServicePackageTemplate | null;
}> = ({ isOpen, onClose, onSave, services, templateToEdit }) => {
    const isEditing = !!templateToEdit;
    const [name, setName] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [price, setPrice] = useState('');
    const [sessionCount, setSessionCount] = useState('');
    const [validityDays, setValidityDays] = useState('');

     useEffect(() => {
        if (templateToEdit) {
            setName(templateToEdit.name);
            setServiceId(templateToEdit.serviceId);
            setPrice(String(templateToEdit.price));
            setSessionCount(String(templateToEdit.sessionCount));
            setValidityDays(String(templateToEdit.validityDays));
        } else {
            setServiceId(services[0]?.id || '');
        }
    }, [templateToEdit, services]);

    if (!isOpen) return null;

     const handleSaveClick = () => {
        const data = {
            name,
            serviceId,
            price: parseFloat(price),
            sessionCount: parseInt(sessionCount),
            validityDays: parseInt(validityDays)
        };
        onSave(isEditing ? { ...data, id: templateToEdit!.id } : data);
    };

    return (
         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                 <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Pacote' : 'Novo Pacote'}</h2>
                 <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Pacote" className="w-full bg-gray-800 p-2 rounded"/>
                    <select value={serviceId} onChange={e => setServiceId(e.target.value)} className="w-full bg-gray-800 p-2 rounded">
                        <option value="">Selecione um serviço</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Preço (R$)" className="w-full bg-gray-800 p-2 rounded"/>
                    <input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} placeholder="Nº de Sessões" className="w-full bg-gray-800 p-2 rounded"/>
                    <input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} placeholder="Validade (dias)" className="w-full bg-gray-800 p-2 rounded"/>
                 </div>
                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-blue-600 rounded">Salvar</button>
                </div>
            </div>
        </div>
    );
};

// --- Expense Components ---
const PersonalExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<PersonalExpense, 'id'>, idToUpdate?: string) => void;
    expenseToEdit?: PersonalExpense | null;
}> = ({ isOpen, onClose, onSave, expenseToEdit }) => {
    const isEditing = !!expenseToEdit;
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (expenseToEdit) {
            setDescription(expenseToEdit.description);
            setAmount(String(expenseToEdit.amount));
            setDate(expenseToEdit.date);
        } else {
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [expenseToEdit]);

    if (!isOpen) return null;

    const handleSaveClick = () => {
        if (!description.trim() || !amount) {
            alert('Descrição e valor são obrigatórios.');
            return;
        }
        onSave({ description, amount: parseFloat(amount), date }, expenseToEdit?.id);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Despesa' : 'Nova Despesa Variável'}</h2>
                <div className="space-y-4">
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição da despesa" className="w-full bg-gray-800 p-2 rounded" />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor (R$)" className="w-full bg-gray-800 p-2 rounded" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 p-2 rounded" style={{ colorScheme: 'dark' }} />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-blue-600 rounded">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const PersonalExpenses: React.FC<{ employeeId: string }> = ({ employeeId }) => {
    const { data, saveData } = usePersonalDashboardData(employeeId);
    const { professionals } = useProfessionals();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<PersonalExpense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<PersonalExpense | null>(null);

    const employee = useMemo(() => professionals.find(p => p.id === employeeId), [professionals, employeeId]);
    const rentValue = employee?.rentValue || 0;
    const stockCost = useMemo(() => data.stock.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0), [data.stock]);
    const variableExpensesTotal = useMemo(() => data.expenses.reduce((sum, exp) => sum + exp.amount, 0), [data.expenses]);
    const totalExpenses = rentValue + stockCost + variableExpensesTotal;

    const handleSave = (expenseData: Omit<PersonalExpense, 'id'>, idToUpdate?: string) => {
        let newExpenses;
        if (idToUpdate) {
            newExpenses = data.expenses.map(e => e.id === idToUpdate ? { ...expenseData, id: idToUpdate } : e);
        } else {
            newExpenses = [...data.expenses, { ...expenseData, id: `personal-exp-${Date.now()}` }];
        }
        saveData({ expenses: newExpenses });
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (expenseToDelete) {
            saveData({ expenses: data.expenses.filter(e => e.id !== expenseToDelete.id) });
            setExpenseToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-400">Total de Despesas do Mês (Estimado)</p>
                <p className="text-3xl font-bold text-red-400">R$ {totalExpenses.toFixed(2).replace('.', ',')}</p>
            </div>

            {/* Fixed Expenses */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold">Despesas Fixas</h3>
                <div className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                    <p>Aluguel da Sala</p>
                    <p className="font-semibold">R$ {rentValue.toFixed(2).replace('.', ',')}</p>
                </div>
            </div>

            {/* Stock Expenses */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold">Despesas de Estoque</h3>
                <div className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                    <p>Custo Total do Estoque Atual</p>
                    <p className="font-semibold">R$ {stockCost.toFixed(2).replace('.', ',')}</p>
                </div>
            </div>

            {/* Variable Expenses */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Despesas Variáveis</h3>
                    <button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-1.5 text-sm bg-blue-600 px-3 py-2 rounded-lg font-semibold">
                        <PlusIcon className="w-5 h-5"/> Nova Despesa
                    </button>
                </div>
                <div className="space-y-2">
                    {data.expenses.map(exp => (
                        <div key={exp.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{exp.description}</p>
                                <p className="text-xs text-gray-400">{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">R$ {exp.amount.toFixed(2).replace('.', ',')}</p>
                                <button onClick={() => { setExpenseToEdit(exp); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                <button onClick={() => setExpenseToDelete(exp)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <PersonalExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} expenseToEdit={expenseToEdit} />

            {expenseToDelete && (
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p>Tem certeza que deseja apagar a despesa "{expenseToDelete.description}"?</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setExpenseToDelete(null)} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 rounded">Apagar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
const AdminEmployeePersonalDashboard: React.FC = () => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { professionals, updateProfessional } = useProfessionals();
    const { data, saveData } = usePersonalDashboardData(employeeId!);
    const { services } = useServices();

    const initialTabFromState = location.state?.initialTab || 'financeiro';
    const [activeTab, setActiveTab] = useState<'servicos' | 'pacotes' | 'despesas' | 'financeiro' | 'horario'>(initialTabFromState);
    
    useEffect(() => {
        if (location.state?.initialTab && ['servicos', 'pacotes', 'despesas', 'financeiro', 'horario'].includes(location.state.initialTab)) {
            setActiveTab(location.state.initialTab);
        }
    }, [location.state]);

    const employee = professionals.find(p => p.id === employeeId);
    const personalServices = useMemo(() => services.filter(s => s.ownerId === employeeId), [services, employeeId]);
    
    const [localWorkingDays, setLocalWorkingDays] = useState(employee?.workingDays || []);
    const [localStartTime, setLocalStartTime] = useState(employee?.startTime || '');
    const [localEndTime, setLocalEndTime] = useState(employee?.endTime || '');
    const [showSuccess, setShowSuccess] = useState(false);

    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const handleWorkingDayToggle = (dayIndex: number) => {
        setLocalWorkingDays(prev => {
            const isIncluded = prev.includes(dayIndex);
            if (isIncluded) {
                return prev.filter(d => d !== dayIndex);
            }
            return [...prev, dayIndex].sort();
        });
    };

    const handleSaveSchedule = () => {
        if (employee) {
            updateProfessional({
                ...employee,
                workingDays: localWorkingDays,
                startTime: localStartTime,
                endTime: localEndTime,
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };


    if (!employee || employee.employmentType !== 'rented') {
        return (
             <div className="flex flex-col h-screen bg-black text-white p-4 items-center justify-center">
                <WarningIcon className="w-12 h-12 text-yellow-400 mb-4"/>
                <h1 className="text-xl font-bold mb-4">Acesso Negado</h1>
                <p className="text-gray-400 text-center mb-6">Este painel está disponível apenas para funcionários com contrato de Aluguel de Sala.</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-700 rounded-lg">Voltar</button>
            </div>
        );
    }
    
    const tabs = [
        { id: 'financeiro' as const, label: 'Financeiro', icon: <ChartIcon className="w-5 h-5"/> },
        { id: 'servicos' as const, label: 'Serviços', icon: <ScissorsIcon className="w-5 h-5"/> },
        { id: 'pacotes' as const, label: 'Pacotes', icon: <GiftIcon className="w-5 h-5"/> },
        { id: 'despesas' as const, label: 'Despesas', icon: <CurrencyDollarIcon className="w-5 h-5"/> },
        { id: 'horario' as const, label: 'Meu Horário', icon: <ClockIcon className="w-5 h-5"/> },
    ];

    return (
        <div className="flex flex-col h-screen bg-black text-white">
             <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                <div className="text-center mx-auto">
                    <h1 className="text-xl font-bold">Painel de Gestão Pessoal</h1>
                    <p className="text-sm text-gray-400">{employee.name}</p>
                </div>
                <div className="w-6" />
            </header>

            <main className="flex-grow overflow-y-auto p-6 space-y-8">
                 <div className="border-b border-gray-700">
                    <div className="flex space-x-4 overflow-x-auto">
                        {tabs.map(tab => (
                             <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)} 
                                className={`py-3 px-2 text-sm font-semibold flex items-center gap-2 ${activeTab === tab.id ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                             >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    {activeTab === 'financeiro' && <PersonalFinanceiro employee={employee} sales={data.sales} expenses={data.expenses} />}
                    {activeTab === 'servicos' && <PersonalServices employeeId={employeeId!} />}
                    {activeTab === 'pacotes' && <PersonalPackages packages={data.packages} personalServices={personalServices} onPackagesChange={(newPackages) => saveData({ packages: newPackages })} employeeId={employeeId!} />}
                    {activeTab === 'despesas' && <PersonalExpenses employeeId={employeeId!} />}
                    {activeTab === 'horario' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold mb-3">Dias de Atendimento</h3>
                                <p className="text-sm text-gray-400 mb-4">Selecione os dias da semana que você trabalha. Este horário será exibido para os clientes no agendamento online.</p>
                                <div className="space-y-3">
                                    {weekDays.map((day, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                                            <p>{day}</p>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={localWorkingDays.includes(index)}
                                                    onChange={() => handleWorkingDayToggle(index)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-3">Horário de Trabalho</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="start-time" className="block text-sm font-medium text-gray-300 mb-2">Início</label>
                                        <input
                                            type="time"
                                            id="start-time"
                                            value={localStartTime}
                                            onChange={(e) => setLocalStartTime(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="end-time" className="block text-sm font-medium text-gray-300 mb-2">Fim</label>
                                        <input
                                            type="time"
                                            id="end-time"
                                            value={localEndTime}
                                            onChange={(e) => setLocalEndTime(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button
                                    onClick={handleSaveSchedule}
                                    className="w-full bg-blue-600 font-bold py-3 rounded-lg text-lg hover:bg-blue-500 transition-colors"
                                >
                                    Salvar Horário
                                </button>
                                {showSuccess && <p className="text-center text-green-400 mt-4">Horário salvo com sucesso!</p>}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminEmployeePersonalDashboard;