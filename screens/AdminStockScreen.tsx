import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockItem } from '../types';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PlusIcon from '../components/icons/PlusIcon';
import WarningIcon from '../components/icons/WarningIcon';
import AdminAddStockItemModal from '../components/AdminAddStockItemModal';
import { useStock } from '../contexts/StockContext';
import FloatingColoringCalculator from '../components/FloatingColoringCalculator';
import { useAuth } from '../contexts/AuthContext';
import CalculatorIcon from '../components/icons/CalculatorIcon';
import { useExpenses } from '../contexts/ExpensesContext';

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                <p className="text-gray-300 mb-6">Tem certeza que deseja apagar este item? Esta ação não pode ser desfeita.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                        Apagar
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminStockScreen: React.FC = () => {
    const navigate = useNavigate();
    const { stockItems, addStockItem, updateStockItem, deleteStockItem, updateStockQuantity } = useStock();
    const { addExpense } = useExpenses();
    const { loggedInProfessional } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
    const [isColoringCalculatorOpen, setIsColoringCalculatorOpen] = useState(false);

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        } else if (!loggedInProfessional.permissions?.includes('Estoque')) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate]);

    const categories = useMemo(() => [...new Set(stockItems.map(item => item.category))].sort(), [stockItems]);
    const [activeTab, setActiveTab] = useState(categories[0] || '');

    useEffect(() => {
        const activeTabExists = categories.includes(activeTab);

        if ((!activeTabExists || !activeTab) && categories.length > 0) {
            setActiveTab(categories[0]);
        } else if (categories.length === 0) {
            setActiveTab('');
        }
    }, [categories, activeTab]);

    const sortedFilteredItems = useMemo(() => {
        const items = stockItems.filter(item => item.category === activeTab);
    
        if (activeTab === 'Coloração' || activeTab === 'Tonalizante') {
            const colorRegex = /\b(\d{1,2}(?:\.\d{1,2})?)\b/;
            
            const extractColorValue = (item: StockItem): number => {
                const match = item.detail.match(colorRegex) || item.name.match(colorRegex);
                return match ? parseFloat(match[1]) : Infinity;
            };
    
            return items.sort((a, b) => {
                const colorA = extractColorValue(a);
                const colorB = extractColorValue(b);
                return colorA - colorB;
            });
        }
    
        return items.sort((a, b) => a.name.localeCompare(b.name));
    }, [stockItems, activeTab]);


    const handleQuantityChange = (itemId: string, delta: number) => {
        const item = stockItems.find(i => i.id === itemId);
        if (item) {
            updateStockQuantity(itemId, item.quantity + delta);
        }
    };

    const handleDeleteItem = (item: StockItem) => {
        setItemToDelete(item);
        setIsDeleteConfirmOpen(true);
        setActiveMenu(null);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteStockItem(itemToDelete.id);
        }
        setIsDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleOpenEditModal = (item: StockItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
        setActiveMenu(null);
    };
    
    const handleOpenAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveItem = (itemData: Omit<StockItem, 'id'> | StockItem) => {
        if ('id' in itemData) { // This is an update
            const oldItem = stockItems.find(i => i.id === itemData.id);
            if (oldItem) {
                const quantityIncrease = itemData.quantity - oldItem.quantity;
                // Only register expense if quantity increased and there is a cost
                if (quantityIncrease > 0 && itemData.cost && itemData.cost > 0) {
                    addExpense({
                        id: `auto-stock-${Date.now()}`,
                        date: new Date().toISOString().split('T')[0],
                        description: `Adição ao estoque: ${quantityIncrease}x ${itemData.name}`,
                        category: 'Compra de Produtos',
                        amount: itemData.cost * quantityIncrease,
                    });
                }
            }
            updateStockItem(itemData);
        } else { // This is a new item
            const newItem = addStockItem(itemData);
            
            // Register expense if there is a cost and quantity, for any category
            if (newItem.cost && newItem.cost > 0 && newItem.quantity > 0) {
                addExpense({
                    id: `auto-stock-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    description: `Compra de estoque: ${newItem.quantity}x ${newItem.name}`,
                    category: 'Compra de Produtos',
                    amount: newItem.cost * newItem.quantity,
                });
            }
    
            const newItemCategory = itemData.category;
            if (!categories.includes(newItemCategory)) {
                setActiveTab(newItemCategory);
            }
        }
        handleCloseModal();
    };

    const renderDetailWithHighlight = (detail: string, category: string) => {
        if (category !== 'Coloração' && category !== 'Tonalizante') {
            return detail;
        }
        
        const colorRegex = /\b(\d{1,2}(?:\.\d{1,2})?)\b/;
        const match = detail.match(colorRegex);
        
        if (match) {
            const colorNumber = match[1];
            const parts = detail.split(colorNumber);
            return (
                <>
                    {parts[0]}
                    <span className="bg-gray-700 text-white font-bold px-1.5 py-0.5 rounded-md mx-1">{colorNumber}</span>
                    {parts[1]}
                </>
            );
        }
        
        return detail;
    };

    if (!loggedInProfessional || !loggedInProfessional.permissions?.includes('Estoque')) {
        return null;
    }


    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate('/admin')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Estoque</h1>
                 <button 
                    onClick={() => setIsColoringCalculatorOpen(true)} 
                    className="p-2 rounded-full hover:bg-gray-800"
                    title="Abrir Calculadora de Coloração"
                 >
                    <CalculatorIcon className="w-6 h-6 text-gray-400" />
                </button>
            </header>
            
            <div className="px-4 border-b border-gray-700">
                <div className="flex space-x-6 overflow-x-auto">
                    {categories.map(category => (
                        <button 
                            key={category}
                            onClick={() => setActiveTab(category)}
                            className={`py-3 text-sm font-semibold whitespace-nowrap ${activeTab === category ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto px-4 pt-4 pb-24">
                <div className="space-y-1">
                    {sortedFilteredItems.map(item => {
                        const isLowStock = item.quantity < item.lowStockThreshold;
                        return (
                            <div 
                                key={item.id} 
                                className={`p-4 rounded-lg flex justify-between items-center ${isLowStock ? 'bg-red-900/20' : ''}`}
                            >
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-gray-400">
                                        {item.brand && <span className="font-semibold">{item.brand}</span>}
                                        {item.brand && item.detail ? ' - ' : ''}
                                        {renderDetailWithHighlight(item.detail, activeTab)}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                     {isLowStock && <WarningIcon className="w-5 h-5 text-red-500" />}

                                    <button onClick={() => handleQuantityChange(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors text-lg font-bold">-</button>
                                    <p className={`font-bold text-lg w-10 text-center ${isLowStock ? 'text-red-500' : ''}`}>{item.quantity}</p>
                                    <button onClick={() => handleQuantityChange(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors text-lg font-bold">+</button>
                                    
                                    <div className="relative">
                                        <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="p-2 text-gray-400 hover:text-white rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                            </svg>
                                        </button>
                                        {activeMenu === item.id && (
                                            <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                                                <button onClick={() => handleOpenEditModal(item)} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Editar</button>
                                                <button onClick={() => handleDeleteItem(item)} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Apagar</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="fixed bottom-6 right-6 max-w-md mx-auto w-full flex justify-end pr-10">
                <button 
                    onClick={handleOpenAddModal}
                    className="bg-gray-200 text-black rounded-full p-4 shadow-lg hover:bg-white transition-colors"
                    aria-label="Adicionar item ao estoque"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
            {isModalOpen && <AdminAddStockItemModal onClose={handleCloseModal} onSave={handleSaveItem} categories={categories} itemToEdit={editingItem} stockItems={stockItems} />}
            <DeleteConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
            />
            <FloatingColoringCalculator 
                isOpen={isColoringCalculatorOpen}
                onClose={() => setIsColoringCalculatorOpen(false)}
            />
        </div>
    );
};

export default AdminStockScreen;