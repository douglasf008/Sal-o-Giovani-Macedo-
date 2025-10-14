import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Professional, ClientPackage, ServicePackageTemplate } from '../types';
import Calendar from '../components/Calendar';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import { useSalonSettings } from '../salonSettings';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useServices } from '../contexts/ServicesContext';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import PromotionalModal from '../components/PromotionalModal';
import { usePackages } from '../contexts/PackagesContext';
import WarningIcon from '../components/icons/WarningIcon';
import XIcon from '../components/icons/XIcon';
import GiftIcon from '../components/icons/GiftIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import { useDiscounts } from '../contexts/DiscountsContext';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useAuth } from '../contexts/AuthContext';

const BookingScreen: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSalonSettings();
    const { appointments } = useAppointments();
    const { services: allServices } = useServices();
    const { professionals } = useProfessionals();
    const { getPackagesForClient, packageTemplates: allPackageTemplates } = usePackages();
    const { discounts } = useDiscounts();
    const { currentClient } = useAuth();

    const clientId = currentClient?.id;

    const services = useMemo(() => {
        const clientBookablePersonalServiceIds = new Set(
            professionals.flatMap(p => p.clientBookablePersonalServiceIds || [])
        );
        return allServices.filter(s => s.isPublic !== false || clientBookablePersonalServiceIds.has(s.id));
    }, [allServices, professionals]);


    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>('Corte');
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);
    
    const [selectedPackage, setSelectedPackage] = useState<(ClientPackage & { template: ServicePackageTemplate | undefined }) | null>(null);
    const [applicablePackage, setApplicablePackage] = useState<(ClientPackage & { template: ServicePackageTemplate | undefined }) | null>(null);
    const [packageToPurchase, setPackageToPurchase] = useState<ServicePackageTemplate | null>(null);

    const personalPackageTemplates = useMemo(() => {
        return allPackageTemplates.filter(pt => !!pt.ownerId);
    }, [allPackageTemplates]);

    const availableClientPackages = useMemo(() => {
        if (!clientId) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get a set of all package template IDs that are bookable by clients across all professionals.
        const allClientBookablePackageIds = new Set(
            professionals.flatMap(prof => prof.clientBookablePackageIds || [])
        );
    
        return getPackagesForClient(clientId).filter(pkg => {
            const isActive = pkg.creditsRemaining > 0 && new Date(pkg.expiryDate) >= today;
            const isBookable = allClientBookablePackageIds.has(pkg.packageTemplateId) || allPackageTemplates.find(pt => pt.id === pkg.packageTemplateId && !!pt.ownerId);
            return isActive && isBookable;
        });
    }, [getPackagesForClient, professionals, clientId, allPackageTemplates]);

    const purchasablePackages = useMemo(() => {
        const activeOwnedTemplateIds = new Set(availableClientPackages.map(p => p.packageTemplateId));
         // Filter out personal packages from this main list, they'll have their own category
        return allPackageTemplates.filter(t => !activeOwnedTemplateIds.has(t.id) && !t.ownerId);
    }, [allPackageTemplates, availableClientPackages]);

    const getDiscountedPrice = (item: Service | ServicePackageTemplate, itemType: 'service' | 'package', date: Date | null) => {
        if (!date) {
            return { originalPrice: item.price, discountedPrice: null, discountName: null };
        }

        const dayOfWeek = date.getDay();
        const activeDiscount = discounts.find(d => 
            d.itemId === item.id && 
            d.itemType === itemType && 
            d.days.includes(dayOfWeek)
        );

        if (!activeDiscount) {
            return { originalPrice: item.price, discountedPrice: null, discountName: null };
        }

        let newPrice: number;
        if (activeDiscount.discountType === 'PERCENT') {
            newPrice = item.price * (1 - activeDiscount.discountValue / 100);
        } else { // FIXED
            newPrice = item.price - activeDiscount.discountValue;
        }

        return { originalPrice: item.price, discountedPrice: Math.max(0, newPrice), discountName: activeDiscount.name };
    };

    useEffect(() => {
        const promoShown = sessionStorage.getItem('promoModalShown');
        if (promoShown) {
            return;
        }

        const campaign = settings.promotionalCampaign;
        if (campaign && campaign.isActive) {
            const now = new Date();
            // Correctly parse date strings as local time to avoid timezone issues.
            // 'YYYY-MM-DD' on its own is parsed as UTC midnight, which can be the previous day in some timezones.
            // Appending time makes it parse as local.
            const start = new Date(`${campaign.startDate}T00:00:00`);
            const end = new Date(`${campaign.endDate}T23:59:59`);

            if (now >= start && now <= end) {
                setIsPromoModalOpen(true);
            }
        }
    }, [settings.promotionalCampaign]);

    useEffect(() => {
        if (!settings.bookingScreenMessage) {
            setIsAlertVisible(false);
            return;
        }

        const displaySeconds = settings.bookingScreenMessageDisplaySeconds;
        if (isAlertVisible && displaySeconds > 0) {
            const timer = setTimeout(() => {
                setIsAlertVisible(false);
            }, displaySeconds * 1000);
            return () => clearTimeout(timer);
        }
    }, [settings.bookingScreenMessage, settings.bookingScreenMessageDisplaySeconds, isAlertVisible]);

    const handleClosePromoModal = () => {
        setIsPromoModalOpen(false);
        sessionStorage.setItem('promoModalShown', 'true');
    };
    
    const canPurchasePackage = !!packageToPurchase;
    const isBookingReady = !!(selectedDate && selectedService && selectedProfessional && selectedTime);
    
    const isPurchaseOnlyReady = canPurchasePackage && !!selectedService && !selectedTime;
    const canProceed = isBookingReady || isPurchaseOnlyReady;

    const buttonText = useMemo(() => {
        if (packageToPurchase) {
            return selectedTime ? 'Comprar e Agendar' : 'Comprar Pacote';
        }
        return 'Agendar';
    }, [packageToPurchase, selectedTime]);


    const handleNavigateToSummary = () => {
        const isPurchaseOnly = canPurchasePackage && !!selectedService && !selectedTime;

        if (isPurchaseOnly) {
            if (!confirm('Você está comprando o pacote, mas não agendando a primeira sessão porque nenhum horário foi selecionado. Deseja continuar?')) {
                return;
            }
            navigate('/resumo', {
                state: {
                    date: null,
                    time: null,
                    services: [selectedService!], // We know service is selected from the logic
                    professional: null,
                    clientPackageId: null,
                    packageToPurchase: packageToPurchase,
                }
            });
            return;
        }
        
        if (isBookingReady) {
            const slotsNeeded = Math.ceil((selectedService!.duration || 30) / 30);
            const startTimeIndex = allTimeSlots.findIndex(t => t === selectedTime);
    
            if (startTimeIndex === -1) {
                alert('Erro ao encontrar o horário inicial. Tente novamente.');
                return;
            }

            const appointmentSlots = allTimeSlots.slice(startTimeIndex, startTimeIndex + slotsNeeded);

            const isBlockStillAvailable = appointmentSlots.every(slot => 
                !bookedTimeSlots.has(slot) && availableTimeSlots.includes(slot)
            );
            
            if (!isBlockStillAvailable || appointmentSlots.length < slotsNeeded) {
                alert('O horário selecionado ou parte dele não está mais disponível. Por favor, escolha outro horário.');
                setSelectedTime(null);
                return;
            }
    
            const timeStringForAppointment = appointmentSlots.join(' / ');

            navigate('/resumo', {
                state: {
                    date: selectedDate!.toISOString(),
                    time: timeStringForAppointment,
                    services: selectedService ? [selectedService] : [],
                    professional: selectedProfessional,
                    clientPackageId: selectedPackage ? selectedPackage.id : null,
                    packageToPurchase: packageToPurchase,
                }
            });
        } else {
             if (packageToPurchase) {
                alert('Para comprar e agendar, por favor selecione data, profissional e horário.');
            } else {
                alert('Por favor, selecione data, profissional, serviço e horário para agendar.');
            }
        }
    };

    const handleServiceSelect = (service: Service) => {
        setPackageToPurchase(null);
        
        const isDeselecting = selectedService?.id === service.id;

        if (isDeselecting) {
            setSelectedService(null);
            setSelectedPackage(null);
            setApplicablePackage(null);
            setSelectedTime(null);
            return;
        }
    
        setSelectedService(service);
        setSelectedTime(null);
    
        const foundPackage = availableClientPackages.find(
            pkg => pkg.template?.serviceId === service.id
        );
    
        setApplicablePackage(foundPackage || null);
    
        if (foundPackage) {
            setSelectedPackage(foundPackage);
        } else {
            setSelectedPackage(null);
        }
    };

    const handlePackagePurchaseSelect = (template: ServicePackageTemplate) => {
        const isDeselecting = packageToPurchase?.id === template.id;
    
        if (isDeselecting) {
            setPackageToPurchase(null);
            if (selectedService?.id === template.serviceId) {
                setSelectedService(null);
            }
            return;
        }
    
        setPackageToPurchase(template);
        setSelectedPackage(null); 
        setApplicablePackage(null);
        
        const serviceForPackage = services.find(s => s.id === template.serviceId);
        if (serviceForPackage) {
            setSelectedService(serviceForPackage);
        }

        // If it's a personal package (has an ownerId), automatically select the owner.
        if (template.ownerId) {
            const owner = professionals.find(p => p.id === template.ownerId);
            if (owner) {
                setSelectedProfessional(owner);
            } else {
                // Owner not found, maybe data is inconsistent. Clear selection.
                setSelectedProfessional(null);
            }
        }
        
        setSelectedTime(null);
    };


    const handleProfSelect = (prof: Professional) => {
        const isDeselecting = selectedProfessional?.id === prof.id;
        if (isDeselecting) {
            setSelectedProfessional(null);
        } else {
            setSelectedProfessional(prof);
            if (selectedService && !prof.serviceIds.includes(selectedService.id)) {
                setSelectedService(null);
            }
        }
        setSelectedTime(null);
    };

    const availableProfessionals = useMemo(() => {
        if (packageToPurchase && packageToPurchase.ownerId) {
            const owner = professionals.find(p => p.id === packageToPurchase.ownerId);
            return owner ? [owner] : [];
        }
        
        if (selectedService) {
            // If the service has a specific owner (it's a personal/rented service),
            // only that professional is available.
            if (selectedService.ownerId) {
                const owner = professionals.find(p => p.id === selectedService.ownerId);
                return owner ? [owner] : [];
            }
    
            // If it's a general salon service, find all professionals who can perform it.
            const professionalsForService = professionals.filter(prof => prof.serviceIds.includes(selectedService.id));
            return professionalsForService;
        }
        // If no service is selected yet, show all professionals.
        return professionals;
    }, [selectedService, professionals, packageToPurchase]);


    useEffect(() => {
        if (selectedProfessional && !availableProfessionals.some(p => p.id === selectedProfessional.id)) {
            setSelectedProfessional(null);
            setSelectedTime(null);
        }
    }, [availableProfessionals, selectedProfessional]);
    
    useEffect(() => {
        if (selectedService && !selectedProfessional && availableProfessionals.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableProfessionals.length);
            setSelectedProfessional(availableProfessionals[randomIndex]);
        }
    }, [selectedService, selectedProfessional, availableProfessionals]);


    const serviceCategories = useMemo(() => {
        const categories = [...new Set(services.map(s => s.category))];
        if (personalPackageTemplates.length > 0) {
            categories.push('Pacotes de Profissionais');
        }
        return categories;
    }, [services, personalPackageTemplates]);
    
    const nonWorkingDays = useMemo(() => {
        const allDays = [0, 1, 2, 3, 4, 5, 6];
        const employeeWorkingDays = selectedProfessional?.workingDays;
    
        if (employeeWorkingDays) {
            return allDays.filter(day => !employeeWorkingDays.includes(day));
        }
        
        return allDays.filter(day => !settings.workingDays.includes(day));
    }, [selectedProfessional, settings.workingDays]);

    const allTimeSlots = useMemo(() => {
        const slots = [];
        const startTimeToUse = selectedProfessional?.startTime || settings.startTime;
        const endTimeToUse = selectedProfessional?.endTime || settings.endTime;

        if (startTimeToUse && endTimeToUse) {
            let currentTime = new Date(`1970-01-01T${startTimeToUse}:00`);
            const endTime = new Date(`1970-01-01T${endTimeToUse}:00`);

            while (currentTime < endTime) {
                slots.push(currentTime.toTimeString().substring(0, 5));
                currentTime.setMinutes(currentTime.getMinutes() + 30);
            }
        }
        return slots;
    }, [settings.startTime, settings.endTime, selectedProfessional]);
    
    const bookedTimeSlots = useMemo(() => {
        if (!selectedDate || !selectedProfessional) return new Set<string>();

        const bookedSlots = new Set<string>();

        appointments
            .filter(app =>
                app.professional.id === selectedProfessional.id &&
                new Date(app.date).toDateString() === selectedDate.toDateString()
            )
            .forEach(app => {
                app.time.split('/').forEach(t => bookedSlots.add(t.trim()));
            });

        return bookedSlots;
    }, [selectedDate, selectedProfessional, appointments]);


    const availableTimeSlots = useMemo(() => {
        if (!selectedDate) return [];

        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();

        if (!isToday) {
            return allTimeSlots;
        }

        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();

        return allTimeSlots.filter(time => {
            const [slotHour, slotMinute] = time.split(':').map(Number);
            if (slotHour > currentHour) {
                return true;
            }
            if (slotHour === currentHour && slotMinute > currentMinutes) {
                return true;
            }
            return false;
        });
    }, [selectedDate, allTimeSlots]);

    useEffect(() => {
        if (selectedTime && bookedTimeSlots.has(selectedTime)) {
            setSelectedTime(null);
        }
    }, [selectedTime, bookedTimeSlots]);
    
    const isProfWorkingOnSelectedDate = useMemo(() => {
        if (!selectedProfessional || !selectedDate) {
            return true;
        }
        const dayOfWeek = selectedDate.getDay();
        const workingDaysForProf = 'workingDays' in selectedProfessional && selectedProfessional.workingDays ? selectedProfessional.workingDays : settings.workingDays;
        return workingDaysForProf.includes(dayOfWeek);
    }, [selectedDate, selectedProfessional, settings.workingDays]);

    const canPotentiallyShowTimes = selectedDate && selectedService && selectedProfessional;
    const showTimeSlots = canPotentiallyShowTimes && isProfWorkingOnSelectedDate;
    const slotsNeeded = selectedService ? Math.ceil((selectedService.duration || 30) / 30) : 1;
    const sanitizedWhatsapp = settings.salonWhatsapp ? settings.salonWhatsapp.replace(/\D/g, '') : '';

    return (
        <div className="flex flex-col h-screen justify-between bg-black text-white">
            {isPromoModalOpen && settings.promotionalCampaign && (
                <PromotionalModal
                    campaign={settings.promotionalCampaign}
                    onClose={handleClosePromoModal}
                />
            )}
            <div className="p-4 flex-grow overflow-y-auto pb-20">
                <header className="flex items-center mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                    <h1 className="text-xl font-bold mx-auto">Agendar</h1>
                </header>

                <Calendar 
                    selectedDate={selectedDate} 
                    onDateSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                    }}
                    disabledDays={nonWorkingDays}
                />

                {settings.isAiAssistantEnabled && (
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/agendar/assistente-ia')}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg flex items-center justify-between hover:opacity-90 transition-opacity"
                        >
                            <div className="text-left">
                                <p className="font-bold text-lg">Não tem certeza da cor?</p>
                                <p className="text-sm">Use nosso assistente de IA para simular!</p>
                            </div>
                            <SparklesIcon className="w-10 h-10 flex-shrink-0" />
                        </button>
                    </div>
                )}

                {settings.bookingScreenMessage && isAlertVisible && (
                    <div className="relative mt-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200 text-sm flex items-start gap-3">
                        <WarningIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-yellow-400" />
                        <p className="pr-6">{settings.bookingScreenMessage}</p>
                        <button onClick={() => setIsAlertVisible(false)} className="absolute top-2 right-2 p-1 text-yellow-300 hover:text-yellow-100">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}


                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Meus Pacotes Ativos</h2>
                    {availableClientPackages.length > 0 ? (
                        <div className="space-y-2">
                            {availableClientPackages.map(pkg => (
                                <div
                                    key={pkg.id}
                                    className="w-full text-left p-3 rounded-lg bg-gray-800 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-semibold">{pkg.template?.name}</p>
                                        <p className="text-sm text-gray-400">
                                            {pkg.creditsRemaining} sessões restantes
                                        </p>
                                    </div>
                                    <GiftIcon className="w-6 h-6 text-cyan-400" />
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-sm text-gray-500 bg-gray-900 p-4 rounded-lg">Você não possui pacotes ativos que podem ser agendados online.</p>
                    )}
                </div>

                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Pacotes Disponíveis para Compra</h2>
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
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 ${packageToPurchase?.id === template.id ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                        {packageToPurchase?.id === template.id && (
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 bg-gray-900 p-4 rounded-lg">Não há novos pacotes disponíveis para compra no momento.</p>
                    )}
                </div>


                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Serviço</h2>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                        {serviceCategories.map(category => (
                             <button
                                key={category}
                                onClick={() => {
                                    setSelectedCategory(category === selectedCategory ? null : category);
                                }}
                                className={`px-5 py-2 rounded-lg text-sm transition-colors ${selectedCategory === category ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                    {selectedCategory && (
                        <div className="mt-4 space-y-2">
                            {selectedCategory === 'Pacotes de Profissionais' ? (
                                personalPackageTemplates.map(template => {
                                    const { originalPrice, discountedPrice } = getDiscountedPrice(template, 'package', selectedDate);
                                    return (
                                    <button
                                        key={template.id}
                                        onClick={() => handlePackagePurchaseSelect(template)}
                                        className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${packageToPurchase?.id === template.id ? 'bg-gray-700 ring-2 ring-gray-400' : 'bg-gray-800 hover:bg-gray-700'}`}
                                    >
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
                                            <p className="text-xs text-cyan-400 mt-1">
                                                Profissional: {professionals.find(p => p.id === template.ownerId)?.name || 'Desconhecido'}
                                            </p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 ${packageToPurchase?.id === template.id ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                            {packageToPurchase?.id === template.id && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                    );
                                })
                            ) : (
                                services.filter(s => s.category === selectedCategory).map(service => {
                                    const { originalPrice, discountedPrice } = getDiscountedPrice(service, 'service', selectedDate);
                                    return (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceSelect(service)}
                                        className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${selectedService?.id === service.id ? 'bg-gray-700 ring-2 ring-gray-400' : 'bg-gray-800 hover:bg-gray-700'}`}
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
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ml-4 ${selectedService?.id === service.id ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                            {selectedService?.id === service.id && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {applicablePackage && selectedService && !packageToPurchase && (
                        <div className="mt-4 bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="pr-4">
                                    <p className="font-semibold text-blue-300">Usar crédito do pacote!</p>
                                    <p className="text-sm text-gray-400">
                                        Você tem {applicablePackage.creditsRemaining} créditos restantes de "{applicablePackage.template?.name}".
                                    </p>
                                </div>
                                <input 
                                    type="checkbox"
                                    checked={!!selectedPackage}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedPackage(applicablePackage);
                                        } else {
                                            setSelectedPackage(null);
                                        }
                                    }}
                                    className="h-6 w-6 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600 shrink-0"
                                />
                            </label>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Profissional</h2>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                        {availableProfessionals.map(prof => (
                            <button
                                key={prof.id}
                                onClick={() => handleProfSelect(prof)}
                                className={`px-5 py-2 rounded-lg text-sm transition-colors ${selectedProfessional?.id === prof.id ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'}`}
                            >
                                {prof.name}
                            </button>
                        ))}
                         {(selectedPackage || selectedService) && availableProfessionals.length === 0 && (
                            <p className="text-sm text-gray-400">Nenhum profissional disponível para esta seleção.</p>
                        )}
                    </div>
                </div>
                
                {canPotentiallyShowTimes && !isProfWorkingOnSelectedDate && (
                    <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200 text-center flex items-center gap-3">
                        <WarningIcon className="w-6 h-6 flex-shrink-0 text-yellow-400" />
                        <p>{selectedProfessional.name} não trabalha neste dia. Por favor, selecione outra data no calendário.</p>
                    </div>
                )}

                {showTimeSlots && (
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold mb-3">Horários Disponíveis</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {allTimeSlots.length > 0 ? (
                                allTimeSlots.map((time, index) => {
                                    let isBlockAvailable = true;
                                    if (index + slotsNeeded > allTimeSlots.length) {
                                        isBlockAvailable = false;
                                    } else {
                                        for (let i = 0; i < slotsNeeded; i++) {
                                            const currentSlot = allTimeSlots[index + i];
                                            if (bookedTimeSlots.has(currentSlot) || !availableTimeSlots.includes(currentSlot)) {
                                                isBlockAvailable = false;
                                                break;
                                            }
                                        }
                                    }

                                    const isDisabled = !isBlockAvailable;
                                    
                                    const startIndex = selectedTime ? allTimeSlots.findIndex(t => t === selectedTime) : -1;
                                    const isPartOfSelection = startIndex !== -1 && index >= startIndex && index < startIndex + slotsNeeded;

                                    let buttonClass = 'p-3 rounded-lg text-sm font-semibold transition-colors ';
                                    if (isPartOfSelection) {
                                        buttonClass += 'bg-gray-200 text-black';
                                    } else if (isDisabled) {
                                        buttonClass += 'bg-gray-900 text-gray-600 line-through cursor-not-allowed';
                                    } else {
                                        buttonClass += 'bg-gray-800 text-white hover:bg-gray-700';
                                    }

                                    return (
                                        <button
                                            key={time}
                                            onClick={() => !isDisabled && setSelectedTime(prev => (prev === time ? null : time))}
                                            disabled={isDisabled}
                                            className={buttonClass}
                                            title={isDisabled ? "Horário indisponível ou sem tempo suficiente para o serviço." : `Selecionar ${time}`}
                                        >
                                            {time}
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="col-span-4 text-center text-gray-400">Não há horários definidos para este profissional.</p>
                            )}
                        </div>
                    </div>
                )}


                <div className="mt-8">
                     <button
                        onClick={handleNavigateToSummary}
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                        disabled={!canProceed}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingScreen;