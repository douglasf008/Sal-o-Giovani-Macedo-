import React, { useState, useMemo } from 'react';
import { useDiscounts } from '../../contexts/DiscountsContext';
import { useServices } from '../../contexts/ServicesContext';
import { usePackages } from '../../contexts/PackagesContext';
import { WeeklyDiscount } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import DeleteDiscountConfirmationModal from '../DeleteDiscountConfirmationModal';
import PencilIcon from '../icons/PencilIcon';

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const DiscountsManagement: React.FC = () => {
    const { discounts, addDiscount, updateDiscount, deleteDiscount } = useDiscounts();
    const { services } = useServices();
    const { packageTemplates } = usePackages();

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [discountToEdit, setDiscountToEdit] = useState<WeeklyDiscount | null>(null);
    const [discountToDelete, setDiscountToDelete] = useState<WeeklyDiscount | null>(null);

    const [name, setName] = useState('');
    const [itemType, setItemType] = useState<'service' | 'package'>('service');
    const [itemId, setItemId] = useState('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
    const [discountValue, setDiscountValue] = useState('');

    const items = useMemo(() => {
        return itemType === 'service' ? services : packageTemplates;
    }, [itemType, services, packageTemplates]);

    const handleOpenForm = (discount: WeeklyDiscount | null = null) => {
        setDiscountToEdit(discount);
        if (discount) {
            setName(discount.name);
            setItemType(discount.itemType);
            setItemId(discount.itemId);
            setSelectedDays(discount.days);
            setDiscountType(discount.discountType);
            setDiscountValue(String(discount.discountValue));
        } else {
            setName('');
            setItemType('service');
            setItemId('');
            setSelectedDays([]);
            setDiscountType('PERCENT');
            setDiscountValue('');
        }
        setIsFormVisible(true);
    };
    
    const handleCloseForm = () => {
        setIsFormVisible(false);
        setDiscountToEdit(null);
    };
    
    const toggleDay = (dayIndex: number) => {
        setSelectedDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
    };

    const handleSave = () => {
        if (!name || !itemId || selectedDays.length === 0 || !discountValue) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        
        const value = parseFloat(discountValue.replace(',', '.'));
        if (isNaN(value) || value <= 0) {
            alert("O valor do desconto é inválido.");
            return;
        }

        const discountData = { name, itemId, itemType, days: selectedDays, discountType, discountValue: value };
        
        if (discountToEdit) {
            updateDiscount({ ...discountData, id: discountToEdit.id });
        } else {
            addDiscount(discountData);
        }
        handleCloseForm();
    };
    
    const handleConfirmDelete = () => {
        if (discountToDelete) {
            deleteDiscount(discountToDelete.id);
        }
        setDiscountToDelete(null);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                        <h2 className="text-2xl font-bold">Promoções por Dia da Semana</h2>
                        <p className="text-gray-400">Defina descontos automáticos para serviços ou pacotes em dias específicos.</p>
                    </div>
                    <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        <span>Criar Promoção</span>
                    </button>
                </div>

                {isFormVisible && (
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg">{discountToEdit ? 'Editar' : 'Criar'} Promoção</h3>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da Promoção (Ex: Segunda do Corte)" className="w-full bg-gray-700 p-2 rounded"/>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={itemType} onChange={e => { setItemType(e.target.value as 'service' | 'package'); setItemId(''); }} className="bg-gray-700 p-2 rounded">
                                <option value="service">Serviço</option>
                                <option value="package">Pacote</option>
                            </select>
                            <select value={itemId} onChange={e => setItemId(e.target.value)} className="bg-gray-700 p-2 rounded">
                                <option value="">Selecione um item...</option>
                                {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-300 mb-2">Dias da Semana</p>
                            <div className="flex flex-wrap gap-2">
                                {WEEK_DAYS.map((day, index) => (
                                    <button key={day} onClick={() => toggleDay(index)} className={`px-3 py-1.5 text-xs rounded-full font-semibold ${selectedDays.includes(index) ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                             <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="Valor do Desconto" className="w-full bg-gray-700 p-2 rounded"/>
                            <select value={discountType} onChange={e => setDiscountType(e.target.value as 'PERCENT' | 'FIXED')} className="bg-gray-700 p-2 rounded h-[40px]">
                                <option value="PERCENT">%</option>
                                <option value="FIXED">R$</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={handleCloseForm} className="px-4 py-2 bg-gray-600 rounded-lg">Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded-lg">Salvar</button>
                        </div>
                    </div>
                )}
                
                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {discounts.length > 0 ? discounts.map(d => {
                            const item = d.itemType === 'service' ? services.find(s => s.id === d.itemId) : packageTemplates.find(p => p.id === d.itemId);
                            return (
                                <div key={d.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-lg">{d.name}</p>
                                        <p className="text-sm text-gray-300">{item?.name || 'Item não encontrado'}</p>
                                        <p className="text-xs text-gray-400 mt-1">{d.days.map(dayIndex => WEEK_DAYS[dayIndex]).join(', ')}</p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <p className="font-bold text-lg text-green-400">
                                            {d.discountType === 'PERCENT' ? `${d.discountValue}% OFF` : `R$ ${d.discountValue.toFixed(2).replace('.',',')} OFF`}
                                        </p>
                                        <button onClick={() => handleOpenForm(d)} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDiscountToDelete(d)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-center text-gray-500 py-12">Nenhuma promoção por dia cadastrada.</p>
                        )}
                    </div>
                </div>
            </div>
            {discountToDelete && (
                <DeleteDiscountConfirmationModal
                    isOpen={!!discountToDelete}
                    onClose={() => setDiscountToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    discountName={discountToDelete.name}
                />
            )}
        </>
    );
};

export default DiscountsManagement;
