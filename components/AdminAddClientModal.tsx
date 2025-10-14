import React, { useState } from 'react';
import { Client } from '../types';
import XIcon from './icons/XIcon';

interface AdminAddClientModalProps {
    onClose: () => void;
    onSave: (client: Omit<Client, 'id' | 'avatarUrl' | 'notes'>) => void;
    initialName?: string;
}

const AdminAddClientModal: React.FC<AdminAddClientModalProps> = ({ onClose, onSave, initialName }) => {
    const [name, setName] = useState(initialName || '');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [birthdate, setBirthdate] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            alert('O nome do cliente é obrigatório.');
            return;
        }
        onSave({ name, email, phone, birthdate });
    };

    const isFormValid = name.trim().length > 0;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Adicionar Novo Cliente</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>

                <main className="space-y-4">
                    <div>
                        <label htmlFor="client-name" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                        <input
                            type="text"
                            id="client-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Nome do cliente"
                        />
                    </div>
                    <div>
                        <label htmlFor="client-email" className="block text-sm font-medium text-gray-300 mb-2">Email (Opcional)</label>
                        <input
                            type="email"
                            id="client-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="client-phone" className="block text-sm font-medium text-gray-300 mb-2">Celular (Opcional)</label>
                        <input
                            type="tel"
                            id="client-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="(11) 99999-8888"
                        />
                    </div>
                     <div>
                        <label htmlFor="client-birthdate" className="block text-sm font-medium text-gray-300 mb-2">Data de Nascimento (Opcional)</label>
                        <input
                            type="date"
                            id="client-birthdate"
                            value={birthdate}
                            onChange={(e) => setBirthdate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </main>

                <footer className="mt-8">
                    <button
                        onClick={handleSave}
                        disabled={!isFormValid}
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                    >
                        Salvar Cliente
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AdminAddClientModal;