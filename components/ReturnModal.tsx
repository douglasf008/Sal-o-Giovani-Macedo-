import React, { useState, useMemo } from 'react';
import { SaleProduct, Professional, StockItem } from '../types';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import { useStock } from '../contexts/StockContext';
import AdminAddStockItemModal from './AdminAddStockItemModal';

interface ReturnItem {
    product: SaleProduct;
    quantity: number;
}

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (returnedItems: ReturnItem[], professionalId: string, isEmployeePurchase: boolean) => void;
    products: SaleProduct[];
    professionals: Professional[];
    categories: string[];
}

const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, onConfirm, products, professionals, categories }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsToReturn, setItemsToReturn] = useState<ReturnItem[]>([]);
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(professionals[0]?.id || '');
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const { addStockItem } = useStock();

    if (!isOpen) return null;

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, products]);

    const handleAddItem = (product: SaleProduct) => {
        setItemsToReturn(prev => {
            const existingItem = prev.find(item => item.product.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        setSearchTerm('');
    };
    
    const handleSaveNewItemAndReturn = (itemData: Omit<StockItem, 'id'>) => {
        const newItem = addStockItem(itemData);
        
        if (newItem.price !== undefined && newItem.category.toLowerCase() === 'revenda') {
            const saleProduct: SaleProduct = {
                id: newItem.id,
                name: newItem.name,
                price: newItem.price,
                stock: newItem.quantity,
                commissionPercentage: newItem.commissionPercentage,
            };
            handleAddItem(saleProduct);
        } else {
            alert("O item adicionado não é um produto de revenda válido e não pode ser adicionado à devolução.");
        }

        setIsAddItemModalOpen(false);
    };

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        const qty = Math.max(1, newQuantity); // Ensure quantity is at least 1
        setItemsToReturn(prev =>
            prev.map(item =>
                item.product.id === productId ? { ...item, quantity: qty } : item
            )
        );
    };

    const handleRemoveItem = (productId: string) => {
        setItemsToReturn(prev => prev.filter(item => item.product.id !== productId));
    };

    const totalReturnAmount = useMemo(() => {
        return itemsToReturn.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }, [itemsToReturn]);
    
    const handleConfirmClick = () => {
        if (itemsToReturn.length > 0 && selectedProfessionalId) {
            const isEmployeePurchase = selectedProfessionalId === 'salon';
            onConfirm(itemsToReturn, selectedProfessionalId, isEmployeePurchase);
            setSearchTerm('');
            setItemsToReturn([]);
        }
    };

    const isConfirmDisabled = itemsToReturn.length === 0 || !selectedProfessionalId;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full shadow-lg flex flex-col h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">Processar Devolução</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>

                <main className="space-y-4 flex-grow overflow-y-auto pr-2">
                    {/* Search and Add Products */}
                    <div className="relative">
                        <label htmlFor="product-search" className="block text-sm font-medium text-gray-300 mb-2">Buscar Produto Vendido</label>
                        <input
                            id="product-search"
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Digite o nome do produto..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                         {searchTerm && (
                            <div className="absolute w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-48 overflow-y-auto z-10">
                                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                                    <div key={product.id} className="p-3 hover:bg-gray-700 cursor-pointer flex items-center justify-between">
                                        <div>
                                            <p>{product.name}</p>
                                            <p className={`text-xs ${product.stock <= 0 ? 'text-red-400' : 'text-gray-400'}`}>Estoque: {product.stock}</p>
                                        </div>
                                        <button onClick={() => handleAddItem(product)} className="p-1.5 bg-blue-600 rounded-full hover:bg-blue-500">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-3 text-center text-gray-500">
                                        <p>Nenhum produto encontrado.</p>
                                        <button
                                            onClick={() => setIsAddItemModalOpen(true)}
                                            className="mt-2 text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                                        >
                                            + Adicionar produto não encontrado ao estoque
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Items to Return */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Itens para Devolução</h3>
                        {itemsToReturn.length > 0 ? itemsToReturn.map(item => (
                            <div key={item.product.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                                <div>
                                    <p className="font-medium">{item.product.name}</p>
                                    <p className="text-sm text-gray-400">R$ {item.product.price.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={e => handleQuantityChange(item.product.id, parseInt(e.target.value, 10) || 1)}
                                        className="w-16 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-center"
                                    />
                                    <button onClick={() => handleRemoveItem(item.product.id)} className="p-1.5 text-red-400 hover:text-red-300">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-center text-gray-500 py-4">Nenhum item adicionado.</p>}
                    </div>

                    {/* Professional */}
                     <div>
                        <label htmlFor="professional-select" className="block text-sm font-medium text-gray-300 mb-2">Responsável pela Venda Original</label>
                        <select
                            id="professional-select"
                            value={selectedProfessionalId}
                            onChange={e => setSelectedProfessionalId(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            {professionals.map(prof => (
                                <option key={prof.id} value={prof.id}>{prof.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Selecione "Salão" se a devolução for de um produto comprado por um funcionário.</p>
                    </div>

                </main>
                
                <footer className="mt-6 flex-shrink-0">
                    <div className="flex justify-between font-bold text-2xl mb-4 p-4 bg-gray-800 rounded-lg">
                        <span>Total a Devolver:</span>
                        <span className="text-red-400">- R$ {totalReturnAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button
                        onClick={handleConfirmClick}
                        disabled={isConfirmDisabled}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-blue-500 transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                    >
                        Confirmar Devolução
                    </button>
                </footer>

                {isAddItemModalOpen && (
                    <AdminAddStockItemModal
                        onClose={() => setIsAddItemModalOpen(false)}
                        onSave={handleSaveNewItemAndReturn}
                        categories={categories}
                        itemToEdit={null}
                    />
                )}
            </div>
        </div>
    );
};

export default ReturnModal;