import React, { useState } from 'react';
import XIcon from './icons/XIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

interface ChangePrivacyPasswordModalProps {
    onClose: () => void;
    onSave: (newPassword: string) => void;
    hasCurrentPassword: boolean;
    currentPasswordValue: string;
}

const ChangePrivacyPasswordModal: React.FC<ChangePrivacyPasswordModalProps> = ({ onClose, onSave, hasCurrentPassword, currentPasswordValue }) => {
    const [currentPassword, setCurrentPassword] = useState(currentPasswordValue || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);

    const handleSave = () => {
        setError('');
        if (hasCurrentPassword && currentPassword !== currentPasswordValue) {
            setError('A senha atual está incorreta.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError('As novas senhas não correspondem.');
            return;
        }

        onSave(newPassword);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{hasCurrentPassword ? 'Alterar' : 'Definir'} Senha</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </div>
                
                <div className="space-y-4">
                    {hasCurrentPassword && (
                        <div>
                            <label htmlFor="current-password"  className="block text-sm font-medium text-gray-300 mb-2">Senha Atual</label>
                            <div className="relative">
                                <input
                                    type={isCurrentPasswordVisible ? 'text' : 'password'}
                                    id="current-password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                                    aria-label={isCurrentPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {isCurrentPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="new-password"  className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder={hasCurrentPassword ? 'Deixe em branco para remover' : ''}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password"  className="block text-sm font-medium text-gray-300 mb-2">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-lg hover:bg-blue-500 transition-colors">
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePrivacyPasswordModal;