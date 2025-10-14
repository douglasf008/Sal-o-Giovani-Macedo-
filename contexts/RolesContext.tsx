import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Role {
  id: string;
  name: string;
}

const INITIAL_ROLES: Role[] = [
  { id: 'r1', name: 'Cabeleireiro(a)' },
  { id: 'r2', name: 'Manicure' },
  { id: 'r3', name: 'Pedicure' },
  { id: 'r4', name: 'Esteticista' },
  { id: 'r5', name: 'Recepcionista' },
];

interface RolesContextType {
  roles: Role[];
  addRole: (roleName: string) => void;
  deleteRole: (roleId: string) => void;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export const RolesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);

  const addRole = (roleName: string) => {
    if (roleName.trim() === '' || roles.some(r => r.name.toLowerCase() === roleName.trim().toLowerCase())) {
        return;
    }
    const newRole: Role = {
      id: `r${Date.now()}`,
      name: roleName.trim(),
    };
    setRoles(prev => [...prev, newRole]);
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  };
  
  return (
    <RolesContext.Provider value={{ roles, addRole, deleteRole }}>
      {children}
    </RolesContext.Provider>
  );
};

export const useRoles = () => {
  const context = useContext(RolesContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
};