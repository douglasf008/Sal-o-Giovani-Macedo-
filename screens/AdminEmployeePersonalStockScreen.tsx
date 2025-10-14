import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import { StockItem } from '../types';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';

interface PersonalDashboardData {
    stock: StockItem[];
}

const usePersonalDashboardData = (employeeId: string) => {
    const dataKey = `personal_dashboard_${employeeId}`;
    
    const [data, setData] = useState<PersonalDashboardData>({ 
        stock: [],
    });
    
    useEffect(() => {
        const loadData = () => {
            try {
                const storedData = localStorage.getItem(dataKey);
                if (storedData) {
                    const parsed = JSON.parse(storedData);
                    setData({
                        stock: parsed.stock || [],
                    });
                }
            } catch (e) {
                console.error("Failed to load personal dashboard data", e);
            }
        };
        loadData();
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === dataKey) {
                loadData();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);

    }, [employeeId, dataKey]);

    const saveData = (newData: Partial<PersonalDashboardData>) => {
        setData(currentData => {
            const dataToSave = { ...currentData, ...newData };
            try {
                localStorage.setItem(dataKey, JSON.stringify(dataToSave));
            } catch (e) {
                console.error("Failed to save personal dashboard data", e);
            }
            return dataToSave;
        });
    };

    return { data, saveData };
};

const PersonalStockModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<StockItem, 'id'> | StockItem) => void;
    itemToEdit?: StockItem | null;
}> = ({ isOpen, onClose, onSave, itemToEdit }) => {
    const isEditing = !!itemToEdit;
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setQuantity(String(itemToEdit.quantity));
            setCost(String(itemToEdit.cost || ''));
            setPrice(String(itemToEdit.price || ''));
        } else {
            setName('');
            setQuantity('');
            setCost('');
            setPrice('');
        }
    }, [itemToEdit]);
    
    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            alert("O nome do item é obrigatório.");
            return;
        }
        const itemData = {
            name,
            quantity: parseInt(quantity, 10) || 0,
            cost: parseFloat(cost) || undefined,
            price: parseFloat(price) || undefined,
            category: 'Pessoal',
            detail: 'Item Pessoal',
            lowStockThreshold: 0,
        };
        if (isEditing && itemToEdit) {
            onSave({ ...itemToEdit, ...itemData });
        } else {
            onSave(itemData);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Item' : 'Novo Item de Estoque'}</h2>
                <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Item" className="w-full bg-gray-800 p-2 rounded" />
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantidade" className="w-full bg-gray-800 p-2 rounded" />
                    <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="Custo (R$)" className="w-full bg-gray-800 p-2 rounded" />
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Preço de Venda (R$)" className="w-full bg-gray-800 p-2 rounded" />
                </div>
                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const AdminEmployeePersonalStockScreen: React.FC = () => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const { professionals } = useProfessionals();
    const { data, saveData } = usePersonalDashboardData(employeeId!);
    const [modalOpen, setModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);

    const employee = professionals.find(p => p.id === employeeId);
    const { stock } = data;

    if (!employee) {
        return <p>Funcionário não encontrado.</p>;
    }
    
    const handleStockChange = (newStock: StockItem[]) => {
        saveData({ stock: newStock });
    };

    const handleSave = (itemData: Omit<StockItem, 'id'> | StockItem) => {
        let newStock;
        if ('id' in itemData) {
            newStock = stock.map(i => i.id === itemData.id ? itemData : i);
        } else {
            const newItem = { ...itemData, id: `personal-stock-${Date.now()}` };
            newStock = [...stock, newItem];
        }
        handleStockChange(newStock);
        setModalOpen(false);
    };
    
    const handleQuantityChange = (itemId: string, delta: number) => {
        const newStock = stock.map(item => 
            item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        );
        handleStockChange(newStock);
    };

    const handleRemove = (itemId: string) => {
        if(window.confirm("Tem certeza que deseja remover este item?")) {
            handleStockChange(stock.filter(i => i.id !== itemId));
        }
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                <div className="text-center mx-auto">
                    <h1 className="text-xl font-bold">Meu Estoque Pessoal</h1>
                    <p className="text-sm text-gray-400">{employee.name}</p>
                </div>
                <div className="w-6" />
            </header>
            <main className="flex-grow overflow-y-auto p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Itens em Estoque</h3>
                    <button onClick={() => { setItemToEdit(null); setModalOpen(true); }} className="flex items-center gap-1.5 text-sm bg-blue-600 px-3 py-2 rounded-lg font-semibold">
                        <PlusIcon className="w-5 h-5"/> Novo Item
                    </button>
                </div>
                 <div className="space-y-2">
                    {stock.length > 0 ? stock.map(item => (
                        <div key={item.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-gray-400">Custo: R$ {item.cost?.toFixed(2).replace('.',',') || 'N/A'} | Venda: R$ {item.price?.toFixed(2).replace('.',',') || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => handleQuantityChange(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded-full text-lg">-</button>
                               <p className="font-bold w-8 text-center">{item.quantity}</p>
                               <button onClick={() => handleQuantityChange(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded-full text-lg">+</button>
                               <button onClick={() => { setItemToEdit(item); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                               <button onClick={() => handleRemove(item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    )) : <p className="text-center text-gray-500 py-8">Nenhum item em estoque.</p>}
                 </div>
            </main>
            <PersonalStockModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} itemToEdit={itemToEdit} />
        </div>
    );
};

export default AdminEmployeePersonalStockScreen;
