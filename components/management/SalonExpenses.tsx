import React, { useState, useMemo, useEffect } from 'react';
import { useExpenses } from '../../contexts/ExpensesContext';
import { SalonExpense, StockItem, Professional } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import XIcon from '../icons/XIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import { useStock } from '../../contexts/StockContext';
import AdminAddStockItemModal from '../AdminAddStockItemModal';
import CubeIcon from '../icons/CubeIcon';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import { useFinancials } from '../../contexts/FinancialsContext';
import { usePaymentCycle } from '../../hooks/usePaymentCycle';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';
import ReceiptPercentIcon from '../icons/ReceiptPercentIcon';

const MANUAL_EXPENSE_CATEGORIES = ['Pagamentos de Equipe', 'Despesas Fixas', 'Despesas Diversas'];

// --- Add/Edit Modal ---
const ExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any, idToUpdate?: string) => void;
    expenseToEdit?: SalonExpense | null;
    stockItems: StockItem[];
    onAddNewItem: () => void;
}> = ({ isOpen, onClose, onSave, expenseToEdit, stockItems, onAddNewItem }) => {
    const isEditing = !!expenseToEdit;
    
    // Common state
    const [category, setCategory] = useState(MANUAL_EXPENSE_CATEGORIES[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Regular expense state
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setDescription(expenseToEdit.description);
                setAmount(String(expenseToEdit.amount));
                setCategory(expenseToEdit.category);
                setDate(expenseToEdit.date);
            } else {
                // Reset all fields for new entry
                setDescription('');
                setAmount('');
                setCategory(MANUAL_EXPENSE_CATEGORIES[0]);
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [expenseToEdit, isOpen]);

    if (!isOpen) return null;
    
    const handleSave = () => {
        const numericAmount = parseFloat(amount.replace(',', '.'));
        if (!description.trim() || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Por favor, preencha a descrição e um valor válido.');
            return;
        }
        const expenseData: Omit<SalonExpense, 'id'> = { description, amount: numericAmount, category, date };
        onSave(expenseData, expenseToEdit?.id);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Despesa' : 'Adicionar Despesa'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="exp-category" className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <select id="exp-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" disabled={isEditing}>
                             {isEditing 
                                ? <option value={category}>{category}</option> 
                                : MANUAL_EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                            }
                        </select>
                    </div>
                    <div>
                        <label htmlFor="exp-desc" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                        <input type="text" id="exp-desc" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" />
                    </div>
                    <div>
                        <label htmlFor="exp-amount-regular" className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
                        <input type="number" id="exp-amount-regular" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="0,00" />
                    </div>
                     <div>
                        <label htmlFor="exp-date" className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                        <input type="date" id="exp-date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" style={{ colorScheme: 'dark' }}/>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 font-semibold rounded-lg hover:bg-blue-500">Salvar</button>
                </div>
            </div>
        </div>
    );
};

// --- Delete Confirmation Modal ---
const DeleteExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    expense: SalonExpense | null;
}> = ({ isOpen, onClose, onConfirm, expense }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                <p className="text-gray-300 mb-6">
                    Tem certeza que deseja apagar a despesa "{expense?.description}" no valor de R$ {expense?.amount.toFixed(2).replace('.', ',')}?
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500">Apagar</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const SalonExpenses: React.FC = () => {
    const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
    const { professionals } = useProfessionals();
    const { stockItems, addStockItem, updateStockItem } = useStock();
    const { settings: financialSettings } = useFinancials();
    const { currentCycle } = usePaymentCycle();
    const { sales } = useSalesHistory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<SalonExpense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<SalonExpense | null>(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

    const salaryExpenses = useMemo(() => {
        const expenseDate = new Date().toISOString().split('T')[0];

        return professionals
            .filter(prof => 
                prof.employmentType === 'salaried' && 
                prof.isSalaryActive && 
                prof.fixedSalary && 
                prof.fixedSalary > 0 &&
                prof.salarySource === 'salon'
            )
            .map(prof => {
                let salaryForCycle = prof.fixedSalary || 0;
                let description = `Salário Fixo: ${prof.name}`;
                
                if (financialSettings.cycleConfig.cycleType === 'days_5_20') {
                    salaryForCycle = salaryForCycle / 2;
                    description = `Salário Fixo (Quinzena): ${prof.name}`;
                }

                return {
                    id: `salary-${prof.id}`,
                    date: expenseDate,
                    description: description,
                    category: 'Pagamentos de Equipe',
                    amount: salaryForCycle,
                };
            });
    }, [professionals, financialSettings.cycleConfig.cycleType]);

    const commissionExpense = useMemo(() => {
        const { startDate, endDate } = currentCycle;

        const salesInCycle = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });

        const totalCommission = salesInCycle.reduce((sum, sale) => {
            const saleCommission = sale.items.reduce((itemSum, item) => itemSum + item.finalCommissionValue, 0);
            return sum + saleCommission;
        }, 0);

        if (totalCommission > 0) {
            return {
                id: 'auto-commission-cycle',
                date: endDate.toISOString().split('T')[0],
                description: 'Pagamento de comissões (Ciclo)',
                category: 'Pagamentos de Equipe',
                amount: totalCommission,
            };
        }

        return null;
    }, [currentCycle, sales]);
    
    const allTimeExpenses = useMemo(() => {
        const combined = [...expenses, ...salaryExpenses];
        if (commissionExpense) {
            combined.push(commissionExpense);
        }
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, salaryExpenses, commissionExpense]);
    
    const allCategories = useMemo(() => {
        const uniqueCategories = new Set(allTimeExpenses.map(exp => exp.category));
        return ['Todos', ...Array.from(uniqueCategories).sort()];
    }, [allTimeExpenses]);


    const displayedExpenses = useMemo(() => {
        if (selectedCategory === 'Todos') {
            return allTimeExpenses;
        }
        return allTimeExpenses.filter(exp => exp.category === selectedCategory);
    }, [allTimeExpenses, selectedCategory]);
    
    const stockCategories = useMemo(() => [...new Set(stockItems.map(item => item.category))].sort(), [stockItems]);
    
    const handleOpenAddModal = () => {
        setExpenseToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (expense: SalonExpense) => {
        setExpenseToEdit(expense);
        setIsModalOpen(true);
    };

    const handleSave = (data: any, idToUpdate?: string) => {
        if (idToUpdate) {
            updateExpense({ ...data, id: idToUpdate });
        } else {
            addExpense(data);
        }
        setIsModalOpen(false);
    };

    const handleOpenDeleteModal = (expense: SalonExpense) => {
        setExpenseToDelete(expense);
        setIsDeleteModalOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
        }
        setIsDeleteModalOpen(false);
        setExpenseToDelete(null);
    };

    const handleOpenAddStockModal = () => {
        setIsStockModalOpen(true);
    };

    const handleSaveStockItem = (itemData: Omit<StockItem, 'id'> | StockItem) => {
        const handleExpense = (item: StockItem, quantity: number, cost: number) => {
             addExpense({
                id: `auto-stock-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `Compra de estoque: ${quantity}x ${item.name}`,
                category: 'Compra de Produtos',
                amount: cost * quantity,
            });
        };

        if ('id' in itemData) {
            const oldItem = stockItems.find(i => i.id === itemData.id);
            if (oldItem) {
                const quantityIncrease = itemData.quantity - oldItem.quantity;
                if (quantityIncrease > 0 && itemData.cost) {
                    handleExpense(itemData, quantityIncrease, itemData.cost);
                }
            }
            updateStockItem(itemData);
            alert('Item de estoque atualizado!');
        } else {
            const newItem = addStockItem(itemData);
            if (newItem.cost && newItem.cost > 0 && newItem.quantity > 0) {
                handleExpense(newItem, newItem.quantity, newItem.cost);
                alert('Item adicionado ao estoque e despesa registrada com sucesso!');
            } else {
                alert('Item adicionado ao estoque!');
            }
        }
        setIsStockModalOpen(false);
    };
    
    const handleAddNewItemFromExpenseModal = () => {
        setIsModalOpen(false);
        setIsStockModalOpen(true);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Despesas do Salão</h2>
                        <p className="text-gray-400">Registre e acompanhe os gastos operacionais.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                            <PlusIcon className="w-5 h-5" />
                            <span>Registrar Despesa</span>
                        </button>
                    </div>
                </div>

                <div className="my-4">
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                        {allCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-gray-200 text-black'
                                        : 'bg-gray-800 text-white hover:bg-gray-700'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold px-2 pb-2">Histórico de Despesas (Todas as Datas)</h3>
                    <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-3 bg-gray-800 text-xs text-gray-400 uppercase font-semibold">
                        <div className="col-span-2">Descrição</div>
                        <div className="col-span-1">Categoria</div>
                        <div className="col-span-1">Data</div>
                        <div className="col-span-1 text-right">Valor</div>
                        <div className="col-span-1 text-right">Ações</div>
                    </div>
                    <div className="space-y-4 md:space-y-0 max-h-[60vh] overflow-y-auto">
                        {displayedExpenses.length > 0 ? (
                            displayedExpenses.map(exp => {
                                const isSalary = exp.id.startsWith('salary-');
                                const isCommission = exp.id === 'auto-commission-cycle';
                                const isStockPurchase = exp.category === 'Compra de Produtos';
                                const isAutoGenerated = isSalary || isCommission || isStockPurchase;

                                return (
                                <div key={exp.id} className={`${isAutoGenerated ? 'bg-gray-800/50' : 'bg-gray-800'} p-4 rounded-lg md:bg-transparent md:p-0 md:rounded-none md:grid md:grid-cols-6 md:gap-4 md:items-center md:px-6 md:py-4 md:border-b md:border-gray-800 hover:md:bg-gray-800/50`}>
                                    
                                    <div className="md:hidden">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold flex items-center gap-2">
                                                    {isSalary && <CurrencyDollarIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                                                    {isCommission && <ReceiptPercentIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                                                    {isStockPurchase && <CubeIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                                                    {exp.description}
                                                </p>
                                                <p className="text-sm text-gray-400">{exp.category}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className="font-semibold text-lg text-red-400">-R$ {exp.amount.toFixed(2).replace('.',',')}</p>
                                                <p className="text-xs text-gray-500">{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        {!isAutoGenerated && (
                                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-700">
                                                <button onClick={() => handleOpenEditModal(exp)} className="px-3 py-1 text-xs font-semibold bg-gray-700 rounded-md hover:bg-gray-600">Editar</button>
                                                <button onClick={() => handleOpenDeleteModal(exp)} className="px-3 py-1 text-xs font-semibold bg-red-800/50 text-red-400 border border-red-800 rounded-md hover:bg-red-800/80">Apagar</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden md:flex col-span-2 font-medium items-center gap-2">
                                        {isSalary && <CurrencyDollarIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                                        {isCommission && <ReceiptPercentIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                                        {isStockPurchase && <CubeIcon className="w-5 h-5 text-sky-400 flex-shrink-0" />}
                                        {exp.description}
                                    </div>
                                    <div className="hidden md:block col-span-1 text-sm text-gray-300">
                                        <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">{exp.category}</span>
                                    </div>
                                    <div className="hidden md:block col-span-1 text-sm text-gray-400">{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                                    <div className="hidden md:block col-span-1 text-right font-semibold text-red-400">R$ {exp.amount.toFixed(2).replace('.', ',')}</div>
                                    <div className="hidden md:flex items-center justify-end gap-2">
                                        {isAutoGenerated ? (
                                            <span className="text-xs text-gray-500 italic pr-2">Automático</span>
                                        ) : (
                                            <>
                                                <button onClick={() => handleOpenEditModal(exp)} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleOpenDeleteModal(exp)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )})
                        ) : (
                            <p className="text-center text-gray-500 py-12">Nenhuma despesa encontrada.</p>
                        )}
                    </div>
                </div>
            </div>
            
            <ExpenseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                expenseToEdit={expenseToEdit}
                stockItems={stockItems}
                onAddNewItem={() => { /* This feature is removed from this modal */ }}
            />
            <DeleteExpenseModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                expense={expenseToDelete}
            />
            {isStockModalOpen && (
                <AdminAddStockItemModal
                    onClose={() => setIsStockModalOpen(false)}
                    onSave={handleSaveStockItem}
                    categories={stockCategories}
                    itemToEdit={null}
                    stockItems={stockItems}
                />
            )}
        </>
    );
};

export default SalonExpenses;