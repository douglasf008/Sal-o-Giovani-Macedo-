import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, Client, Service, Professional, ClientPackage, ServicePackageTemplate } from '../types';
import XIcon from './icons/XIcon';
import Calendar from './Calendar';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useSalonSettings } from '../salonSettings';
import { useClients } from '../contexts/ClientsContext';
import { useServices } from '../contexts/ServicesContext';
import { usePackages } from '../contexts/PackagesContext';
import GiftIcon from './icons/GiftIcon';

interface PersonalBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (appointmentData: Omit<Appointment, 'id' | 'status'> & { id?: string }, packageToUseId?: string) => void;
    employee: Professional;
    appointmentToEdit?: Appointment | null;
    initialDate: Date;
}

const PersonalBookingModal: React.FC<PersonalBookingModalProps> = ({ isOpen, onClose, onSave, employee, appointmentToEdit, initialDate }) => {
    const { appointments } = useAppointments();
    const { services: allServices } = useServices();
    const { settings } = useSalonSettings();
    const { clients } = useClients();
    const { getPackagesForClient } = usePackages();

    const isEditing = !!appointmentToEdit;

    const personalServices = useMemo(() => allServices.filter(s => s.ownerId === employee.id), [allServices, employee.id]);
    const serviceCategories = useMemo(() => [...new Set(personalServices.map(s => s.category))], [personalServices]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(serviceCategories[0] || null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    
    const [clientPackages, setClientPackages] = useState<(ClientPackage & { template: ServicePackageTemplate | undefined })[]>([]);
    const [selectedClientPackage, setSelectedClientPackage] = useState<(ClientPackage & { template: ServicePackageTemplate | undefined }) | null>(null);

    const totalDuration = useMemo(() => selectedService ? (selectedService.duration || 30) : 0, [selectedService]);
    const slotsNeeded = useMemo(() => Math.ceil(totalDuration / 30), [totalDuration]);
    
    useEffect(() => {
        if (isOpen) {
            if (appointmentToEdit) {
                // Editing mode: populate form from appointmentToEdit
                const client = clients.find(c => c.id === appointmentToEdit.clientId);
                setSelectedClient(client || null);
                setSelectedService(appointmentToEdit.service);
                setSelectedCategory(appointmentToEdit.service.category);
                setSelectedDate(new Date(appointmentToEdit.date));
                setSelectedTimes(appointmentToEdit.time.split('/').map(t => t.trim()));

                if (appointmentToEdit.clientPackageId) {
                    const packages = getPackagesForClient(appointmentToEdit.clientId);
                    const preselectedPackage = packages.find(p => p.id === appointmentToEdit.clientPackageId);
                    setSelectedClientPackage(preselectedPackage || null);
                } else {
                    setSelectedClientPackage(null);
                }
            } else {
                // Creating mode: reset form to initial state
                setSelectedClient(null);
                setSelectedService(null);
                setSelectedCategory(serviceCategories[0] || null);
                setSelectedDate(initialDate); // Use date from dashboard
                setSelectedTimes([]);
                setSearchTerm('');
                setClientPackages([]);
                setSelectedClientPackage(null);
            }
        }
    }, [isOpen, appointmentToEdit, clients, getPackagesForClient, serviceCategories, initialDate]);

    useEffect(() => {
        if (selectedClient) {
            const packages = getPackagesForClient(selectedClient.id);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activePersonalPackages = packages.filter(p =>
                p.template?.ownerId === employee.id &&
                p.creditsRemaining > 0 &&
                new Date(p.expiryDate) >= today
            );
            setClientPackages(activePersonalPackages);
        } else {
            setClientPackages([]);
            setSelectedClientPackage(null);
        }
    }, [selectedClient, getPackagesForClient, employee.id]);

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

    const handlePackageSelect = (pkg: ClientPackage & { template: ServicePackageTemplate | undefined }) => {
        const isDeselecting = selectedClientPackage?.id === pkg.id;

        if (isDeselecting) {
            setSelectedClientPackage(null);
            setSelectedService(null);
            setSelectedTimes([]);
        } else {
            setSelectedClientPackage(pkg);
            const serviceForPackage = personalServices.find(s => s.id === pkg.template?.serviceId);
            if (serviceForPackage) {
                setSelectedService(serviceForPackage);
            } else {
                setSelectedService(null);
            }
            setSelectedTimes([]);
        }
    };
    
    const handleServiceSelect = (service: Service) => {
        if (selectedService?.id === service.id) {
            setSelectedService(null);
        } else {
            setSelectedService(service);
            setSelectedClientPackage(null);
        }
    };


    const handleSaveClick = () => {
        if (!selectedClient || !selectedService || !selectedDate || selectedTimes.length === 0) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        if (selectedTimes.length !== slotsNeeded) {
            if (!window.confirm(`Atenção: Você selecionou ${selectedTimes.length} horários, mas o serviço necessita de ${slotsNeeded}. Deseja continuar assim mesmo?`)) {
                return;
            }
        }

        const combinedTime = selectedTimes.sort().join(' / ');
        const isUsingPackage = !!selectedClientPackage;

        const appointmentData: Omit<Appointment, 'id' | 'status'> & { id?: string } = {
            id: isEditing ? appointmentToEdit.id : undefined,
            clientId: selectedClient!.id,
            service: selectedService!,
            professional: employee,
            date: selectedDate!,
            time: combinedTime,
            paymentStatus: isUsingPackage ? 'paid_with_package' : appointmentToEdit?.paymentStatus || 'pending',
            clientPackageId: isUsingPackage ? selectedClientPackage!.id : undefined,
            ownerId: employee.id,
        };
        onSave(appointmentData, isUsingPackage ? selectedClientPackage!.id : undefined);
    };

    const isFormComplete = selectedClient && selectedService && selectedDate && selectedTimes.length > 0;
    
    const bookedTimes = useMemo(() => {
        if (!selectedDate) return new Set();
        const times = new Set<string>();
        appointments
            .filter(app =>
                new Date(app.date).toDateString() === selectedDate.toDateString() &&
                app.professional.id === employee.id &&
                (!isEditing || app.id !== appointmentToEdit.id)
            )
            .forEach(app => {
                app.time.split('/').forEach(t => times.add(t.trim()));
            });
        return times;
    }, [appointments, selectedDate, employee.id, isEditing, appointmentToEdit]);

    const handleTimeSelect = (time: string) => {
        setSelectedTimes(prev => {
            const isSelected = prev.includes(time);
            if (isSelected) {
                return prev.filter(t => t !== time);
            }
            return [...prev, time].sort();
        });
    };

    const startTimeToUse = employee.startTime || settings.startTime;
    const endTimeToUse = employee.endTime || settings.endTime;
    
    const allTimeSlots = useMemo(() => {
        const slots = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }
        return slots;
    }, []);
    
    const isProfWorkingOnSelectedDate = useMemo(() => {
        if (!selectedDate) return true;
        const dayOfWeek = selectedDate.getDay();
        const workingDaysForProf = employee.workingDays ?? settings.workingDays;
        return workingDaysForProf.includes(dayOfWeek);
    }, [selectedDate, employee.workingDays, settings.workingDays]);
    
    const showTimeSlots = selectedService && selectedDate && (isProfWorkingOnSelectedDate || isEditing);


    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800">
                <button onClick={onClose} className="p-2 -ml-2"><XIcon /></button>
                <h1 className="text-xl font-bold mx-auto">{isEditing ? 'Editar Agendamento' : 'Novo Agendamento Pessoal'}</h1>
                <div className="w-6 h-6"></div>
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
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
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

                {/* Client Packages */}
                {selectedClient && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Pacotes Ativos do Cliente</h2>
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
                            <p className="text-sm text-gray-500 bg-gray-900 p-4 rounded-lg">Este cliente não possui pacotes ativos comigo.</p>
                        )}
                    </div>
                )}


                {/* Service */}
                <fieldset disabled={!!selectedClientPackage} className="disabled:opacity-50">
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Serviço</h2>
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                            {serviceCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                                    className={`px-5 py-2 rounded-lg text-sm ${selectedCategory === category ? 'bg-gray-200 text-black' : 'bg-gray-800'}`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        {selectedCategory && (
                            <div className="mt-4 space-y-2">
                                {personalServices.filter(s => s.category === selectedCategory).map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceSelect(service)}
                                        className={`w-full text-left p-3 rounded-lg flex justify-between items-center ${selectedService?.id === service.id ? 'bg-gray-700 ring-2 ring-gray-400' : 'bg-gray-800 hover:bg-gray-700'}`}
                                    >
                                        <div>
                                            <p className="font-semibold">{service.name}</p>
                                            <p className="text-sm text-gray-400">R$ {service.price.toFixed(2).replace('.', ',')}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${selectedService?.id === service.id ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                            {selectedService?.id === service.id && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </fieldset>

                {/* Date */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Data</h2>
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={(date) => { setSelectedDate(date); setSelectedTimes([]); }}
                        disablePastDates={false}
                    />
                </div>

                {/* Time */}
                {showTimeSlots && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Horário ({slotsNeeded} slot{slotsNeeded > 1 ? 's' : ''})</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {allTimeSlots.map(time => {
                                const isSelected = selectedTimes.includes(time);
                                const isBooked = bookedTimes.has(time);
                                const isWithinWorkingHours = isProfWorkingOnSelectedDate && time >= startTimeToUse && time < endTimeToUse;
                                
                                let buttonClass = 'p-3 rounded-lg text-sm font-semibold transition-colors ';

                                if (isSelected) {
                                    buttonClass += 'bg-gray-200 text-black ring-2 ring-offset-2 ring-offset-black ring-white';
                                } else if (isBooked) {
                                    buttonClass += 'bg-gray-900 text-gray-600 line-through cursor-not-allowed';
                                } else if (!isWithinWorkingHours) {
                                    buttonClass += 'bg-yellow-900/40 text-yellow-200 hover:bg-yellow-800/60';
                                } else {
                                    buttonClass += 'bg-gray-700 text-white hover:bg-gray-600';
                                }
                                
                                return (
                                    <button
                                        key={time}
                                        onClick={() => !isBooked && handleTimeSelect(time)}
                                        disabled={isBooked}
                                        className={buttonClass}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedTimes.length > 0 && slotsNeeded > 0 && selectedTimes.length !== slotsNeeded && (
                            <div className="mt-3 p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                                Atenção: Slots selecionados ({selectedTimes.length}) diferente do necessário ({slotsNeeded}).
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-black border-t border-gray-800">
                <button
                    onClick={handleSaveClick}
                    disabled={!isFormComplete}
                    className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white disabled:bg-gray-700 disabled:text-gray-400"
                >
                    {isEditing ? 'Salvar Alterações' : 'Criar Agendamento'}
                </button>
            </div>
        </div>
    );
}

export default PersonalBookingModal;
