import React, { createContext, useContext } from 'react';

export interface CampaignMedia {
    type: 'image' | 'video';
    url: string; // Can be a web URL or a base64 data URL
}

export interface PromotionalCampaign {
    isActive: boolean;
    title: string;
    description: string;
    displayType: 'image' | 'carousel' | 'video';
    media: CampaignMedia[];
    startDate: string; // ISO string YYYY-MM-DD
    endDate: string; // ISO string YYYY-MM-DD
}

export interface SalonSettings {
    salonName: string;
    coverImageUrl: string;
    workingDays: number[]; // 0 for Sunday, 1 for Monday, etc.
    startTime: string; // "HH:MM" format
    endTime: string; // "HH:MM" format
    privacyPassword?: string;
    defaultCommissionPercentage: number;
    welcomeSubtitle: string;
    onlinePaymentsEnabled: boolean;
    promotionalCampaign?: PromotionalCampaign;
    bookingScreenMessage: string;
    bookingScreenMessageDisplaySeconds: number;
    salonAddress: string;
    salonWhatsapp: string;
    isWhatsappEnabled: boolean;
    isAiAssistantEnabled: boolean;
    isChatbotEnabled: boolean;
    isAdminChatbotEnabled: boolean;
    chatbotAdditionalInfo: string;
}

export const defaultSettings: SalonSettings = {
    salonName: 'Salão Giovani Macedo',
    coverImageUrl: 'https://picsum.photos/seed/salon/400/800',
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    startTime: '09:00',
    endTime: '19:00',
    privacyPassword: 'admin',
    defaultCommissionPercentage: 45,
    welcomeSubtitle: 'Agende seus serviços de beleza com facilidade e estilo.',
    onlinePaymentsEnabled: true,
    promotionalCampaign: {
        isActive: false,
        title: 'Promoção Especial!',
        description: 'Confira nossos descontos exclusivos para este mês.',
        displayType: 'image',
        media: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    },
    bookingScreenMessage: 'Atenção: Serviços que alteram a forma ou cor do cabelo (mechas, coloração, alisamentos, etc.) necessitam de uma avaliação presencial para analisar a saúde dos fios. Agende uma avaliação ou entre em contato conosco para mais informações.',
    bookingScreenMessageDisplaySeconds: 15,
    salonAddress: 'Rua Fictícia, 123 - Centro, Cidade, Estado',
    salonWhatsapp: '5511999999999',
    isWhatsappEnabled: true,
    isAiAssistantEnabled: true,
    isChatbotEnabled: true,
    isAdminChatbotEnabled: true,
    chatbotAdditionalInfo: 'Promoção da semana: Hidratação com 15% de desconto às quartas-feiras!\nAceitamos todos os cartões de crédito e Pix. Não aceitamos cheques.',
};

export const SETTINGS_KEY = 'salonSettings';


export interface SalonSettingsContextType {
    settings: SalonSettings;
    saveSettings: (newSettings: SalonSettings) => void;
}

export const SalonSettingsContext = createContext<SalonSettingsContextType | undefined>(undefined);

export const useSalonSettings = () => {
    const context = useContext(SalonSettingsContext);
    if (context === undefined) {
        throw new Error('useSalonSettings must be used within a SalonSettingsProvider');
    }
    return context;
};