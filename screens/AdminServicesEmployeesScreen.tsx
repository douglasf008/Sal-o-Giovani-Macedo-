import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import XIcon from '../components/icons/XIcon';
import { Appointment, Client, Service, Professional, ClientPackage, ServicePackageTemplate } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import Calendar from '../components/Calendar';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useSalonSettings, SalonSettings } from '../salonSettings';
import { useClients } from '../contexts/ClientsContext';
import { useServices } from '../contexts/ServicesContext';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import PasswordRevealModal from '../components/PasswordRevealModal';
import EllipsisVerticalIcon from '../components/icons/EllipsisVerticalIcon';
import GiftIcon from '../components/icons/GiftIcon';
import { usePackages } from '../contexts/PackagesContext';
import { useDiscounts } from '../contexts/DiscountsContext';

interface AdminBookingModalProps {
    onClose: () => void;
    onSave: (
        appointmentsData: Omit<Appointment, 'id' | 'status'>[],
        idToUpdate?: string,
        options?: { packageToUseId?: string | null, packageToPurchaseId?: string | null }
    ) => void;
    appointmentToEdit?: Appointment | null;
    settings: SalonSettings;
    clients: Client[];
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
    onClose,
    onSave,
    appointmentToEdit,
    settings,
    clients,
}) => {
    const { appointments } = useAppointments();
    const { services: allServices, getServiceCategories: getAllServiceCategories } = useServices();
    const { professionals } = useProfessionals();
    const { getPackagesForClient, packageTemplates: allPackageTemplates } = usePackages();
    const { discounts } = useDiscounts();
    
    // Filter to only show salon-owned services and packages
    const services = useMemo(() => allServices.filter(s => !s.ownerId), [allServices]);
    const packageTemplates = useMemo(() => allPackageTemplates.filter(p => !p.ownerId), [allPackageTemplates]);
    const serviceCategories = useMemo(() => [...new Set(services.map(s => s.category))], [services]);
    
    const isEditing = !!appointmentToEdit;

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [customServiceName, setCustomServiceName] = useState('');
    const [customServicePrice, setCustomServicePrice] = useState('');

    const [clientPackages, setClientPackages] = useState<(ClientPackage & { template: ServicePackageTemplate | undefined })[]>([]);
    const [selectedClientPackage, setSelectedClientPackage] = useState<(ClientPackage & { template: ServicePackageTemplate | undefined }) | null>(null);
    const [packageToPurchase, setPackageToPurchase] = useState<ServicePackageTemplate | null>(null);

    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [isTimeUnlocked, setIsTimeUnlocked] = useState(false);
    const [isPasswordModalOpenForCustomService, setIsPasswordModalOpenForCustomService] = useState(false);

    const getDiscountedPrice = (item: Service | ServicePackageTemplate, itemType: 'service' | 'package', date: Date | null) => {
        if (!date) {
            return { originalPrice: item.price, discountedPrice: null };
        }

        const dayOfWeek = date.getDay();
        const activeDiscount = discounts.find(d => 
            d.itemId === item.id && 
            d.itemType === itemType && 
            d.days.includes(dayOfWeek)
        );

        if (!activeDiscount) {
            return { originalPrice: item.price, discountedPrice: null };
        }

        let newPrice: number;
        if (activeDiscount.discountType === 'PERCENT') {
            newPrice = item.price * (1 - activeDiscount.discountValue / 100);
        } else { // FIXED
            newPrice = item.price - activeDiscount.discountValue;
        }

        return { originalPrice: item.price, discountedPrice: Math.max(0, newPrice) };
    };

    const allTimeSlots = useMemo(() => {
        const slots = [];
        let currentTime = new Date(`1970-01-01T00:00:00`);
        const endTime = new Date(`1970-01-01T23:59:00`);

        while (currentTime < endTime) {
            slots.push(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
        return slots;
    }, []);

    const totalDuration = useMemo(() => {
        return selectedServices.reduce((sum, service) => sum + (service.duration || 30), 0);
    }, [selectedServices]);

    const slotsNeeded = useMemo(() => Math.ceil(totalDuration / 30), [totalDuration]);

    useEffect(() => {
        if (appointmentToEdit) {
            const client = clients.find(c => c.id === appointmentToEdit.clientId);
            if (client) {
                setSelectedClient(client);
            }
            setSelectedServices([appointmentToEdit.service]);
            setSelectedProfessional(appointmentToEdit.professional);
            setSelectedDate(new Date(appointmentToEdit.date));
            setSelectedTimes(appointmentToEdit.time.split('/').map(t => t.trim()));

            const serviceCategory = services.find(s => s.id === appointmentToEdit.service.id)?.category;
            if (serviceCategory) {
                setSelectedCategory(serviceCategory);
            }
        }
    }, [appointmentToEdit, clients, services]);

    useEffect(() => {
        if (selectedClient) {
            const packages = getPackagesForClient(selectedClient.id);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activePackages = packages.filter(p => p.creditsRemaining > 0 && new Date(p.expiryDate) >= today);
            setClientPackages(activePackages);

            // If editing an appointment that used a package, pre-select it
            if (appointmentToEdit?.clientPackageId) {
                const preselectedPackage = activePackages.find(p => p.id === appointmentToEdit.clientPackageId);
                if (preselectedPackage) {
                    setSelectedClientPackage(preselectedPackage);
                }
            }
        } else {
            setClientPackages([]);
            setSelectedClientPackage(null);
            setPackageToPurchase(null);
        }
    }, [selectedClient, getPackagesForClient, appointmentToEdit]);

    const purchasablePackages = useMemo(() => {
        if (!selectedClient) return [];
        const activeOwnedTemplateIds = new Set(clientPackages.map(p => p.template?.id));
        return packageTemplates.filter(t => !activeOwnedTemplateIds.has(t.id));
    }, [packageTemplates, clientPackages, selectedClient]);


    const handlePackageSelect = (pkg: ClientPackage & { template: ServicePackageTemplate | undefined }) => {
        const isDeselecting = selectedClientPackage?.id === pkg.id;

        if (isDeselecting) {
            setSelectedClientPackage(null);
            setSelectedServices([]);
            setSelectedTimes([]);
        } else {
            setSelectedClientPackage(pkg);
            setPackageToPurchase(null); // Clear purchase intent
            const serviceForPackage = services.find(s => s.id === pkg.template?.serviceId);
            if (serviceForPackage) {
                setSelectedServices([serviceForPackage]);
                setCustomServiceName('');
                setCustomServicePrice('');
            } else {
                setSelectedServices([]);
            }
            setSelectedTimes([]);
        }
    };

    const handlePackagePurchaseSelect = (template: ServicePackageTemplate) => {
        const isDeselecting = packageToPurchase?.id === template.id;

        if (isDeselecting) {
            setPackageToPurchase(null);
            if (selectedServices.length === 1 && selectedServices[0].id === template.serviceId) {
                setSelectedServices([]);
            }
        } else {
            setPackageToPurchase(template);
            setSelectedClientPackage(null); // Clear active package selection
            const serviceForPackage = services.find(s => s.id === template.serviceId);
            if (serviceForPackage) {
                setSelectedServices([serviceForPackage]);
                setCustomServiceName('');
                setCustomServicePrice('');
            } else {
                setSelectedServices([]);
            }
            setSelectedTimes([]);
        }
    };

    const toggleService = (service: Service) => {
        if (isEditing) {
            setSelectedServices([service]);
        } else {
            setSelectedServices(prev =>
                prev.some(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]
            );
        }
    };

    const handleAddCustomService = () => {
        if (customServiceName && customServicePrice) {
            const newService: Service = {
                id: `custom-${Date.now()}`,
                category: 'Personalizado',
                name: customServiceName,
                description: 'Serviço adicionado manualmente',
                price: parseFloat(customServicePrice),
                commissionPercentage: settings.defaultCommissionPercentage,
                duration: 30 // Default duration for custom services
            };
            if (isEditing) {
                setSelectedServices([newService]);
            } else {
                setSelectedServices(prev => [...prev, newService]);
            }
            setCustomServiceName('');
            setCustomServicePrice('');
        }
    };

    const handleInitiateAddCustomService = () => {
        if (settings.privacyPassword) {
            setIsPasswordModalOpenForCustomService(true);
        } else {
            // If no password is set, add directly.
            handleAddCustomService();
        }
    };

    const handlePasswordConfirmForCustomService = (password: string) => {
        if (password === settings.privacyPassword) {
            handleAddCustomService();
            setIsPasswordModalOpenForCustomService(false);
        } else {
            alert('Senha de privacidade incorreta!');
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term) {
            setFilteredClients(
                clients.filter(c => c.name.toLowerCase().includes(term.toLowerCase()))
            );
        } else {
            setFilteredClients([]);
        }
    };

    const handleSave = () => {
        if (!selectedClient || selectedServices.length === 0 || !selectedProfessional || !selectedDate || selectedTimes.length === 0) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const isUsingPackage = !!selectedClientPackage;
        const combinedTime = selectedTimes.sort().join(' / ');

        const newAppointmentsData: Omit<Appointment, 'id' | 'status'>[] = selectedServices.map(service => {
            let finalCommission = 0;
            
            const override = selectedProfessional?.commissionOverrides?.find(o => o.itemType === 'service' && o.itemId === service.id);
    
            if (override) {
                finalCommission = override.percentage;
            } else {
                finalCommission = service.commissionPercentage ?? settings.defaultCommissionPercentage;
            }

            return {
                clientId: selectedClient.id,
                service,
                professional: selectedProfessional!,
                date: selectedDate,
                time: combinedTime,
                commissionPercentage: finalCommission,
                paymentStatus: isUsingPackage ? 'paid_with_package' : 'not_applicable',
                clientPackageId: isUsingPackage ? selectedClientPackage!.id : undefined,
                ownerId: service.ownerId,
            };
        });

        onSave(newAppointmentsData, appointmentToEdit?.id, {
            packageToUseId: selectedClientPackage?.id,
            packageToPurchaseId: packageToPurchase?.id,
        });
    };

    const isFormComplete = selectedClient && selectedServices.length > 0 && selectedProfessional && selectedDate && selectedTimes.length > 0;

    const bookedTimes = useMemo(() => {
        if (!selectedDate || !selectedProfessional) return new Set();
        const times = new Set<string>();
        appointments
            .filter(app =>
                new Date(app.date).toDateString() === selectedDate.toDateString() &&
                app.professional.id === selectedProfessional.id &&
                (!isEditing || app.id !== appointmentToEdit.id)
            )
            .forEach(app => {
                app.time.split('/').forEach(t => times.add(t.trim()));
            });
        return times;
    }, [appointments, selectedDate, selectedProfessional, appointmentToEdit, isEditing]);


    const handleTimeSelect = (time: string) => {
        const isCurrentlySelected = selectedTimes.includes(time);

        if (isCurrentlySelected) {
            setSelectedTimes(prev => prev.filter(t => t !== time));
            return;
        }

        // If the 'unlock times' toggle is on, we allow selecting a booked slot without confirmation.
        // The UI (red color) serves as the warning.
        setSelectedTimes(prev => [...prev, time].sort());
    };

    const startTimeToUse = selectedProfessional?.startTime || settings.startTime;
    const endTimeToUse = selectedProfessional?.endTime || settings.endTime;

    const isProfWorkingOnSelectedDate = useMemo(() => {
        if (!selectedProfessional || !selectedDate) {
            return true; // Default to true to not block UI unnecessarily before selection
        }
        const dayOfWeek = selectedDate.getDay();
        const workingDaysForProf = selectedProfessional.workingDays ?? settings.workingDays;
        return workingDaysForProf.includes(dayOfWeek);
    }, [selectedDate, selectedProfessional, settings.workingDays]);


    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <header className="flex items-center p-4 border-b border-gray-800">
                <button onClick={onClose} className="p-2 -ml-2"><XIcon /></button>
                <h1 className="text-xl font-bold mx-auto">{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <div className="flex-grow overflow-y-auto px-4 pb-24 space-y-6 pt-4">
                {/* Client */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Cliente</h2>
                    {selectedClient ? (
                        <div className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center">
                                <img src={selectedClient.avatarUrl} alt={selectedClient.name} className="w-10 h-10 rounded-full mr-3" />
                                <div>
                                    <p className="font-semibold">{selectedClient.name}</p>
                                    <p className="text-sm text-gray-400">{selectedClient.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedClient(null)} className="text-sm text-blue-400 hover:text-blue-300 font-semibold">Trocar</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar cliente pelo nome..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                            {searchTerm && (
                                <div className="absolute w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg max-h-48 overflow-y-auto z-10">
                                    {filteredClients.length > 0 ? filteredClients.map(client => (
                                        <div key={client.id} onClick={() => { setSelectedClient(client); setSearchTerm(''); }} className="p-3 hover:bg-gray-800 cursor-pointer flex items-center">
                                            <img src={client.avatarUrl} alt={client.name} className="w-8 h-8 rounded-full mr-3" />
                                            <p>{client.name}</p>
                                        </div>
                                    )) : <p className="p-3 text-gray-500">Nenhum cliente encontrado.</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Packages */}
                {selectedClient && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Pacotes do Cliente</h2>
                            {clientPackages.length > 0 ? (
                                <div className="space-y-2">
                                    {clientPackages.map(pkg => (
                                        <button
                                            key={pkg.id}
                                            onClick={() => handlePackageSelect(pkg)}
                                            className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${selectedClientPackage?.id === pkg.id ? 'bg-gray-700 ring-2 ring-cyan-400' : 'bg-gray-800 hover:bg-gray-700'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <GiftIcon className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold">{pkg.template?.name}</p>
                                                    <p className="text-sm text-gray-400">
                                                        {pkg.creditsRemaining} crédito(s) restante(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 ${selectedClientPackage?.id === pkg.id ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                                {selectedClientPackage?.id === pkg.id && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 bg-gray-900 p-4 rounded-lg">Este cliente não possui pacotes ativos.</p>
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-3">Comprar Pacote</h2>
                            {purchasablePackages.length > 0 ? (
                                <div className="space-y-2">
                                    {purchasablePackages.map(template => {
                                        const { originalPrice, discountedPrice } = getDiscountedPrice(template, 'package', selectedDate);
                                        return (
                                        <button
                                            key={template.id}
                                            onClick={() => handlePackagePurchaseSelect(template)}
                                            className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${packageToPurchase?.id === template.id ? 'bg-gray-700 ring-2 ring-gray-400' : 'bg-gray-800 hover:bg-gray-700'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                 <GiftIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold">{template.name}</p>
                                                    <p className="text-sm text-gray-400">
                                                        {template.sessionCount} sessões por{' '}
                                                        {discountedPrice !== null ? (
                                                            <>
                                                                <span className="line-through">R$ {originalPrice.toFixed(2).replace('.', ',')}</span>
                                                                <span className="font-bold text-green-400 ml-2">R$ {discountedPrice.toFixed(2).replace('.', ',')}</span>
                                                            </>
                                                        ) : (
                                                            `R$ ${originalPrice.toFixed(2).replace('.', ',')}`
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 ${packageToPurchase?.id === template.id ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                                {packageToPurchase?.id === template.id && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                 <p className="text-sm text-gray-500 bg-gray-900 p-4 rounded-lg">Não há novos pacotes disponíveis para compra.</p>
                            )}
                        </div>
                    </div>
                )}


                {/* Service */}
                <div>
                    <h2 className={`text-lg font-semibold mb-3 ${selectedClientPackage || packageToPurchase ? 'text-gray-500' : ''}`}>Serviço</h2>
                    <fieldset disabled={!!selectedClientPackage || !!packageToPurchase} className="disabled:opacity-50">
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                            {serviceCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                                    className={`px-5 py-2 rounded-lg text-sm transition-colors ${selectedCategory === category ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'}`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        {selectedCategory && (
                            <div className="mt-4 space-y-2">
                                {services.filter(s => s.category === selectedCategory).map(service => {
                                    const { originalPrice, discountedPrice } = getDiscountedPrice(service, 'service', selectedDate);
                                    return (
                                    <button
                                        key={service.id}
                                        onClick={() => toggleService(service)}
                                        className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${selectedServices.some(s => s.id === service.id) ? 'bg-gray-700 ring-2 ring-gray-400' : 'bg-gray-800 hover:bg-gray-700'}`}
                                    >
                                        <div>
                                            <p className="font-semibold">{service.name}</p>
                                            <p className="text-sm text-gray-400">
                                                 {discountedPrice !== null ? (
                                                    <>
                                                        <span className="line-through">R$ {originalPrice.toFixed(2).replace('.', ',')}</span>
                                                        <span className="font-bold text-green-400 ml-2">R$ {discountedPrice.toFixed(2).replace('.', ',')}</span>
                                                    </>
                                                ) : (
                                                    `R$ ${originalPrice.toFixed(2).replace('.', ',')}`
                                                )}
                                                {service.duration && ` / ${service.duration} min`}
                                            </p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 ${selectedServices.some(s => s.id === service.id) ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                            {selectedServices.some(s => s.id === service.id) && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                    );
                                })}
                            </div>
                        )}
                        <div className="mt-4 border-t border-gray-800 pt-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Não encontrou o serviço? Adicione um personalizado.</h4>
                            <input
                                type="text"
                                placeholder="Nome do serviço"
                                value={customServiceName}
                                onChange={(e) => setCustomServiceName(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Valor (R$)"
                                    value={customServicePrice}
                                    onChange={(e) => setCustomServicePrice(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                                <button
                                    onClick={handleInitiateAddCustomService}
                                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    disabled={!customServiceName || !customServicePrice}
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </fieldset>
                </div>

                {/* Professional */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Profissional</h2>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                        {professionals.map(prof => (
                            <button
                                key={prof.id}
                                onClick={() => setSelectedProfessional(prof)}
                                className={`px-5 py-2 rounded-lg text-sm transition-colors ${selectedProfessional?.id === prof.id ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'}`}
                            >
                                {prof.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Data</h2>
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={(date) => {
                            setSelectedDate(date);
                            setSelectedTimes([]);
                        }}
                        disablePastDates={false}
                    />
                </div>

                {/* Time */}
                {selectedProfessional && selectedDate && (
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-semibold">
                                Horário
                                {slotsNeeded > 0 && selectedServices.length > 0 && (
                                    <span className="text-sm font-normal text-gray-400 ml-2">
                                        (Duração: {totalDuration} min / {slotsNeeded} slot{slotsNeeded > 1 ? 's' : ''})
                                    </span>
                                )}
                            </h2>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="unlock-toggle" className="text-sm text-gray-400">Desbloquear horários</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="unlock-toggle"
                                        checked={isTimeUnlocked}
                                        onChange={() => setIsTimeUnlocked(!isTimeUnlocked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {allTimeSlots.map(time => {
                                const isSelected = selectedTimes.includes(time);
                                const isBooked = bookedTimes.has(time);
                                const isDisabled = isBooked && !isTimeUnlocked;
                                const isWithinWorkingHours = isProfWorkingOnSelectedDate && time >= startTimeToUse && time < endTimeToUse;

                                let buttonClass = 'p-3 rounded-lg text-sm font-semibold transition-colors ';
                                if (isSelected) {
                                    buttonClass += 'bg-gray-200 text-black ring-2 ring-offset-2 ring-offset-black ring-white';
                                } else if (isDisabled) {
                                    buttonClass += 'bg-gray-900 text-gray-600 line-through cursor-not-allowed';
                                } else if (isBooked) {
                                    buttonClass += 'bg-red-900/60 text-white hover:bg-red-800/80';
                                } else if (!isWithinWorkingHours) {
                                    buttonClass += 'bg-yellow-900/40 text-yellow-200 hover:bg-yellow-800/60';
                                } else {
                                    buttonClass += 'bg-gray-800 text-white hover:bg-gray-700';
                                }


                                return (
                                    <button
                                        key={time}
                                        onClick={() => !isDisabled && handleTimeSelect(time)}
                                        disabled={isDisabled}
                                        className={buttonClass}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedTimes.length > 0 && slotsNeeded > 0 && selectedServices.length > 0 && selectedTimes.length !== slotsNeeded && (
                            <div className="mt-3 p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                                Atenção: O número de slots selecionados ({selectedTimes.length}) é diferente do necessário para a duração total dos serviços ({slotsNeeded}).
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-black border-t border-gray-800">
                <button
                    onClick={handleSave}
                    disabled={!isFormComplete}
                    className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                >
                    {isEditing ? 'Salvar Alterações' : (packageToPurchase ? 'Comprar e Agendar' : 'Criar Agendamento')}
                </button>
            </div>
            {isPasswordModalOpenForCustomService && (
                <PasswordRevealModal
                    isOpen={isPasswordModalOpenForCustomService}
                    onClose={() => setIsPasswordModalOpenForCustomService(false)}
                    onConfirm={handlePasswordConfirmForCustomService}
                />
            )}
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                <p className="text-gray-300 mb-6">Tem certeza que deseja apagar este agendamento? Esta ação não pode ser desfeita.</p>
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


const AdminServicesEmployeesScreen: React.FC = () => {
    const navigate = useNavigate();
    const { appointments, addAdminAppointment, deleteAppointment, updateAppointment } = useAppointments();
    const { clients } = useClients();
    const { settings } = useSalonSettings();
    const { services } = useServices();
    const { professionals } = useProfessionals();
    const { useCredit, returnCredit, buyPackage, packageTemplates } = usePackages();
    const { discounts } = useDiscounts();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string | null>(null);

    const [activeMenuAppointmentId, setActiveMenuAppointmentId] = useState<string | null>(null);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const getDiscountedPrice = (item: Service, date: Date): { originalPrice: number, discountedPrice: number | null } => {
        const dayOfWeek = date.getDay();
        const activeDiscount = discounts.find(d => 
            d.itemId === item.id && 
            d.itemType === 'service' && 
            d.days.includes(dayOfWeek)
        );

        if (!activeDiscount) {
            return { originalPrice: item.price, discountedPrice: null };
        }

        let newPrice: number;
        if (activeDiscount.discountType === 'PERCENT') {
            newPrice = item.price * (1 - activeDiscount.discountValue / 100);
        } else { // FIXED
            newPrice = item.price - activeDiscount.discountValue;
        }

        return { originalPrice: item.price, discountedPrice: Math.max(0, newPrice) };
    };

    const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Cliente';

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
        setActiveMenuAppointmentId(null);
    };

    const handleSaveAppointment = (
        newAppointmentsData: Omit<Appointment, 'id' | 'status'>[],
        idToUpdate?: string,
        options?: { packageToUseId?: string | null, packageToPurchaseId?: string | null }
    ) => {
        const { packageToUseId, packageToPurchaseId } = options || {};

        if (idToUpdate) {
            const originalAppointment = appointments.find(app => app.id === idToUpdate);
            // If the package changed, return the credit from the old one
            if (originalAppointment?.clientPackageId && originalAppointment.clientPackageId !== packageToUseId) {
                returnCredit(originalAppointment.clientPackageId);
            }
            deleteAppointment(idToUpdate);
        }

        if (packageToPurchaseId) {
            // Create an appointment with a pending status. The cashier will handle the actual package purchase.
            const appointmentWithPurchaseIntent = {
                ...newAppointmentsData[0], // Assuming one service per new package purchase booking
                paymentStatus: 'pending_package_purchase' as const,
                pendingPackagePurchaseId: packageToPurchaseId,
                clientPackageId: undefined, // Ensure this is not set yet
            };
            addAdminAppointment(appointmentWithPurchaseIntent);
        } else {
            // Logic for regular appointment or using an existing package
            newAppointmentsData.forEach(addAdminAppointment);

            if (packageToUseId) {
                const originalAppointment = appointments.find(app => app.id === idToUpdate);
                // Deduct credit only if it's a new booking with a package or an edit where the package is different
                if (!originalAppointment || originalAppointment.clientPackageId !== packageToUseId) {
                    useCredit(packageToUseId);
                }
            }
        }
    
        setIsModalOpen(false);
        setAppointmentToEdit(null);
    };

    const handleOpenModal = () => {
        setAppointmentToEdit(null);
        setIsModalOpen(true);
        setActiveMenuAppointmentId(null);
    };

    const handleEditClick = (appointment: Appointment) => {
        setAppointmentToEdit(appointment);
        setIsModalOpen(true);
        setActiveMenuAppointmentId(null);
    };

    const handleDeleteClick = (appointment: Appointment) => {
        setAppointmentToDelete(appointment);
        setIsDeleteConfirmOpen(true);
        setActiveMenuAppointmentId(null);
    };

    const confirmDelete = () => {
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


    const appointmentsForSelectedDate = useMemo(() => {
        return appointments
            .filter(app => !app.service.ownerId) // Filter out personal services
            .filter(app => {
                const appDate = new Date(app.date);
                return appDate.toDateString() === selectedDate.toDateString();
            })
            .filter(app => {
                return !selectedProfessionalFilter || app.professional.id === selectedProfessionalFilter;
            })
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, selectedDate, selectedProfessionalFilter]);

    return (
        <div className="flex flex-col h-screen bg-black text-white" onClick={() => activeMenuAppointmentId && setActiveMenuAppointmentId(null)}>
            <header className="flex items-center p-4">
                <button onClick={() => navigate('/admin')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Agenda de Serviços</h1>
                <div className="w-6 h-6"></div>
            </header>

            <div className="px-4">
                <div className="flex space-x-3 overflow-x-auto pb-2">
                    <button onClick={() => setSelectedProfessionalFilter(null)} className={`px-4 py-2 rounded-lg text-sm transition-colors ${!selectedProfessionalFilter ? 'bg-gray-200 text-black' : 'bg-gray-800'}`}>
                        Todos
                    </button>
                    {professionals.map(prof => (
                        <button key={prof.id} onClick={() => setSelectedProfessionalFilter(prof.id)} className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${selectedProfessionalFilter === prof.id ? 'bg-gray-200 text-black' : 'bg-gray-800'}`}>
                            {prof.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto px-4 pt-4 pb-24">
                <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateChange}
                    disablePastDates={false}
                />

                <div className="mt-6 space-y-3">
                    <h2 className="font-bold text-lg mb-2">
                        {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                    {appointmentsForSelectedDate.length > 0 ? (
                        appointmentsForSelectedDate.map(app => {
                            const isCompleted = app.status === 'completed';

                            const timeSlots = app.time.split(' / ').filter(t => t.trim() !== '');
                            const startTime = timeSlots[0] || '';
                            let endTime = startTime;

                            if (timeSlots.length > 1) {
                                const lastSlotTime = timeSlots[timeSlots.length - 1];
                                const [h, m] = lastSlotTime.split(':').map(Number);
                                const endDateTemp = new Date();
                                endDateTemp.setHours(h, m + 30); // Assuming 30-min slots
                                endTime = endDateTemp.toTimeString().substring(0, 5);
                            }

                            const displayTime = timeSlots.length > 1 ? `${startTime} - ${endTime}` : startTime;
                            const { originalPrice, discountedPrice } = getDiscountedPrice(app.service, app.date);

                            return (
                                <div
                                    key={app.id}
                                    className={`bg-gray-900 p-4 rounded-lg flex items-center justify-between relative ${isCompleted ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <span className={`font-semibold text-gray-300 w-28 text-center ${isCompleted ? 'line-through' : ''}`}>{displayTime}</span>
                                        <div className="border-l-2 border-gray-700 pl-4">
                                            <p className={`flex items-center gap-2 flex-wrap ${isCompleted ? 'line-through' : ''}`}>
                                                <span>
                                                    {app.service.name} -{' '}
                                                    {discountedPrice !== null ? (
                                                        <>
                                                            <span className="text-gray-500 line-through">R$ {originalPrice.toFixed(2).replace('.', ',')}</span>
                                                            <span className="font-bold text-green-400">R$ {discountedPrice.toFixed(2).replace('.', ',')}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">R$ {app.service.price.toFixed(2).replace('.', ',')}</span>
                                                    )}
                                                </span>
                                                {app.paymentStatus === 'paid' && (
                                                    <span className="text-xs font-bold bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full align-middle">
                                                        PAGO
                                                    </span>
                                                )}
                                                {app.paymentStatus === 'paid_with_package' && (
                                                    <span className="text-xs font-bold bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded-full align-middle inline-flex items-center gap-1">
                                                        <GiftIcon className="w-3 h-3" /> PACOTE
                                                    </span>
                                                )}
                                                 {app.paymentStatus === 'pending_package_purchase' && (
                                                    <span className="text-xs font-bold bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full align-middle inline-flex items-center gap-1">
                                                        <GiftIcon className="w-3 h-3" /> COMPRAR PACOTE
                                                    </span>
                                                )}
                                            </p>
                                            <p className={`text-sm text-gray-400 ${isCompleted ? 'line-through' : ''}`}>{getClientName(app.clientId)} com {app.professional.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <img src={app.professional.avatarUrl} alt={app.professional.name} className="w-10 h-10 rounded-full ml-2" />
                                        <div className="relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuAppointmentId(app.id === activeMenuAppointmentId ? null : app.id); }}
                                                className="p-2 text-gray-400 rounded-full hover:bg-gray-800"
                                            >
                                                <EllipsisVerticalIcon className="w-5 h-5" />
                                            </button>
                                            {activeMenuAppointmentId === app.id && (
                                                <div className="absolute right-0 top-full mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => handleEditClick(app)} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Editar</button>
                                                    <button onClick={() => handleDeleteClick(app)} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Apagar</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum agendamento para esta data.</p>
                    )}
                </div>
            </div>

            <div className="fixed bottom-6 right-6 max-w-md mx-auto w-full flex justify-end pr-10">
                <button onClick={handleOpenModal} className="bg-gray-200 text-black rounded-full p-4 shadow-lg hover:bg-white transition-colors">
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
            {isModalOpen && <AdminBookingModal onClose={() => setIsModalOpen(false)} onSave={handleSaveAppointment} appointmentToEdit={appointmentToEdit} settings={settings} clients={clients} />}
            <DeleteConfirmationModal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={confirmDelete} />
        </div>
    );
};

export default AdminServicesEmployeesScreen;
