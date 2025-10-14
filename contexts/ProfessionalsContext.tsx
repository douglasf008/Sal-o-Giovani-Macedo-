
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Professional } from '../types';
import { PROFESSIONALS as INITIAL_PROFESSIONALS } from '../constants';

interface ProfessionalsContextType {
  professionals: Professional[];
  addProfessional: (professionalData: Omit<Professional, 'id'>) => void;
  updateProfessional: (professional: Professional) => void;
  deleteProfessional: (professionalId: string) => void;
  removeCommissionOverridesForItem: (itemId: string) => void;
}

const ProfessionalsContext = createContext<ProfessionalsContextType | undefined>(undefined);

export const ProfessionalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [professionals, setProfessionals] = useState<Professional[]>(INITIAL_PROFESSIONALS);

  useEffect(() => {
    setProfessionals(prevProfs => {
        let needsUpdate = false;
        const migratedProfs = prevProfs.map(prof => {
            if (prof.commissionOverrides && prof.commissionOverrides.length > 0) {
                const needsMigration = prof.commissionOverrides.some(o => (o as any).serviceId && !(o as any).itemId);
                if (needsMigration) {
                    needsUpdate = true;
                    return {
                        ...prof,
                        commissionOverrides: prof.commissionOverrides.map(o => {
                            const oldOverride = o as any;
                            if (oldOverride.serviceId && !oldOverride.itemId) {
                                return {
                                    itemId: oldOverride.serviceId,
                                    itemType: 'service',
                                    percentage: oldOverride.percentage,
                                };
                            }
                            return o;
                        })
                    };
                }
            }
            return prof;
        });
        
        if (needsUpdate) {
            console.log("Migrating commission overrides data structure.");
            return migratedProfs;
        }
        return prevProfs;
    });
}, []); // Run only once on mount

  const addProfessional = (professionalData: Omit<Professional, 'id'>) => {
    const newProfessional: Professional = {
      id: `p${Date.now()}`,
      ...professionalData,
      avatarUrl: professionalData.avatarUrl || `https://i.pravatar.cc/150?u=${professionalData.name.replace(/\s/g, '')}`,
    };
    setProfessionals(prev => [...prev, newProfessional]);
  };
  
  const updateProfessional = (updatedProfessional: Professional) => {
    setProfessionals(prev => prev.map(p => p.id === updatedProfessional.id ? updatedProfessional : p));
  };
  
  const deleteProfessional = (professionalId: string) => {
    setProfessionals(prev => {
        // Filter out the professional to be deleted
        const remainingProfessionals = prev.filter(p => p.id !== professionalId);
        
        // Update any other professionals who had the deleted one as a salary source
        return remainingProfessionals.map(p => {
            if (p.salarySource === professionalId) {
                return { ...p, salarySource: 'salon' };
            }
            return p;
        });
    });
  };

  const removeCommissionOverridesForItem = (itemId: string) => {
    setProfessionals(prev => 
      prev.map(prof => {
        if (!prof.commissionOverrides) {
          return prof;
        }
        return {
          ...prof,
          commissionOverrides: prof.commissionOverrides.filter(o => o.itemId !== itemId)
        }
      })
    );
  };

  return (
    <ProfessionalsContext.Provider value={{ professionals, addProfessional, updateProfessional, deleteProfessional, removeCommissionOverridesForItem }}>
      {children}
    </ProfessionalsContext.Provider>
  );
};

export const useProfessionals = () => {
  const context = useContext(ProfessionalsContext);
  if (context === undefined) {
    throw new Error('useProfessionals must be used within a ProfessionalsProvider');
  }
  return context;
};