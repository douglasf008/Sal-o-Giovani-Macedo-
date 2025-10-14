import React, { useState, useEffect } from 'react';
import { Service, ServicePackageTemplate } from '../types';
import XIcon from './icons/XIcon';

interface AdminAddPackageModalProps {
    onClose: () => void;
    onSave: (template: Omit<ServicePackageTemplate, 'id'> | ServicePackageTemplate) => void;
    services: Service[];
    templateToEdit?: ServicePackageTemplate | null;
}

const AdminAddPackageModal: React.FC<AdminAddPackageModalProps> = ({ onClose, onSave, services, templateToEdit }) => {
    const isEditing = !!templateToEdit;
    
    const [name, setName] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [price, setPrice] = useState('');
    const [sessionCount, setSessionCount] = useState('');
    const [validityDays, setValidityDays] = useState('');

    useEffect(() => {
        if (templateToEdit) {
            setName(templateToEdit.name);
            setServiceId(templateToEdit.serviceId);
            setPrice(String(templateToEdit.price));
            setSessionCount(String(templateToEdit.sessionCount));
            setValidityDays(String(templateToEdit.validityDays));
        } else {
            setServiceId(services[0]?.id || '');
        }
    }, [templateToEdit, services]);

    const handleSave = () => {
        if (!name || !serviceId || !price || !sessionCount || !validityDays) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const templateData = {
            name,
            serviceId,
            price: parseFloat(price),
            sessionCount: parseInt(sessionCount, 10),
            validityDays: parseInt(validityDays, 10),
        };

        if (isEditing && templateToEdit) {
            onSave({ ...templateData, id: templateToEdit.id });
        } else {
            onSave(templateData);
        }
    };

    const isFormValid = name && serviceId && price && sessionCount && validityDays;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-lg text-white">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Pacote' : 'Criar Novo Pacote'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>
                
                <main className="space-y-4">
                    <div>
                        <label htmlFor="pkg-name" className="block text-sm font-medium text-gray-300 mb-2">Nome do Pacote</label>
                        <input type="text" id="pkg-name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2" placeholder="Ex: 4 Massagens Modeladoras"/>
                    </div>
                     <div>
                        <label htmlFor="pkg-service" className="block text-sm font-medium text-gray-300 mb-2">Serviço Vinculado</label>
                        <select id="pkg-service" value={serviceId} onChange={e => setServiceId(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2">
                           {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="pkg-price" className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                           <input type="number" id="pkg-price" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2" placeholder="Ex: 120,00" />
                        </div>
                        <div>
                           <label htmlFor="pkg-sessions" className="block text-sm font-medium text-gray-300 mb-2">Nº de Sessões</label>
                           <input type="number" id="pkg-sessions" value={sessionCount} onChange={e => setSessionCount(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2" placeholder="Ex: 4" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="pkg-validity" className="block text-sm font-medium text-gray-300 mb-2">Validade (dias)</label>
                        <input type="number" id="pkg-validity" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2" placeholder="Ex: 90" />
                    </div>
                </main>

                <footer className="mt-8">
                     <button onClick={handleSave} disabled={!isFormValid} className="w-full bg-blue-600 font-bold py-3 rounded-lg text-lg hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed">
                        Salvar Pacote
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AdminAddPackageModal;