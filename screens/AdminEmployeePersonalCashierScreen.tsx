import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { SaleRecord, StockItem, Service, Client, ProcessedCartItem, CartItem, SaleProduct, ServicePackageTemplate, Appointment } from '../../types';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import XIcon from '../components/icons/XIcon';
import WarningIcon from '../components/icons/WarningIcon';
import { useServices } from '../../contexts/ServicesContext';
import { useClients } from '../../contexts/ClientsContext';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import ArrowUturnLeftIcon from '../components/icons/ArrowUturnLeftIcon';
import ChartIcon from '../components/icons/ChartIcon';
import { useFinancials } from '../../contexts/FinancialsContext';
import GiftIcon from '../components/icons/GiftIcon';
import { useAppointments } from '../../contexts/AppointmentsContext';
import { usePackages } from '../../contexts/PackagesContext';
import AdminAddClientModal from '../components/AdminAddClientModal';

interface PersonalCashierTransaction {
    type: 'sangria' | 'devolucao';
    amount: number;
    reason: string;
    timestamp: string;
}

interface ClosedPersonalCashierSummary {
    id: string;
    date: string;
    closeTime: string;
    initialCash: number;
    finalCash: number;
    difference: number;
    totalSales: number;
    paymentTotals: { [method: string]: number };
    totalTransactions: number;
}

interface PersonalCashierState {
    isOpen: boolean;
    initialCash: number;
    date: string | null;
    openTimestamp: string | null;
    transactions: PersonalCashierTransaction[];
    history: ClosedPersonalCashierSummary[];
}

interface PersonalDashboardData {
    sales: SaleRecord[];
    stock: StockItem[];
    packages: ServicePackageTemplate[];
    cashier: PersonalCashierState;
}

const usePersonalDashboardData = (employeeId: string) => {
    const dataKey = `personal_dashboard_${employeeId}`;
    
    const [data, setData] = useState<PersonalDashboardData>({ 
        sales: [], 
        stock: [],
        packages: [],
        cashier: {
            isOpen: false,
            initialCash: 0,
            date: null,
            openTimestamp: null,
            transactions: [],
            history: [],
        }
    });
    
    useEffect(() => {
        const loadData = () => {
            try {
                const storedData = localStorage.getItem(dataKey);
                if (storedData) {
                    const parsed = JSON.parse(storedData);
                    const defaultCashierState = {
                        isOpen: false, initialCash: 0, date: null, openTimestamp: null, transactions: [], history: []
                    };
                    setData({
                        sales: parsed.sales || [],
                        stock: parsed.stock || [],
                        packages: parsed.packages || [],
                        cashier: { ...defaultCashierState, ...(parsed.cashier || {}) },
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
            const dataToSave = { 
                ...currentData, 
                ...newData,
                cashier: newData.cashier ? { ...currentData.cashier, ...newData.cashier } : currentData.cashier
            };
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

const OpeningCashierModal: React.FC<{ onConfirm: (amount: number) => void; onClose: () => void; }> = ({ onConfirm, onClose }) => {
    const [amount, setAmount] = useState('');
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Abrir Caixa</h2>
                <p className="text-sm text-gray-400 mb-4">Valor inicial para troco (R$).</p>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-800 p-3 rounded text-center text-xl" autoFocus />
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                    <button onClick={() => onConfirm(parseFloat(amount) || 0)} className="px-4 py-2 bg-green-600 rounded">Abrir</button>
                </div>
            </div>
        </div>
    );
};

const TransactionModal: React.FC<{ type: 'sangria' | 'devolucao', onConfirm: (amount: number, reason: string) => void; onClose: () => void; }> = ({ type, onConfirm, onClose }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const title = type === 'sangria' ? 'Registrar Sangria' : 'Registrar Devolução';
    const description = type === 'sangria' ? 'Valor a ser retirado do caixa.' : 'Valor a ser devolvido ao cliente.';

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p className="text-sm text-gray-400 mb-4">{description}</p>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor (R$)" className="w-full bg-gray-800 p-2 rounded mb-2" />
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo (Opcional)" className="w-full bg-gray-800 p-2 rounded" />
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                    <button onClick={() => onConfirm(parseFloat(amount) || 0, reason)} className="px-4 py-2 bg-blue-600 rounded">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const CloseCashierModal: React.FC<{
    summary: { initialCash: number; sales: SaleRecord[]; transactions: PersonalCashierTransaction[] };
    onConfirm: (summaryData: Omit<ClosedPersonalCashierSummary, 'id' | 'date' | 'closeTime'>) => void;
    onClose: () => void;
}> = ({ summary, onConfirm, onClose }) => {
    const [countedCash, setCountedCash] = useState('');
    const { initialCash, sales, transactions } = summary;
    
    const paymentTotals = useMemo(() => {
        return sales.reduce((acc, sale) => {
            const method = sale.payment.method;
            acc[method] = (acc[method] || 0) + sale.totals.total;
            return acc;
        }, {} as { [method: string]: number });
    }, [sales]);

    const totalSales = sales.reduce((sum, sale) => sum + sale.totals.total, 0);
    const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
    const cashSales = paymentTotals['Dinheiro'] || 0;
    const expectedCash = initialCash + cashSales - totalTransactions;
    const difference = (parseFloat(countedCash) || 0) - expectedCash;

    const handleConfirm = () => {
        const finalCash = parseFloat(countedCash) || 0;
        onConfirm({
            initialCash,
            finalCash,
            difference,
            totalSales,
            paymentTotals,
            totalTransactions
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Fechamento de Caixa</h2>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    <div className="bg-gray-800 p-3 rounded">
                        <p className="text-sm text-gray-400">Troco Inicial</p>
                        <p className="font-bold">R$ {initialCash.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                        <p className="text-sm text-gray-400">Vendas em Dinheiro</p>
                        <p className="font-bold text-green-400">+ R$ {cashSales.toFixed(2)}</p>
                    </div>
                    {Object.entries(paymentTotals).filter(([key]) => key !== 'Dinheiro').map(([method, total]) => (
                        <div key={method} className="bg-gray-800 p-3 rounded">
                            <p className="text-sm text-gray-400">Vendas ({method})</p>
                            <p className="font-bold text-green-400">+ R$ {(total as number).toFixed(2)}</p>
                        </div>
                    ))}
                    <div className="bg-gray-800 p-3 rounded">
                        <p className="text-sm text-gray-400">Sangrias/Devoluções</p>
                        <p className="font-bold text-red-400">- R$ {totalTransactions.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded mt-2">
                        <p className="text-sm text-gray-300">Total Esperado em Caixa</p>
                        <p className="font-bold text-xl">R$ {expectedCash.toFixed(2)}</p>
                    </div>
                     <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Valor Contado em Caixa (R$)</label>
                        <input type="number" value={countedCash} onChange={e => setCountedCash(e.target.value)} className="w-full bg-gray-800 p-3 rounded text-xl text-center" autoFocus />
                    </div>
                     {countedCash && (
                        <div className={`p-3 rounded mt-2 text-center ${difference === 0 ? 'bg-gray-700' : difference > 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                            <p className="text-sm">{difference >= 0 ? 'Sobra' : 'Falta'}</p>
                            <p className={`font-bold text-xl ${difference === 0 ? '' : difference > 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {Math.abs(difference).toFixed(2)}</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                    <button onClick={handleConfirm} disabled={!countedCash} className="px-4 py-2 bg-blue-600 rounded disabled:bg-gray-600">Confirmar e Fechar</button>
                </div>
            </div>
        </div>
    );
};

const PersonalCashPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    onConfirm: () => void;
}> = ({ isOpen, onClose, totalAmount, onConfirm }) => {
    const [amountPaid, setAmountPaid] = useState('');
    const amountPaidValue = parseFloat(amountPaid.replace(',', '.')) || 0;
    const change = amountPaidValue > 0 ? amountPaidValue - totalAmount : 0;

    useEffect(() => { if (isOpen) setAmountPaid(''); }, [isOpen]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Pagamento em Dinheiro</h2>
                <div className="bg-gray-800 p-4 rounded-lg text-center mb-4"><p className="text-gray-400">Total da Compra</p><p className="text-3xl font-bold">R$ {totalAmount.toFixed(2).replace('.', ',')}</p></div>
                <div>
                    <label htmlFor="amount-paid" className="block text-sm font-medium text-gray-300 mb-2">Valor Recebido (R$)</label>
                    <input type="text" id="amount-paid" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-bold" placeholder="0,00" autoFocus />
                </div>
                {amountPaidValue >= totalAmount && (<div className="mt-4 bg-blue-900/50 p-4 rounded-lg text-center"><p className="text-blue-300">Troco a ser devolvido</p><p className="text-3xl font-bold text-blue-200">R$ {change.toFixed(2).replace('.', ',')}</p></div>)}
                <div className="mt-6 flex flex-col gap-3">
                    <button onClick={onConfirm} disabled={amountPaidValue < totalAmount} className="w-full bg-green-600 font-semibold rounded-lg py-3 hover:bg-green-500 disabled:bg-gray-600">Confirmar</button>
                    <button onClick={onClose} className="w-full bg-gray-700 font-semibold rounded-lg py-3 hover:bg-gray-600">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const PersonalInstallmentsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (installments: number) => void;
    maxInstallments: number;
    totalAmount: number;
    minInstallmentValue: number;
}> = ({ isOpen, onClose, onConfirm, maxInstallments, totalAmount, minInstallmentValue }) => {
    
    const installmentOptions = useMemo(() => Array.from({ length: maxInstallments }, (_, i) => i + 1).filter(i => (totalAmount / i) >= minInstallmentValue), [totalAmount, maxInstallments, minInstallmentValue]);
    const [installments, setInstallments] = useState(1);
    useEffect(() => { if (isOpen) setInstallments(installmentOptions.length > 0 ? installmentOptions[0] : 1); }, [isOpen, installmentOptions]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Pagamento com Crédito</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Parcelas</label>
                    {installmentOptions.length > 0 ? (<select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">{installmentOptions.map(i => (<option key={i} value={i}>{i}x de R$ {(totalAmount / i).toFixed(2).replace('.', ',')}</option>))}</select>) : (<div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500">Valor baixo para parcelar.</div>)}
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-gray-400">Total</p><p className="text-3xl font-bold">R$ {totalAmount.toFixed(2).replace('.', ',')}</p></div>
                <div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg">Cancelar</button><button onClick={() => onConfirm(installments)} disabled={installmentOptions.length === 0} className="px-4 py-2 bg-green-600 font-semibold rounded-lg disabled:bg-gray-600">Confirmar</button></div>
            </div>
        </div>
    );
};

const DiscountModal: React.FC<{
    item: CartItem;
    onClose: () => void;
    onApply: (itemId: string, value: number, type: 'FIXED' | 'PERCENT') => void;
    onRemove: (itemId: string) => void;
}> = ({ item, onClose, onApply, onRemove }) => {
    const [value, setValue] = useState(String(item.discountValue || ''));
    const [type, setType] = useState<'FIXED' | 'PERCENT'>(item.discountType || 'FIXED');

    const handleApply = () => {
        const numericValue = parseFloat(String(value));
        if (!isNaN(numericValue) && numericValue >= 0) {
            onApply(item.id, numericValue, type);
        } else {
             onRemove(item.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Aplicar Desconto</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <p className="text-gray-300 mb-4">Item: <span className="font-semibold">{item.item.name}</span></p>
                <div className="flex">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full bg-gray-800 border-y border-l border-gray-700 rounded-l-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                        placeholder="0"
                    />
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'FIXED' | 'PERCENT')}
                        className="bg-gray-800 border border-gray-700 rounded-r-lg px-3 py-2.5 focus:outline-none text-sm font-semibold"
                    >
                        <option value="FIXED">R$</option>
                        <option value="PERCENT">%</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 mt-2">
                    {item.discountValue > 0 && (
                        <button onClick={() => onRemove(item.id)} className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Remover
                        </button>
                    )}
                    <button onClick={handleApply} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminEmployeePersonalCashierScreen: React.FC = () => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const { professionals } = useProfessionals();
    const { data, saveData } = usePersonalDashboardData(employeeId!);
    const { services } = useServices();
    const { settings: financialSettings } = useFinancials();
    const { appointments, updateAppointment } = useAppointments();
    const { clients, addClient } = useClients();
    const { buyPackage, useCredit } = usePackages();

    const [modal, setModal] = useState<'opening' | 'closing' | 'sangria' | 'devolucao' | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [itemSearch, setItemSearch] = useState('');
    const [activeItemTab, setActiveItemTab] = useState<'services' | 'products' | 'packages'>('services');
    const [showPayment, setShowPayment] = useState(false);
    const [clientTab, setClientTab] = useState<'scheduled' | 'search'>('scheduled');
    
    const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
    const [isCashPaymentModalOpen, setIsCashPaymentModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [itemForDiscount, setItemForDiscount] = useState<CartItem | null>(null);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [clientSearchForModal, setClientSearchForModal] = useState('');

    const handleSaveNewClient = (clientData: Omit<Client, 'id' | 'avatarUrl' | 'notes'>) => {
        const newClient = addClient(clientData);
        handleSelectClient(newClient);
        setIsAddClientModalOpen(false);
    };

    const handleOpenAddClientModal = () => {
        setClientSearchForModal(clientSearch);
        setIsAddClientModalOpen(true);
    };
    
    const handleSelectClient = (client: Client) => {
        if (selectedClient && selectedClient.id !== client.id) {
            if (cart.length > 0 && !window.confirm("Trocar de cliente irá limpar o carrinho atual. Deseja continuar?")) {
                return;
            }
            setCart([]); // Clear cart if client is switched
        }
        setSelectedClient(client);
        setClientSearch('');
    };
    
    const handleChangeClient = () => {
        if (cart.length > 0) {
            if (window.confirm("Trocar de cliente irá limpar o carrinho atual. Deseja continuar?")) {
                setSelectedClient(null);
                setCart([]);
                setShowPayment(false);
            }
        } else {
            setSelectedClient(null);
            setCart([]);
            setShowPayment(false);
        }
    };

    const handleRemoveFromCart = (cartItemId: string) => {
        setCart(prev => prev.filter(item => item.id !== cartItemId));
    };

    const handleUpdateCartItem = (cartItemId: string, updates: Partial<CartItem>) => {
        setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, ...updates } : item));
    };

    const applyDiscount = (itemId: string, value: number, type: 'FIXED' | 'PERCENT') => {
        handleUpdateCartItem(itemId, { discountValue: value, discountType: type });
        setIsDiscountModalOpen(false);
    };

    const removeDiscount = (itemId: string) => {
        handleUpdateCartItem(itemId, { discountValue: 0, discountType: 'FIXED' });
        setIsDiscountModalOpen(false);
    };

    const employee = professionals.find(p => p.id === employeeId);
    const personalServices = useMemo(() => services.filter(s => s.ownerId === employeeId), [services, employeeId]);
    
    const todayAppointmentsForEmployee = useMemo(() => {
        if (!employeeId) return [];
        const todayString = new Date().toDateString();
        return appointments.filter(app => app.professional.id === employeeId && new Date(app.date).toDateString() === todayString && app.status === 'scheduled').sort((a,b) => a.time.localeCompare(b.time));
    }, [appointments, employeeId]);
    
    const salesInSession = useMemo(() => {
        if (!data.cashier.isOpen || !data.cashier.openTimestamp) return [];
        return data.sales.filter(s => new Date(s.date) >= new Date(data.cashier.openTimestamp!));
    }, [data.sales, data.cashier.isOpen, data.cashier.openTimestamp]);

    const transactionsInSession = useMemo(() => {
        if (!data.cashier.isOpen || !data.cashier.openTimestamp) return [];
        return data.cashier.transactions.filter(t => new Date(t.timestamp) >= new Date(data.cashier.openTimestamp!));
    }, [data.cashier.transactions, data.cashier.isOpen, data.cashier.openTimestamp]);

    const handleOpenCashier = (initialCash: number) => {
        saveData({ cashier: { ...data.cashier, isOpen: true, initialCash, date: new Date().toISOString().split('T')[0], openTimestamp: new Date().toISOString(), transactions: [] } });
        setModal(null);
    };

    const handleConfirmClose = (summaryData: Omit<ClosedPersonalCashierSummary, 'id' | 'date' | 'closeTime'>) => {
        const newHistoryEntry: ClosedPersonalCashierSummary = { ...summaryData, id: `personal_close_${Date.now()}`, date: data.cashier.date!, closeTime: new Date().toISOString() };
        saveData({ cashier: { isOpen: false, initialCash: 0, date: null, openTimestamp: null, transactions: [], history: [newHistoryEntry, ...data.cashier.history] } });
        setModal(null);
    };

    const handleAddTransaction = (amount: number, reason: string) => {
        const type = modal as 'sangria' | 'devolucao';
        const newTransaction: PersonalCashierTransaction = { type, amount, reason, timestamp: new Date().toISOString() };
        saveData({ cashier: { ...data.cashier, transactions: [...data.cashier.transactions, newTransaction] }});
        setModal(null);
    };

    const { processedCart, totals } = useMemo(() => {
        const processed = cart.map(item => {
            const effectivePrice = item.item.price;
            let manualDiscount = 0;

            if (item.discountValue > 0) {
                if (item.discountType === 'FIXED') {
                    manualDiscount = Math.min(effectivePrice, item.discountValue);
                } else { // PERCENT
                    manualDiscount = effectivePrice * (item.discountValue / 100);
                }
            }
            
            const finalPrice = Math.max(0, effectivePrice - manualDiscount);

            return { 
                ...item, 
                finalPrice, 
                manualDiscount,
                // These are not needed for personal cashier but let's keep the structure
                finalCommissionValue: 0,
                isDoseApplied: false
            } as ProcessedCartItem;
        });
        
        const subtotal = processed.reduce((sum, item) => sum + item.item.price, 0);
        const discount = processed.reduce((sum, item) => sum + item.manualDiscount, 0);
        
        return { 
            processedCart: processed, 
            totals: { 
                subtotal, 
                discount, 
                total: subtotal - discount, 
                tip: 0 
            } 
        };
    }, [cart]);

    const handleFinalizeSale = (paymentMethod: string, installments: number = 1) => {
        if (!selectedClient) {
            alert("Selecione um cliente.");
            return;
        }

        const newSale: SaleRecord = {
            id: `personal-sale-${Date.now()}`,
            date: new Date().toISOString(),
            clientIds: [selectedClient.id],
            clientNames: [selectedClient.name],
            items: processedCart,
            totals: totals,
            payment: { method: paymentMethod, installments: paymentMethod === 'Crédito' ? installments : undefined }
        };

        const newStock = [...data.stock];
        processedCart.forEach(cartItem => {
            if (cartItem.type === 'product') {
                const stockIndex = newStock.findIndex(si => si.id === cartItem.item.id);
                if (stockIndex > -1) {
                    newStock[stockIndex] = { ...newStock[stockIndex], quantity: newStock[stockIndex].quantity - 1 };
                }
            }
            if (cartItem.type === 'service' && cartItem.id.startsWith('a')) {
                 const finalPaymentStatus: Appointment['paymentStatus'] = cartItem.isPackage ? 'paid_with_package' : 'paid';
                updateAppointment(cartItem.id, { status: 'completed', paymentStatus: finalPaymentStatus });
            }
            if (cartItem.type === 'package') {
                const newClientPackage = buyPackage(selectedClient.id, cartItem.item.id);
                if (cartItem.triggeredByAppointmentId) {
                    updateAppointment(cartItem.triggeredByAppointmentId, {
                        status: 'completed',
                        paymentStatus: 'paid_with_package',
                        clientPackageId: newClientPackage.id,
                        pendingPackagePurchaseId: undefined,
                    });
                    useCredit(newClientPackage.id);
                }
            }
        });

        saveData({ sales: [...data.sales, newSale], stock: newStock });

        setCart([]);
        setSelectedClient(null);
        setShowPayment(false);
        alert(`Venda de R$ ${totals.total.toFixed(2).replace('.',',')} finalizada com ${paymentMethod}!`);
    };

    const handlePaymentMethodSelect = (paymentMethod: 'Dinheiro' | 'Crédito' | 'Débito' | 'Pix') => {
        if (paymentMethod === 'Crédito') setIsInstallmentsModalOpen(true);
        else if (paymentMethod === 'Dinheiro') setIsCashPaymentModalOpen(true);
        else handleFinalizeSale(paymentMethod);
    };

    const filteredClients = useMemo(() => clientSearch ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())) : [], [clientSearch, clients]);

    const handleAddItemToCart = useCallback((item: Service | StockItem | ServicePackageTemplate, type: 'service' | 'product' | 'package') => {
        let finalItemForCart: Service | SaleProduct | ServicePackageTemplate;
        if (type === 'product') {
            const stockItem = item as StockItem;
            if (stockItem.price === undefined) { alert("Este item de estoque não tem um preço de venda e não pode ser adicionado."); return; }
            finalItemForCart = { id: stockItem.id, name: stockItem.name, price: stockItem.price, stock: stockItem.quantity, commissionPercentage: 0 };
        } else {
            finalItemForCart = item as Service | ServicePackageTemplate;
        }
        const cartItem: CartItem = { id: `${type}-${item.id}-${Date.now()}`, type, item: finalItemForCart, professionalId: employeeId, commission: 0, discountValue: 0, discountType: 'FIXED', isRented: true };
        setCart(prev => [...prev, cartItem]);
    }, [employeeId]);
    
    const handleSelectScheduledClient = (appointment: Appointment) => {
        const client = clients.find(c => c.id === appointment.clientId);
        if (!client) return;
    
        if (selectedClient && selectedClient.id !== client.id) {
            if (cart.length > 0 && !window.confirm("Trocar de cliente irá limpar o carrinho atual. Deseja continuar?")) {
                return;
            }
            setCart([]);
        }
        setSelectedClient(client);
    
        // Check if item is already in cart to prevent duplicates
        if (cart.some(cartItem => cartItem.id === appointment.id || cartItem.triggeredByAppointmentId === appointment.id)) return;
    
        // If appointment is to buy a package
        if (appointment.paymentStatus === 'pending_package_purchase' && appointment.pendingPackagePurchaseId) {
            const packageTemplate = data.packages.find(t => t.id === appointment.pendingPackagePurchaseId);
            if (packageTemplate) {
                const cartItem: CartItem = {
                    id: `pkg-purchase-${appointment.id}`,
                    type: 'package',
                    item: packageTemplate,
                    professionalId: employeeId,
                    commission: 0,
                    discountValue: 0,
                    discountType: 'FIXED',
                    triggeredByAppointmentId: appointment.id,
                    isRented: true
                };
                setCart(prev => [...prev, cartItem]);
            } else {
                alert(`Erro: Pacote (ID: ${appointment.pendingPackagePurchaseId}) agendado para compra não foi encontrado.`);
            }
            return;
        }
    
        // If it's a regular service appointment (pending or paid with package)
        let discountValue = 0;
        if (appointment.paymentStatus === 'paid_with_package') {
            discountValue = appointment.service.price;
        }
    
        const newCartItem: CartItem = {
            id: appointment.id,
            type: 'service',
            item: appointment.service,
            professionalId: employeeId,
            commission: 0,
            discountValue: discountValue,
            discountType: 'FIXED',
            isRented: true,
            isPackage: appointment.paymentStatus === 'paid_with_package',
            clientPackageId: appointment.clientPackageId,
        };
        setCart(prev => [...prev, newCartItem]);
    };
    
    const renderPaymentStatusBadge = (status: Appointment['paymentStatus']) => {
        switch (status) {
            case 'paid':
                return <span className="ml-2 text-xs font-bold bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full">PAGO</span>;
            case 'paid_with_package':
                return <span className="ml-2 text-xs font-bold bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><GiftIcon className="w-3 h-3"/>PACOTE</span>;
            case 'pending_package_purchase':
                 return <span className="ml-2 text-xs font-bold bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">COMPRAR PACOTE</span>;
            case 'pending':
            case 'not_applicable':
            default:
                return <span className="ml-2 text-xs font-bold bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">PENDENTE</span>;
        }
    };

    if (!employee || employee.employmentType !== 'rented') {
        return (
            <div className="flex flex-col h-screen bg-black text-white p-4 items-center justify-center">
                <WarningIcon className="w-12 h-12 text-yellow-400 mb-4"/>
                <h1 className="text-xl font-bold mb-4">Acesso Negado</h1>
                <p className="text-gray-400 text-center mb-6">Este painel está disponível apenas para funcionários com contrato de Aluguel de Sala.</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-700 rounded-lg">Voltar</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                <div className="text-center mx-auto">
                    <h1 className="text-xl font-bold">Meu Caixa</h1>
                    <p className="text-sm text-gray-400">{employee.name}</p>
                </div>
                {data.cashier.isOpen && <button onClick={() => setModal('closing')} className="bg-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold">Fechar Caixa</button>}
                {!data.cashier.isOpen && <div className="w-20"></div>}
            </header>
            <main className="flex-grow overflow-y-auto p-6">
                {!data.cashier.isOpen ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">Caixa Fechado</h2>
                        <button onClick={() => setModal('opening')} className="bg-green-600 px-6 py-3 rounded-lg font-bold">Abrir Caixa</button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end gap-2 mb-4">
                            <button onClick={() => setModal('sangria')} className="flex items-center gap-1.5 text-sm bg-yellow-700 px-3 py-2 rounded-lg font-semibold"><BanknotesIcon className="w-5 h-5"/> Sangria</button>
                            <button onClick={() => setModal('devolucao')} className="flex items-center gap-1.5 text-sm bg-blue-700 px-3 py-2 rounded-lg font-semibold"><ArrowUturnLeftIcon className="w-5 h-5"/> Devolução</button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="bg-gray-800 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">1. Cliente</h3>
                                    {selectedClient ? (
                                        <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <img src={selectedClient.avatarUrl} alt={selectedClient.name} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-semibold">{selectedClient.name}</p>
                                                    <p className="text-xs text-gray-400">Cliente selecionado</p>
                                                </div>
                                            </div>
                                            <button onClick={handleChangeClient} className="text-sm text-blue-400 hover:text-blue-300 font-semibold">
                                                Trocar
                                            </button>
                                        </div>
                                    ) : (<>
                                        <div className="flex border-b border-gray-700 mb-3"><button onClick={() => setClientTab('scheduled')} className={`flex-1 py-2 text-sm ${clientTab === 'scheduled' ? 'text-white border-b-2' : 'text-gray-400'}`}>Agendados</button><button onClick={() => setClientTab('search')} className={`flex-1 py-2 text-sm ${clientTab === 'search' ? 'text-white border-b-2' : 'text-gray-400'}`}>Buscar</button></div>
                                        {clientTab === 'scheduled' && (<div className="max-h-48 overflow-y-auto space-y-2">{todayAppointmentsForEmployee.length > 0 ? todayAppointmentsForEmployee.map(app => { const client = clients.find(c => c.id === app.clientId); if (!client) return null; const isAdded = cart.some(c => c.id === app.id); return (<button key={app.id} onClick={() => handleSelectScheduledClient(app)} className="w-full text-left p-3 hover:bg-gray-700 bg-gray-700/50 rounded-md flex items-center gap-3 disabled:opacity-50" disabled={isAdded}><img src={client.avatarUrl} alt={client.name} className="w-10 h-10 rounded-full shrink-0" /><div className="flex-grow min-w-0"><p className="font-semibold truncate flex items-center">{client.name} {renderPaymentStatusBadge(app.paymentStatus)}</p><p className="text-gray-300 truncate text-sm">{app.service.name}</p></div>{isAdded && <div className="text-xs text-green-400 font-semibold shrink-0">Adicionado</div>}</button>);}) : <p className="text-center text-gray-500 text-sm py-4">Nenhum cliente agendado.</p>}</div>)}
                                        {clientTab === 'search' && (<div className="relative"><input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full bg-gray-700 p-2 rounded"/>{clientSearch && (<div className="absolute w-full bg-gray-600 rounded mt-1 z-10 max-h-48 overflow-y-auto">{filteredClients.length > 0 ? filteredClients.map(c => <div key={c.id} onClick={() => handleSelectClient(c)} className="p-2 hover:bg-gray-500 cursor-pointer">{c.name}</div>) : <div className="p-3 text-gray-400 text-sm"><p>Nenhum cliente encontrado.</p><button onClick={handleOpenAddClientModal} className="text-blue-400 font-semibold mt-2 text-left hover:text-blue-300">+ Adicionar novo cliente</button></div>}</div>)}</div>)}
                                    </>)}
                                </div>
                                <div className="bg-gray-800 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">2. Adicionar Itens</h3>
                                    <div className="flex border-b border-gray-700"><button onClick={() => setActiveItemTab('services')} className={`flex-1 py-2 text-sm ${activeItemTab === 'services' ? 'text-white border-b-2' : 'text-gray-400'}`}>Serviços</button><button onClick={() => setActiveItemTab('products')} className={`flex-1 py-2 text-sm ${activeItemTab === 'products' ? 'text-white border-b-2' : 'text-gray-400'}`}>Produtos</button><button onClick={() => setActiveItemTab('packages')} className={`flex-1 py-2 text-sm ${activeItemTab === 'packages' ? 'text-white border-b-2' : 'text-gray-400'}`}>Pacotes</button></div>
                                    <input type="text" value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-gray-700 p-2 rounded my-2"/>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {activeItemTab === 'services' && (personalServices || []).filter(s => s.name.toLowerCase().includes(itemSearch.toLowerCase())).map(s => (<div key={s.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded"><span>{s.name} (R$ {s.price.toFixed(2)})</span><button onClick={() => handleAddItemToCart(s, 'service')} className="p-1 bg-blue-600 rounded-full"><PlusIcon className="w-4 h-4"/></button></div>))}
                                        {activeItemTab === 'products' && (data.stock || []).filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (<div key={p.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded"><span>{p.name} (R$ {p.price?.toFixed(2)})</span><button onClick={() => handleAddItemToCart(p, 'product')} disabled={p.quantity <= 0} className="p-1 bg-blue-600 rounded-full disabled:bg-gray-500"><PlusIcon className="w-4 h-4"/></button></div>))}
                                        {activeItemTab === 'packages' && (data.packages || []).filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (<div key={p.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded"><span>{p.name} (R$ {p.price?.toFixed(2)})</span><button onClick={() => handleAddItemToCart(p, 'package')} className="p-1 bg-blue-600 rounded-full"><PlusIcon className="w-4 h-4"/></button></div>))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg flex flex-col">
                                <h3 className="font-semibold mb-2">3. Carrinho</h3>
                                <div className="flex-grow space-y-2 overflow-y-auto">
                                    {processedCart.map(cItem => (
                                        <div key={cItem.id} className="bg-gray-700 p-3 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold pr-2">{cItem.item.name}</p>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                    {(cItem.manualDiscount > 0) ? (
                                                        <>
                                                            <span className="line-through text-gray-400 text-sm">R$ {cItem.item.price.toFixed(2).replace('.', ',')}</span>
                                                            <span className="font-semibold">R$ {cItem.finalPrice.toFixed(2).replace('.', ',')}</span>
                                                        </>
                                                    ) : (
                                                        <span className="font-semibold">R$ {cItem.item.price.toFixed(2).replace('.', ',')}</span>
                                                    )}
                                                    <button onClick={() => handleRemoveFromCart(cItem.id)}><TrashIcon className="w-4 h-4 text-red-400"/></button>
                                                </div>
                                            </div>
                                            {cItem.manualDiscount > 0 && (
                                                <div className="mt-1 text-xs text-yellow-400 font-semibold flex justify-between">
                                                    <span>Desconto ({cItem.discountType === 'PERCENT' ? `${cItem.discountValue}%` : `R$ ${cItem.discountValue.toFixed(2).replace('.',',')}`})</span>
                                                    <span>- R$ {cItem.manualDiscount.toFixed(2).replace('.',',')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-end items-center mt-2 pt-2 border-t border-gray-600">
                                                <button onClick={() => { setItemForDiscount(cItem); setIsDiscountModalOpen(true); }} className="text-blue-400 font-semibold text-xs hover:text-blue-300">
                                                    {cItem.manualDiscount > 0 ? 'Editar Desconto' : 'Aplicar Desconto'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {cart.length === 0 && <p className="text-center text-gray-500 py-8">Carrinho vazio</p>}
                                </div>
                                <div className="border-t border-gray-700 mt-4 pt-4">
                                    <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>R$ {totals.subtotal.toFixed(2).replace('.', ',')}</span></div>
                                    {totals.discount > 0 && <div className="flex justify-between text-red-400"><span>Descontos</span><span>- R$ {totals.discount.toFixed(2).replace('.', ',')}</span></div>}
                                    <div className="flex justify-between font-bold text-2xl border-t border-gray-600 pt-2 mt-2"><span>Total</span><span>R$ {totals.total.toFixed(2).replace('.',',')}</span></div>
                                    {!showPayment ? (<button onClick={() => setShowPayment(true)} disabled={cart.length === 0 || !selectedClient} className="w-full bg-green-600 mt-4 py-3 rounded-lg font-bold disabled:bg-gray-600">Ir para Pagamento</button>) : (<div className="mt-4"><p className="text-center font-semibold mb-2">Selecione o método:</p><div className="grid grid-cols-2 gap-2"><button onClick={() => handlePaymentMethodSelect('Dinheiro')} className="bg-green-700 p-3 rounded">Dinheiro</button><button onClick={() => handlePaymentMethodSelect('Crédito')} className="bg-blue-700 p-3 rounded">Crédito</button><button onClick={() => handlePaymentMethodSelect('Débito')} className="bg-sky-700 p-3 rounded">Débito</button><button onClick={() => handlePaymentMethodSelect('Pix')} className="bg-purple-700 p-3 rounded">Pix</button></div><button onClick={() => setShowPayment(false)} className="w-full text-center text-gray-400 mt-3 text-sm">Voltar</button></div>)}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
            {modal === 'opening' && <OpeningCashierModal onClose={() => setModal(null)} onConfirm={handleOpenCashier} />}
            {modal === 'closing' && <CloseCashierModal onClose={() => setModal(null)} onConfirm={handleConfirmClose} summary={{ initialCash: data.cashier.initialCash, sales: salesInSession, transactions: transactionsInSession }} />}
            { (modal === 'sangria' || modal === 'devolucao') && <TransactionModal type={modal} onClose={() => setModal(null)} onConfirm={handleAddTransaction} />}
            <PersonalInstallmentsModal isOpen={isInstallmentsModalOpen} onClose={() => setIsInstallmentsModalOpen(false)} onConfirm={(i) => { handleFinalizeSale('Crédito', i); setIsInstallmentsModalOpen(false); }} maxInstallments={financialSettings.maxInstallments} totalAmount={totals.total} minInstallmentValue={financialSettings.minInstallmentValue}/>
            <PersonalCashPaymentModal isOpen={isCashPaymentModalOpen} onClose={() => setIsCashPaymentModalOpen(false)} totalAmount={totals.total} onConfirm={() => { handleFinalizeSale('Dinheiro'); setIsCashPaymentModalOpen(false); }}/>
            {isDiscountModalOpen && itemForDiscount && <DiscountModal item={itemForDiscount} onClose={() => setIsDiscountModalOpen(false)} onApply={applyDiscount} onRemove={removeDiscount} />}
            {isAddClientModalOpen && (
                <AdminAddClientModal
                    onClose={() => setIsAddClientModalOpen(false)}
                    onSave={handleSaveNewClient}
                    initialName={clientSearchForModal}
                />
            )}
        </div>
    );
};

export default AdminEmployeePersonalCashierScreen;