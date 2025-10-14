import React, { useState } from 'react';
import XIcon from './icons/XIcon';

interface PasswordRevealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
}

const PasswordRevealModal: React.FC<PasswordRevealModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(password);
        setPassword('');
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Confirmação de Acesso</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </div>
                <p className="text-gray-300 mb-6">Para visualizar esta informação, por favor, insira a senha de privacidade.</p>
                
                <form onSubmit={handleSubmit}>
                    <label htmlFor="privacy-password-input" className="sr-only">Senha de Privacidade</label>
                    <input
                        id="privacy-password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="Senha"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-lg hover:bg-blue-500 transition-colors"
                    >
                        Confirmar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordRevealModal;
