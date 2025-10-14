
import React, { useState } from 'react';
import { useRoles, Role } from '../../contexts/RolesContext';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import DeleteRoleConfirmationModal from '../DeleteRoleConfirmationModal';

const RolesManagement: React.FC = () => {
    const { roles, addRole, deleteRole } = useRoles();
    const [newRoleName, setNewRoleName] = useState('');
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const handleAddRole = () => {
        if (newRoleName.trim()) {
            addRole(newRoleName);
            setNewRoleName('');
        }
    };

    const confirmDeleteRole = () => {
        if (roleToDelete) {
            deleteRole(roleToDelete.id);
            setRoleToDelete(null);
        }
    };
    
    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                        <h2 className="text-2xl font-bold">Gerenciamento de Funções</h2>
                        <p className="text-gray-400">Crie ou remova funções para os funcionários.</p>
                    </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {roles.map(role => (
                            <div key={role.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                <p className="font-semibold">{role.name}</p>
                                <button onClick={() => setRoleToDelete(role)} className="p-2 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-700 mt-3 pt-3 flex items-center gap-3">
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="Nome da nova função"
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                        />
                        <button
                            onClick={handleAddRole}
                            disabled={!newRoleName.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Adicionar</span>
                        </button>
                    </div>
                </div>
            </div>

            {roleToDelete && (
                <DeleteRoleConfirmationModal
                    isOpen={!!roleToDelete}
                    onClose={() => setRoleToDelete(null)}
                    onConfirm={confirmDeleteRole}
                    roleName={roleToDelete.name}
                />
            )}
        </>
    );
};

export default RolesManagement;
