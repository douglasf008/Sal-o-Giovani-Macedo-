import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { ServicePackageTemplate, ClientPackage } from '../types';
import { useProfessionals } from './ProfessionalsContext';

const getInitialState = <T,>(key: string, fallback: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.warn(`Error reading localStorage for ${key}:`, error);
    }
    return fallback;
};

// --- Mock Data ---
const MOCK_PACKAGE_TEMPLATES: ServicePackageTemplate[] = [
    { id: 'pkg_template_1', name: '4 Massagens Modeladoras', serviceId: 's5', price: 120.00, sessionCount: 4, validityDays: 90 },
    { id: 'pkg_template_2', name: '8 Manicures', serviceId: 's4', price: 180.00, sessionCount: 8, validityDays: 120 },
];

const MOCK_CLIENT_PACKAGES: ClientPackage[] = [
    { id: 'cpkg_1', clientId: 'c1', packageTemplateId: 'pkg_template_1', purchaseDate: new Date().toISOString(), expiryDate: new Date(new Date().setDate(new Date().getDate() + 90)).toISOString(), creditsRemaining: 3 },
    { id: 'cpkg_2', clientId: 'c1', packageTemplateId: 'pkg_template_2', purchaseDate: new Date().toISOString(), expiryDate: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString(), creditsRemaining: 8 },
];

// --- Context Definition ---
interface PackagesContextType {
  packageTemplates: ServicePackageTemplate[];
  clientPackages: ClientPackage[];
  addPackageTemplate: (templateData: Omit<ServicePackageTemplate, 'id'>) => void;
  updatePackageTemplate: (template: ServicePackageTemplate) => void;
  deletePackageTemplate: (templateId: string) => void;
  buyPackage: (clientId: string, templateId: string) => ClientPackage;
  useCredit: (clientPackageId: string) => void;
  returnCredit: (clientPackageId: string) => void;
  getPackagesForClient: (clientId: string) => (ClientPackage & { template: ServicePackageTemplate | undefined })[];
}

const PackagesContext = createContext<PackagesContextType | undefined>(undefined);

// --- Provider Component ---
export const PackagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { professionals } = useProfessionals();
    const [globalPackageTemplates, setGlobalPackageTemplates] = useState<ServicePackageTemplate[]>(() => getInitialState('packageTemplates', MOCK_PACKAGE_TEMPLATES));
    const [clientPackages, setClientPackages] = useState<ClientPackage[]>(() => getInitialState('clientPackages', MOCK_CLIENT_PACKAGES));

    const allPackageTemplates = useMemo(() => {
        const personalTemplates: ServicePackageTemplate[] = [];
        professionals.forEach(prof => {
            if (prof.employmentType === 'rented') {
                try {
                    const dataKey = `personal_dashboard_${prof.id}`;
                    const storedData = localStorage.getItem(dataKey);
                    if (storedData) {
                        const parsed = JSON.parse(storedData);
                        if (parsed.packages && Array.isArray(parsed.packages)) {
                            const profPackages: ServicePackageTemplate[] = parsed.packages.map((pkg: any) => ({
                                ...pkg,
                                ownerId: prof.id,
                            }));
                            personalTemplates.push(...profPackages);
                        }
                    }
                } catch (e) {
                    console.error(`Failed to load personal packages for ${prof.name}`, e);
                }
            }
        });

        const allTemplates = [...globalPackageTemplates];
        const existingIds = new Set(allTemplates.map(p => p.id));
        personalTemplates.forEach(p => {
            if (!existingIds.has(p.id)) {
                allTemplates.push(p);
                existingIds.add(p.id);
            }
        });
        
        return allTemplates;
    }, [globalPackageTemplates, professionals]);


    useEffect(() => {
        try {
            window.localStorage.setItem('packageTemplates', JSON.stringify(globalPackageTemplates));
        } catch (error) {
            console.error('Error saving package templates to localStorage:', error);
        }
    }, [globalPackageTemplates]);

    useEffect(() => {
        try {
            window.localStorage.setItem('clientPackages', JSON.stringify(clientPackages));
        } catch (error) {
            console.error('Error saving client packages to localStorage:', error);
        }
    }, [clientPackages]);

    const addPackageTemplate = (templateData: Omit<ServicePackageTemplate, 'id'>) => {
        const newTemplate: ServicePackageTemplate = {
            id: `pkg_template_${Date.now()}`,
            ...templateData,
        };
        setGlobalPackageTemplates(prev => [...prev, newTemplate]);
    };

    const updatePackageTemplate = (updatedTemplate: ServicePackageTemplate) => {
        setGlobalPackageTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    };
    
    const deletePackageTemplate = (templateId: string) => {
        // Also remove client packages associated with this template to avoid orphaned data
        setClientPackages(prev => prev.filter(cp => cp.packageTemplateId !== templateId));
        setGlobalPackageTemplates(prev => prev.filter(t => t.id !== templateId));
    };

    const buyPackage = (clientId: string, templateId: string): ClientPackage => {
        const template = allPackageTemplates.find(t => t.id === templateId);
        if (!template) {
            throw new Error(`Package template with id ${templateId} not found.`);
        };
        
        const purchaseDate = new Date();
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(purchaseDate.getDate() + template.validityDays);

        const newClientPackage: ClientPackage = {
            id: `cpkg_${Date.now()}`,
            clientId,
            packageTemplateId: templateId,
            purchaseDate: purchaseDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            creditsRemaining: template.sessionCount,
        };
        setClientPackages(prev => [...prev, newClientPackage]);
        return newClientPackage;
    };

    const useCredit = (clientPackageId: string) => {
        setClientPackages(prev => prev.map(pkg => 
            pkg.id === clientPackageId && pkg.creditsRemaining > 0
                ? { ...pkg, creditsRemaining: pkg.creditsRemaining - 1 }
                : pkg
        ));
    };

    const returnCredit = (clientPackageId: string) => {
        const pkg = clientPackages.find(p => p.id === clientPackageId);
        const template = allPackageTemplates.find(t => t.id === pkg?.packageTemplateId);
        if (pkg && template) {
            setClientPackages(prev => prev.map(p => 
                p.id === clientPackageId && p.creditsRemaining < template.sessionCount
                    ? { ...p, creditsRemaining: p.creditsRemaining + 1 }
                    : p
            ));
        }
    };


    const getPackagesForClient = (clientId: string) => {
        return clientPackages
            .filter(cp => cp.clientId === clientId)
            .map(cp => ({
                ...cp,
                template: allPackageTemplates.find(pt => pt.id === cp.packageTemplateId)
            }));
    };

    return (
        <PackagesContext.Provider value={{ packageTemplates: allPackageTemplates, clientPackages, addPackageTemplate, updatePackageTemplate, deletePackageTemplate, buyPackage, useCredit, returnCredit, getPackagesForClient }}>
            {children}
        </PackagesContext.Provider>
    );
};

// --- Custom Hook ---
export const usePackages = () => {
    const context = useContext(PackagesContext);
    if (context === undefined) {
        throw new Error('usePackages must be used within a PackagesProvider');
    }
    return context;
};
