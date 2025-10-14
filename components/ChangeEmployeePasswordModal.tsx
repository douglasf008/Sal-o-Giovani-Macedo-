
import React, { useState } from 'react';
import { Professional } from '../types';
import XIcon from './icons/XIcon';

interface ChangeEmployeePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newPassword: string) => void;
    employee: Professional;
}

const ChangeEmployeePasswordModal: React.FC<ChangeEmployeePasswordModalProps> = ({ isOpen, onClose, onSave, employee }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        setError('');
        if (currentPassword !== employee.password) {
            setError('A senha atual está incorreta.');
            return;
        }
        if (!newPassword || newPassword.length < 3) {
            setError('A nova senha deve ter pelo menos 3 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As novas senhas não correspondem.');
            return;
        }
        onSave(newPassword);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Alterar Senha</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>

                <main className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Senha Atual</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Nova Senha</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </main>

                <footer className="mt-8">
                    <button onClick={handleSave} className="w-full bg-blue-600 font-bold py-3 rounded-lg text-lg hover:bg-blue-500">Salvar Nova Senha</button>
                </footer>
            </div>
        </div>
    );
};

export default ChangeEmployeePasswordModal;
