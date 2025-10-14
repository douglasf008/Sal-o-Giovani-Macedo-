

import React, { useState, useEffect } from 'react';
import { Service } from '../types';
import XIcon from './icons/XIcon';
import { useServices } from '../contexts/ServicesContext';

interface AdminAddServiceModalProps {
    onClose: () => void;
    serviceToEdit: Service | null;
    allCategories: string[];
    defaultCommission: number;
    initialName?: string;
}

const AdminAddServiceModal: React.FC<AdminAddServiceModalProps> = ({ onClose, serviceToEdit, allCategories, defaultCommission, initialName }) => {
    const { addService, updateService } = useServices();
    const isEditing = !!serviceToEdit;
    
    const [name, setName] = useState('');
    const [category, setCategory] = useState(allCategories[0] || '');
    const [newCategory, setNewCategory] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [commission, setCommission] = useState(String(defaultCommission));
    const [retouchPeriod, setRetouchPeriod] = useState('');
    const [dosePrice, setDosePrice] = useState('');
    const [duration, setDuration] = useState('');


    useEffect(() => {
        if (serviceToEdit) {
            setName(serviceToEdit.name);
            setCategory(serviceToEdit.category);
            setPrice(String(serviceToEdit.price));
            setDescription(serviceToEdit.description);
            setCommission(String(serviceToEdit.commissionPercentage ?? defaultCommission));
            setRetouchPeriod(String(serviceToEdit.retouchPeriod || ''));
            setDosePrice(String(serviceToEdit.dosePrice || ''));
            setDuration(String(serviceToEdit.duration || ''));
        } else {
            // For adding new
            setName(initialName || '');
            setCategory(allCategories[0] || '');
            setNewCategory('');
            setPrice('');
            setDescription('');
            setCommission(String(defaultCommission));
            setRetouchPeriod('');
            setDosePrice('');
            setDuration('');
        }
    }, [serviceToEdit, defaultCommission, allCategories, initialName]);

    const isNewCategory = category === 'new';
    const finalCategory = isNewCategory ? newCategory : category;

    const handleSave = () => {
        if (!name || !finalCategory || !price) {
            alert('Por favor, preencha os campos de nome, categoria e preço.');
            return;
        }

        const serviceData = {
            name,
            category: finalCategory,
            price: parseFloat(price),
            description,
            commissionPercentage: parseInt(commission, 10),
            retouchPeriod: retouchPeriod ? parseInt(retouchPeriod, 10) : undefined,
            dosePrice: dosePrice ? parseFloat(dosePrice) : undefined,
            duration: duration ? parseInt(duration, 10) : undefined,
        };

        if (isEditing && serviceToEdit) {
            updateService({ ...serviceData, id: serviceToEdit.id });
        } else {
            addService(serviceData);
        }
        onClose();
    };

    const isFormValid = name && finalCategory && price;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-lg text-white" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>
                
                <main className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <label htmlFor="service-name" className="block text-sm font-medium text-gray-300 mb-2">Nome do Serviço</label>
                        <input type="text" id="service-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                     <div>
                        <label htmlFor="service-category" className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <select id="service-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500">
                           {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           <option value="new">Nova Categoria</option>
                        </select>
                    </div>
                    {isNewCategory && (
                         <div>
                            <label htmlFor="new-category" className="block text-sm font-medium text-gray-300 mb-2">Nome da Nova Categoria</label>
                            <input type="text" id="new-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="service-price" className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                            <input type="number" id="service-price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                        </div>
                        <div>
                            <label htmlFor="service-commission" className="block text-sm font-medium text-gray-300 mb-2">Comissão (%)</label>
                            <input type="number" id="service-commission" value={commission} onChange={(e) => setCommission(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                        </div>
                         <div>
                            <label htmlFor="service-duration" className="block text-sm font-medium text-gray-300 mb-2">Duração (min)</label>
                            <input type="number" id="service-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" placeholder="Ex: 60"/>
                        </div>
                         <div>
                            <label htmlFor="service-dose-price" className="block text-sm font-medium text-gray-300 mb-2">Valor da Dose (R$)</label>
                             <input type="number" id="service-dose-price" value={dosePrice} onChange={(e) => setDosePrice(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" placeholder="Opcional"/>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="service-retouch" className="block text-sm font-medium text-gray-300 mb-2">Período de Retoque (Meses)</label>
                        <input 
                            type="number" 
                            id="service-retouch" 
                            value={retouchPeriod} 
                            onChange={(e) => setRetouchPeriod(e.target.value)} 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: 6 (deixe em branco para não rastrear)"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="service-description" className="block text-sm font-medium text-gray-300 mb-2">Descrição (Opcional)</label>
                        <textarea id="service-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                </main>

                <footer className="mt-8">
                     <button onClick={handleSave} disabled={!isFormValid} className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400">
                        Salvar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AdminAddServiceModal;
