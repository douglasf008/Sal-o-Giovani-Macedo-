import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import CameraIcon from '../components/icons/CameraIcon';
import { Service, Professional } from '../types';
import { useServices } from '../contexts/ServicesContext';
import { useRoles } from '../contexts/RolesContext';
import { MANAGEMENT_SECTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { usePackages } from '../contexts/PackagesContext';

const AdminAddEmployeeScreen: React.FC = () => {
    const navigate = useNavigate();
    const { services } = useServices();
    const { professionals, addProfessional } = useProfessionals();
    const { roles: availableRoles } = useRoles();
    const { loggedInProfessional } = useAuth();
    const { packageTemplates } = usePackages();
    const [name, setName] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedPackageTemplates, setSelectedPackageTemplates] = useState<string[]>([]);
    const [selectedClientBookablePackages, setSelectedClientBookablePackages] = useState<string[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [hasSpecificHours, setHasSpecificHours] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [employmentType, setEmploymentType] = useState<'commissioned' | 'salaried' | 'rented'>('commissioned');
    const [fixedSalary, setFixedSalary] = useState('');
    const [rentValue, setRentValue] = useState('');
    const [isSalaryActive, setIsSalaryActive] = useState(true);
    const [salarySource, setSalarySource] = useState<'salon' | string>('salon');
    const [cpf, setCpf] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        } else if (!loggedInProfessional.permissions?.includes('Funcionários')) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate]);

    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const newLoginId = useMemo(() => {
        const nextId = professionals.length + 1;
        return String(nextId).padStart(3, '0');
    }, [professionals]);

    const groupedServices = useMemo(() => {
        const servicesByCategory: Record<string, Service[]> = {};
        for (const service of services) {
            const category = service.category;
            if (!servicesByCategory[category]) {
                servicesByCategory[category] = [];
            }
            servicesByCategory[category].push(service);
        }
        return servicesByCategory;
    }, [services]);
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleRole = (roleName: string) => {
        setSelectedRoles(prev => prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName]);
    };

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
    };

    const togglePackage = (templateId: string) => {
        const isCurrentlySelected = selectedPackageTemplates.includes(templateId);

        if (isCurrentlySelected) {
            // Deselecting package: remove it from both lists
            setSelectedPackageTemplates(prev => prev.filter(id => id !== templateId));
            setSelectedClientBookablePackages(prev => prev.filter(id => id !== templateId));
        } else {
            // Selecting package: add it to both lists, ensuring no duplicates
            setSelectedPackageTemplates(prev => [...new Set([...prev, templateId])]);
            setSelectedClientBookablePackages(prev => [...new Set([...prev, templateId])]);
        }
    };

    const toggleClientBookable = (templateId: string) => {
        setSelectedClientBookablePackages(prev => 
            prev.includes(templateId)
                ? prev.filter(id => id !== templateId)
                : [...prev, templateId]
        );
    };
    
    const togglePermission = (section: string) => {
        setSelectedPermissions(prev =>
            prev.includes(section)
                ? prev.filter(p => p !== section)
                : [...prev, section]
        );
    };

    const handleWorkingDayToggle = (dayIndex: number) => {
        setWorkingDays(prev => {
            const isIncluded = prev.includes(dayIndex);
            if (isIncluded) {
                return prev.filter(d => d !== dayIndex);
            }
            return [...prev, dayIndex].sort();
        });
    };

    const handleSave = () => {
        if (!name) {
            alert('Por favor, preencha o nome do funcionário.');
            return;
        }
        
        const employeeData: Omit<Professional, 'id'> = {
            name,
            loginId: newLoginId,
            password: '123',
            serviceIds: selectedServices,
            packageTemplateIds: selectedPackageTemplates,
            clientBookablePackageIds: selectedClientBookablePackages,
            permissions: selectedPermissions,
            avatarUrl: avatarPreview || '', // Pass the data URL or empty string
            employmentType,
            fixedSalary: employmentType === 'salaried' ? parseFloat(fixedSalary) || 0 : undefined,
            rentValue: employmentType === 'rented' ? parseFloat(rentValue) || 0 : undefined,
            isSalaryActive: employmentType === 'salaried' ? isSalaryActive : undefined,
            salarySource: employmentType === 'salaried' ? salarySource : undefined,
            cpf,
            phone,
            email,
            ...(hasSpecificHours && { startTime, endTime, workingDays })
        };
        addProfessional(employeeData);
        alert('Funcionário cadastrado com sucesso!');
        navigate('/admin/funcionarios');
    };
    
    const isFormComplete = !!name;

    if (!loggedInProfessional || !loggedInProfessional.permissions?.includes('Funcionários')) {
        return null;
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Cadastrar Funcionário</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 space-y-8">
                <div className="flex flex-col items-center space-y-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button
                        onClick={handleAvatarClick}
                        className="w-28 h-28 bg-gray-800 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-gray-400 transition-colors overflow-hidden"
                        aria-label="Selecionar foto do funcionário"
                    >
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview do funcionário" className="w-full h-full object-cover" />
                        ) : (
                            <CameraIcon className="w-10 h-10 text-gray-500" />
                        )}
                    </button>
                    <p className="text-sm text-gray-400">Foto do Perfil</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                        <input
                            type="text"
                            id="fullName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: Ana Silva"
                        />
                    </div>
                     <div>
                        <label htmlFor="loginId" className="block text-sm font-medium text-gray-300 mb-2">Código de Acesso (Login)</label>
                        <input
                            type="text"
                            id="loginId"
                            value={newLoginId}
                            readOnly
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                        />
                         <p className="text-xs text-gray-500 mt-1">A senha padrão é "123". O funcionário poderá alterá-la depois.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-gray-800 pb-2">Informações de Contato e Recuperação</h3>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: ana.silva@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: (11) 99999-9999"
                        />
                    </div>
                    <div>
                        <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
                        <input
                            type="text"
                            id="cpf"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: 123.456.789-00"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Função</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableRoles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => toggleRole(role.name)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    selectedRoles.includes(role.name) ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'
                                }`}
                            >
                                {role.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Tipo de Contrato</h3>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setEmploymentType('commissioned')}
                                className={`flex-1 text-center rounded-md py-3 text-sm font-semibold transition-colors ${employmentType === 'commissioned' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-gray-300'}`}
                            >
                                Comissionado
                            </button>
                            <button
                                onClick={() => setEmploymentType('salaried')}
                                className={`flex-1 text-center rounded-md py-3 text-sm font-semibold transition-colors ${employmentType === 'salaried' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-gray-300'}`}
                            >
                                Salariado
                            </button>
                             <button
                                onClick={() => setEmploymentType('rented')}
                                className={`flex-1 text-center rounded-md py-3 text-sm font-semibold transition-colors ${employmentType === 'rented' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-gray-300'}`}
                            >
                                Aluguel de Sala
                            </button>
                        </div>

                        {employmentType === 'salaried' && (
                            <div className="border-t border-gray-800 pt-4 space-y-4">
                                <div>
                                    <label htmlFor="fixedSalary" className="block text-sm font-medium text-gray-300 mb-2">Salário Fixo (R$)</label>
                                    <input
                                        type="number"
                                        id="fixedSalary"
                                        value={fixedSalary}
                                        onChange={(e) => setFixedSalary(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        placeholder="Ex: 1500.00"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-300">Salário Ativo</p>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isSalaryActive}
                                            onChange={() => setIsSalaryActive(!isSalaryActive)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">Desative esta opção se o funcionário foi promovido e passará a ser 100% comissionado, mantendo o registro do salário anterior.</p>
                                <div>
                                    <label htmlFor="salarySource" className="block text-sm font-medium text-gray-300 mb-2">Fonte do Salário</label>
                                    <select
                                        id="salarySource"
                                        value={salarySource}
                                        onChange={(e) => setSalarySource(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        <option value="salon">Salão</option>
                                        {professionals.map(prof => (
                                            <option key={prof.id} value={prof.id}>{prof.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Defina se o salário é pago pelo salão ou descontado de outro funcionário.</p>
                                </div>
                            </div>
                        )}
                         {employmentType === 'rented' && (
                            <div className="border-t border-gray-800 pt-4 space-y-4">
                                <div>
                                    <label htmlFor="rentValue" className="block text-sm font-medium text-gray-300 mb-2">Valor do Aluguel (R$)</label>
                                    <input
                                        type="number"
                                        id="rentValue"
                                        value={rentValue}
                                        onChange={(e) => setRentValue(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        placeholder="Ex: 800.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Valor mensal cobrado pelo aluguel do espaço.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Permissões do Painel de Controle</h3>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-3">
                        {MANAGEMENT_SECTIONS.map(section => (
                            <div key={section} className="flex items-center justify-between">
                                <p>{section}</p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPermissions.includes(section)}
                                        onChange={() => togglePermission(section)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Horário de Atendimento</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">Usar horário específico?</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasSpecificHours}
                                    onChange={() => setHasSpecificHours(!hasSpecificHours)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        {hasSpecificHours && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800">
                                    <div>
                                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-2">Início</label>
                                        <input
                                            type="time"
                                            id="startTime"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-2">Fim</label>
                                        <input
                                            type="time"
                                            id="endTime"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-medium text-gray-300 mb-3">Dias de Atendimento Específicos</h4>
                                    <div className="space-y-3">
                                        {weekDays.map((day, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <p>{day}</p>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={workingDays.includes(index)}
                                                        onChange={() => handleWorkingDayToggle(index)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Serviços e Pacotes</h3>
                    <div className="space-y-4">
                        {Object.keys(groupedServices).map((category) => (
                            <div key={category}>
                                <h4 className="font-semibold text-gray-400 mb-2">{category}</h4>
                                <div className="bg-gray-900 p-4 rounded-lg space-y-3">
                                    {groupedServices[category].map(service => (
                                        <button
                                            key={service.id}
                                            onClick={() => toggleService(service.id)}
                                            className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${
                                                selectedServices.includes(service.id)
                                                    ? 'bg-gray-700 ring-2 ring-gray-400'
                                                    : 'bg-gray-800 hover:bg-gray-700'
                                            }`}
                                        >
                                            <span className="font-medium">{service.name}</span>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 ${
                                                selectedServices.includes(service.id)
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-500'
                                            }`}>
                                                {selectedServices.includes(service.id) && (
                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div>
                            <h4 className="font-semibold text-gray-400 mb-2">Pacotes</h4>
                            <div className="bg-gray-900 p-4 rounded-lg space-y-3">
                                {packageTemplates.map(pkg => {
                                    const isSelected = selectedPackageTemplates.includes(pkg.id);
                                    const isBookable = selectedClientBookablePackages.includes(pkg.id);

                                    return (
                                        <div key={pkg.id} className={`p-3 rounded-lg transition-all duration-200 ${isSelected ? 'bg-gray-700 ring-2 ring-gray-400' : 'bg-gray-800 hover:bg-gray-700/50'}`}>
                                            <button
                                                onClick={() => togglePackage(pkg.id)}
                                                className="w-full text-left flex justify-between items-center"
                                            >
                                                <div>
                                                    <span className="font-medium">{pkg.name}</span>
                                                    <p className="text-sm text-gray-400">R$ {pkg.price.toFixed(2).replace('.', ',')} - {pkg.sessionCount} sessões</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 transition-colors ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                                    {isSelected && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                            
                                            {isSelected && (
                                                <div className="mt-3 pt-3 border-t border-gray-600">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isBookable}
                                                            onChange={() => toggleClientBookable(pkg.id)}
                                                            className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
                                                        />
                                                        <span className="ml-3 text-sm text-gray-300">Disponível para agendamento pelo cliente</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {packageTemplates.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">Nenhum pacote cadastrado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="fixed inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm">
                <button
                    onClick={handleSave}
                    disabled={!isFormComplete}
                    className="w-full bg-gray-200 text-black font-bold py-3 rounded-2xl text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg"
                >
                    Salvar
                </button>
            </div>
        </div>
    );
};

export default AdminAddEmployeeScreen;