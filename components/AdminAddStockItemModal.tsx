import React, { useState, useEffect, useMemo } from 'react';
import { StockItem } from '../types';
import XIcon from './icons/XIcon';

interface AdminAddStockItemModalProps {
    onClose: () => void;
    onSave: (item: Omit<StockItem, 'id'> | StockItem) => void;
    categories: string[];
    itemToEdit?: StockItem | null;
    stockItems: StockItem[];
}

// Updated Naming Logic based on Colorimetry Guide
const BASE_TONE_MAP: { [key: string]: string } = {
  '1': 'Preto',
  '2': 'Castanho Escuríssimo',
  '3': 'Castanho Escuro',
  '4': 'Castanho Médio',
  '5': 'Castanho Claro',
  '6': 'Louro Escuro',
  '7': 'Louro Médio',
  '8': 'Louro Claro',
  '9': 'Louro Muito Claro',
  '10': 'Louro Claríssimo',
  '11': 'Louro Super Clareador',
  '12': 'Louro Super Clareador',
};

const NUANCE_MAP: { [key: string]: string } = {
  '0': 'Natural',
  '1': 'Acinzentado',
  '2': 'Irisado',
  '3': 'Dourado',
  '4': 'Acobreado',
  '5': 'Acaju',
  '6': 'Vermelho',
  '7': 'Marrom',
  '8': 'Azul',
};


const AdminAddStockItemModal: React.FC<AdminAddStockItemModalProps> = ({ onClose, onSave, categories, itemToEdit, stockItems }) => {
    const isEditing = !!itemToEdit;

    const allCategories = useMemo(() => {
        const cats = new Set(categories);
        cats.add('Revenda');
        if (itemToEdit?.category) {
            cats.add(itemToEdit.category);
        }
        return Array.from(cats);
    }, [categories, itemToEdit]);

    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState(categories[0] || '');
    const [newCategory, setNewCategory] = useState('');
    const [detail, setDetail] = useState('');
    const [quantity, setQuantity] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('');
    const [price, setPrice] = useState('');
    const [commission, setCommission] = useState('');
    const [cost, setCost] = useState('');

    useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setBrand(itemToEdit.brand || '');
            setCategory(itemToEdit.category);
            setDetail(itemToEdit.detail);
            setQuantity(String(itemToEdit.quantity));
            setLowStockThreshold(String(itemToEdit.lowStockThreshold));
            setPrice(itemToEdit.price ? String(itemToEdit.price) : '');
            setCommission(itemToEdit.commissionPercentage ? String(itemToEdit.commissionPercentage) : '');
            setCost(itemToEdit.cost ? String(itemToEdit.cost) : '');
        } else {
            // Reset form for adding new, with defaults
            setName('');
            setCategory(categories[0] || '');
            setNewCategory('');
            setBrand('');
            setDetail('');
            setQuantity('1');
            setLowStockThreshold('1');
            setPrice('');
            setCommission('');
            setCost('');
        }
    }, [itemToEdit, categories]);

    const isNewCategory = category === 'new';
    const finalCategory = isNewCategory ? newCategory : category;

    const brandSuggestions = useMemo(() => {
        if (!stockItems || stockItems.length === 0) return [];

        const categoryBrands = new Set<string>();
        const otherBrands = new Set<string>();

        for (const item of stockItems) {
            if (item.brand) {
                if (item.category === finalCategory) {
                    categoryBrands.add(item.brand);
                } else {
                    otherBrands.add(item.brand);
                }
            }
        }
        
        const sortedCategoryBrands = Array.from(categoryBrands).sort();
        const sortedOtherBrands = Array.from(otherBrands).filter(b => !categoryBrands.has(b)).sort();

        return [...sortedCategoryBrands, ...sortedOtherBrands];
    }, [stockItems, finalCategory]);

    const isColorationOrToner = finalCategory.toLowerCase() === 'coloração' || finalCategory.toLowerCase() === 'tonalizante';
    const isResale = finalCategory.toLowerCase() === 'revenda';
    
    // Autofill cost for coloration/toner based on brand
    useEffect(() => {
        if (!isEditing && brand && isColorationOrToner) {
            const matchingItem = stockItems.find(item => 
                item.brand === brand && 
                item.category === finalCategory &&
                item.cost
            );
            if (matchingItem) {
                setCost(String(matchingItem.cost));
            }
        }
    }, [brand, finalCategory, isEditing, stockItems, isColorationOrToner]);


    useEffect(() => {
        if (isColorationOrToner) {
            // More robust regex to handle various formats
            const match = detail.trim().match(/^(\d{1,2})(?:[.,](\d)(\d)?)?/);
            if (match) {
                const baseStr = match[1];
                const primaryNuanceStr = match[2];
                const secondaryNuanceStr = match[3];

                let baseName = '';
                let nuances = '';

                // 1. Process Base Tone
                if (baseStr.length === 2 && baseStr[0] === baseStr[1]) {
                    baseName = BASE_TONE_MAP[baseStr[0]];
                    if (baseName) {
                        baseName += ' INTENSO';
                    }
                } else {
                    baseName = BASE_TONE_MAP[baseStr];
                }

                if (!baseName) return; // If base tone is not valid, stop.

                // 2. Process Nuances
                if (primaryNuanceStr) {
                    const primary = NUANCE_MAP[primaryNuanceStr];
                    
                    if (secondaryNuanceStr) {
                        const secondary = NUANCE_MAP[secondaryNuanceStr];
                        
                        if (primaryNuanceStr === '0') { // Rule: X.0Y -> Suave
                            nuances = secondary ? `${secondary} SUAVE` : primary;
                        } else if (secondaryNuanceStr === '0') { // Rule: X.Y0 -> Profundo
                            nuances = `${primary} PROFUNDO`;
                        } else if (primaryNuanceStr === secondaryNuanceStr) { // Rule: X.YY -> Intenso
                            nuances = `${primary} INTENSO`;
                        } else { // Standard two nuances
                            nuances = primary && secondary ? `${primary} ${secondary}` : primary || secondary || '';
                        }
                    } else {
                        // Only primary nuance exists
                        nuances = primary;
                    }
                }
                
                // Build the final name
                const generatedName = `${finalCategory} - ${baseName} ${nuances}`.trim().replace(/ +/g, ' ');
                setName(generatedName);
            }
        }
    }, [detail, finalCategory, isColorationOrToner]);


    const handleSave = () => {
        if (!name || !finalCategory || !quantity || !lowStockThreshold || (isResale && !price)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const numericCost = cost ? parseFloat(cost.replace(',', '.')) : 0;

        const baseItemData = {
            name,
            category: finalCategory,
            brand: brand || undefined,
            detail,
            quantity: parseInt(quantity, 10),
            lowStockThreshold: parseInt(lowStockThreshold, 10),
            price: isResale ? parseFloat(price) : undefined,
            cost: numericCost > 0 ? numericCost : undefined,
            commissionPercentage: isResale && commission ? parseInt(commission, 10) : undefined,
        };

        if (isEditing && itemToEdit) {
            onSave({ ...baseItemData, id: itemToEdit.id });
        } else {
            onSave(baseItemData);
        }
    };

    const isFormValid = name && finalCategory && quantity && lowStockThreshold && (!isResale || price);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800">
                <button onClick={onClose} className="p-2 -ml-2"><XIcon /></button>
                <h1 className="text-xl font-bold mx-auto">{isEditing ? 'Editar Item' : 'Adicionar Item ao Estoque'}</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <div className="flex-grow overflow-y-auto px-4 pb-24 space-y-6 pt-6">
                <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-300 mb-2">Nome do Item</label>
                    <input
                        type="text"
                        id="itemName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="Ex: Shampoo Hidratante"
                    />
                </div>

                <div>
                    <label htmlFor="itemBrand" className="block text-sm font-medium text-gray-300 mb-2">Marca (Opcional)</label>
                    <input
                        type="text"
                        id="itemBrand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="Ex: Wella (digite ou selecione)"
                        list="brand-suggestions"
                    />
                    <datalist id="brand-suggestions">
                        {brandSuggestions.map((b) => <option key={b} value={b} />)}
                    </datalist>
                    <p className="text-xs text-gray-500 mt-1">Marcas usadas nesta categoria aparecerão primeiro.</p>
                </div>
                
                <div>
                    <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                    <select
                        id="itemCategory"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="new">Nova Categoria</option>
                    </select>
                </div>

                {isNewCategory && (
                     <div>
                        <label htmlFor="newCategory" className="block text-sm font-medium text-gray-300 mb-2">Nome da Nova Categoria</label>
                        <input
                            type="text"
                            id="newCategory"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: Finalizadores"
                        />
                    </div>
                )}
                
                <div>
                    <label htmlFor="itemDetail" className="block text-sm font-medium text-gray-300 mb-2">Detalhe (Opcional)</label>
                    <input
                        type="text"
                        id="itemDetail"
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder={isColorationOrToner ? "Digite o número da cor, Ex: 7.1" : "Ex: 1L"}
                    />
                </div>
                
                <div>
                    <label htmlFor="itemCost" className="block text-sm font-medium text-gray-300 mb-2">Custo de Compra (unidade, R$)</label>
                    <input
                        type="number"
                        id="itemCost"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="Ex: 25.00"
                    />
                </div>

                {isResale && (
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-300 mb-2">Preço de Venda (R$)</label>
                            <input
                                type="number"
                                id="itemPrice"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min="0"
                                step="0.01"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Ex: 45.00"
                            />
                        </div>
                        <div>
                            <label htmlFor="itemCommission" className="block text-sm font-medium text-gray-300 mb-2">Comissão (%)</label>
                            <input
                                type="number"
                                id="itemCommission"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                                min="0"
                                max="100"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Ex: 10"
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                        <input
                            type="number"
                            id="itemQuantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="itemThreshold" className="block text-sm font-medium text-gray-300 mb-2">Alerta de Estoque Baixo</label>
                        <input
                            type="number"
                            id="itemThreshold"
                            value={lowStockThreshold}
                            onChange={(e) => setLowStockThreshold(e.target.value)}
                            min="0"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-black border-t border-gray-800">
                <button
                    onClick={handleSave}
                    disabled={!isFormValid}
                    className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    {isEditing ? 'Salvar Alterações' : 'Salvar Item'}
                </button>
            </div>
        </div>
    );
};

export default AdminAddStockItemModal;