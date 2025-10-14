import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, Service, Professional, SaleProduct, Appointment, StockItem, CartItem, ProcessedCartItem, SaleRecord, ServicePackageTemplate, ClientPackage, WeeklyDiscount } from '../types';
import { useClients } from '../contexts/ClientsContext';
import { useServices } from '../contexts/ServicesContext';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import { useStock } from '../contexts/StockContext';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useSalonSettings } from '../salonSettings';
import { useAuth } from '../contexts/AuthContext';
import { useVales } from '../contexts/ValesContext';
import { useCashier, ClosedCashierSummary } from '../contexts/CashierContext';
import { useFinancials } from '../contexts/FinancialsContext';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { usePackages } from '../contexts/PackagesContext';
import { useDiscounts } from '../contexts/DiscountsContext';

// Icons
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import XIcon from '../components/icons/XIcon';
import UsersIcon from '../components/icons/UsersIcon';
import ScissorsIcon from '../components/icons/ScissorsIcon';
import CubeIcon from '../components/icons/CubeIcon';
import TagIcon from '../components/icons/TagIcon';
import ArrowUturnLeftIcon from '../components/icons/ArrowUturnLeftIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import PasswordRevealModal from '../components/PasswordRevealModal';
import ReturnModal from '../components/ReturnModal';
import AdminAddClientModal from '../components/AdminAddClientModal';
import ChartIcon from '../components/icons/ChartIcon';
import FloatingCalculator from '../components/FloatingCalculator';
import SparklesIcon from '../components/icons/SparklesIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import PencilIcon from '../components/icons/PencilIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import AdminAddServiceModal from '../components/AdminAddServiceModal';
import GiftIcon from '../components/icons/GiftIcon';
import CalculatorIcon from '../components/icons/CalculatorIcon';

// --- OpeningCashierModal Component ---
const OpeningCashierModal: React.FC<{
    isOpen: boolean;
    onConfirm: (amount: number) => void;
    onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
    const [amount, setAmount] = useState('');

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
        onConfirm(numericAmount);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg relative">
                 <button 
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                    aria-label="Fechar"
                >
                    <XIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-2">Abrir Caixa</h2>
                <p className="text-gray-400 mb-6">Informe o valor em dinheiro que está entrando no caixa para servir de troco durante o dia.</p>
                <div>
                    <label htmlFor="initial-cash" className="block text-sm font-medium text-gray-300 mb-2">Troco Inicial (R$)</label>
                    <input
                        type="text"
                        id="initial-cash"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-right font-bold text-xl focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="0,00"
                        autoFocus
                    />
                </div>
                <div className="mt-6">
                    <button
                        onClick={handleConfirm}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-500 transition-colors"
                    >
                        Confirmar e Abrir Caixa
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Modals for CloseCashierModal ---
const CancelSaleConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    sale: SaleRecord | null;
}> = ({ isOpen, onClose, onConfirm, sale }) => {
    if (!isOpen || !sale) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Confirmar Cancelamento</h2>
                <p className="text-gray-300 mb-6">
                    Tem certeza que deseja cancelar a venda de <span className="font-bold">R$ {sale.totals.total.toFixed(2).replace('.', ',')}</span> para <span className="font-bold">{sale.clientNames.join(', ')}</span>?
                    <br/><br/>
                    <span className="text-red-400">Esta ação irá estornar os produtos ao estoque e reverter as comissões.</span>
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                        Voltar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500">
                        Confirmar Cancelamento
                    </button>
                </div>
            </div>
        </div>
    );
};

const ChangeProfessionalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newProfessionalId: string) => void;
    item: ProcessedCartItem | null;
    professionals: Professional[];
}> = ({ isOpen, onClose, onConfirm, item, professionals }) => {
    if (!isOpen || !item) return null;
    
    const [selectedProfId, setSelectedProfId] = useState(item.professionalId);

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Trocar Funcionário</h2>
                <p className="text-gray-400 mb-1">Serviço/Produto:</p>
                <p className="font-semibold mb-4">{item.item.name}</p>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {professionals.map(prof => (
                        <button
                            key={prof.id}
                            onClick={() => setSelectedProfId(prof.id)}
                            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedProfId === prof.id ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                        >
                            <img src={prof.avatarUrl} alt={prof.name} className="w-8 h-8 rounded-full" />
                            <span>{prof.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                        Cancelar
                    </button>
                    <button 
                        onClick={() => onConfirm(selectedProfId!)}
                        disabled={selectedProfId === item.professionalId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- CloseCashierModal Component ---
interface CloseCashierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (countedCash: number, difference: number) => void;
    sessionSummary: {
        date: Date;
        totalSales: number;
        payments: { cash: number; card: number; pix: number; };
        totalVales: number;
        totalSangrias: number;
    };
    initialCash: number;
    salesInSession: SaleRecord[];
}

const SummaryRow: React.FC<{ label: string; value: number; color?: string; isNegative?: boolean }> = ({ label, value, color = 'text-gray-100', isNegative = false }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-800">
        <span className="text-gray-400">{label}</span>
        <span className={`font-semibold ${color}`}>{isNegative ? '- ' : ''}R$ {value.toFixed(2).replace('.', ',')}</span>
    </div>
);

const CloseCashierModal: React.FC<CloseCashierModalProps> = ({ isOpen, onClose, onConfirm, sessionSummary, initialCash, salesInSession }) => {
    const [countedCash, setCountedCash] = useState('');
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [saleToCancel, setSaleToCancel] = useState<SaleRecord | null>(null);
    const [editingSaleItem, setEditingSaleItem] = useState<{ sale: SaleRecord; item: ProcessedCartItem } | null>(null);

    const { professionals } = useProfessionals();
    const { stockItems, updateStockQuantity } = useStock();
    const { addVale } = useVales();
    const { updateSale, deleteSale } = useSalesHistory();
    

    const handleConfirmCancelSale = () => {
        if (!saleToCancel) return;
        // 1. Revert commissions by creating "debit" Vales
        saleToCancel.items.forEach(item => {
            if (item.finalCommissionValue > 0 && item.professionalId) {
                const professional = professionals.find(p => p.id === item.professionalId);
                if (professional) {
                    addVale({
                        employeeId: professional.id,
                        employeeName: professional.name,
                        date: new Date().toISOString(),
                        items: [{ name: `Estorno comissão (Venda #${saleToCancel.id.slice(-5)})`, quantity: 1, price: item.finalCommissionValue }],
                        totalAmount: item.finalCommissionValue,
                    });
                }
            }
        });

        // 2. Return products to stock
        saleToCancel.items.forEach(item => {
            if (item.type === 'product') {
                const stockItem = stockItems.find(si => si.id === item.item.id);
                if (stockItem) {
                    updateStockQuantity(stockItem.id, stockItem.quantity + 1);
                }
            }
        });

        // 3. Delete the sale record
        deleteSale(saleToCancel.id);
        setSaleToCancel(null);
        alert('Venda cancelada com sucesso!');
    };

    const handleConfirmChangeProfessional = (newProfessionalId: string) => {
        if (!editingSaleItem) return;
        const { sale, item } = editingSaleItem;
        
        const updatedItem: ProcessedCartItem = {
            ...item,
            professionalId: newProfessionalId,
            finalCommissionValue: item.finalPrice * (item.commission / 100),
        };

        const updatedSale: SaleRecord = {
            ...sale,
            items: sale.items.map(i => i.id === item.id ? updatedItem : i),
        };

        updateSale(updatedSale);
        setEditingSaleItem(null);
    };

    const expectedCash = useMemo(() => {
        return initialCash + sessionSummary.payments.cash - sessionSummary.totalSangrias;
    }, [initialCash, sessionSummary]);

    const difference = useMemo(() => {
        const counted = parseFloat(countedCash.replace(',', '.')) || 0;
        return counted - expectedCash;
    }, [countedCash, expectedCash]);

    const handleConfirmClick = () => {
        const counted = parseFloat(countedCash.replace(',', '.')) || 0;
        onConfirm(counted, difference);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
                <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-lg flex flex-col h-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <header className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold">Fechamento de Caixa</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                    </header>

                    <main className="flex-grow overflow-y-auto pr-2 space-y-6">
                        <div className="text-center">
                            <p className="text-gray-400">Data do Fechamento</p>
                            <p className="font-semibold text-lg">{sessionSummary.date.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Resumo da Sessão</h3>
                            <SummaryRow label="Rendimento Total (Bruto)" value={sessionSummary.totalSales} color="text-green-400" />
                            <SummaryRow label="Troco Inicial" value={initialCash} />
                            <SummaryRow label="Recebido em Dinheiro" value={sessionSummary.payments.cash} />
                            <SummaryRow label="Recebido em Cartão" value={sessionSummary.payments.card} />
                            <SummaryRow label="Recebido em Pix" value={sessionSummary.payments.pix} />
                            <SummaryRow label="Vales Lançados" value={sessionSummary.totalVales} />
                            <SummaryRow label="Retiradas (Sangrias)" value={sessionSummary.totalSangrias} color="text-red-400" isNegative={true} />
                        </div>

                        <div className="border-t border-gray-800 pt-4">
                            <button
                                onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                                className="w-full flex justify-between items-center text-left text-gray-300 hover:text-white transition-colors"
                            >
                                <span className="font-semibold text-lg flex items-center gap-2">
                                    <ClipboardDocumentListIcon className="w-5 h-5" />
                                    Extrato Detalhado da Sessão
                                </span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isDetailsVisible ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isDetailsVisible ? 'max-h-[300px] mt-4' : 'max-h-0'}`}>
                                <div className="space-y-3 bg-gray-800/50 p-3 rounded-lg max-h-[280px] overflow-y-auto">
                                    {salesInSession.length > 0 ? salesInSession.map(sale => (
                                        <div key={sale.id} className="bg-gray-900/70 p-3 rounded-md text-sm">
                                            <div className="flex justify-between items-start border-b border-gray-700 pb-2 mb-2">
                                                <div>
                                                    <p className="font-bold">{sale.clientNames.join(', ')}</p>
                                                    <p className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right flex-shrink-0 ml-2">
                                                        <p className="font-bold text-lg">R$ {sale.totals.total.toFixed(2).replace('.', ',')}</p>
                                                        <p className="text-xs text-gray-400">{sale.payment.method}{sale.payment.installments && sale.payment.installments > 1 ? ` (${sale.payment.installments}x)` : ''}</p>
                                                    </div>
                                                    <button onClick={() => setSaleToCancel(sale)} className="p-2 text-red-400 hover:text-red-300 transition-colors" aria-label="Cancelar venda">
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {sale.items.map(item => {
                                                    const prof = professionals.find(p => p.id === item.professionalId);
                                                    return (
                                                        <div key={item.id} className="flex justify-between items-center text-xs">
                                                            <span className="truncate pr-2 flex items-center gap-1">
                                                                {item.item.name} 
                                                                <span className="text-gray-500">({prof?.name.split(' ')[0]})</span>
                                                                <button onClick={() => setEditingSaleItem({ sale, item })} className="text-gray-400 hover:text-white">
                                                                    <PencilIcon className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                            <span className="flex-shrink-0">R$ {item.finalPrice.toFixed(2).replace('.', ',')}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )) : <p className="text-gray-500 text-center py-4">Nenhuma venda registrada nesta sessão.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Conferência de Caixa</h3>
                            <SummaryRow label="Valor Esperado em Dinheiro" value={expectedCash} />
                            <div>
                                <label htmlFor="counted-cash" className="block text-sm font-medium text-gray-300 mb-2">Valor Contado em Caixa (R$)</label>
                                <input
                                    type="text"
                                    id="counted-cash"
                                    value={countedCash}
                                    onChange={(e) => setCountedCash(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-right font-bold text-xl focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    placeholder="0,00"
                                    autoFocus
                                />
                            </div>
                            <div className={`flex justify-between items-center py-2 font-bold text-lg rounded-lg px-3 mt-2 ${difference === 0 ? 'bg-gray-800' : difference > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                <span>{difference >= 0 ? 'Sobra' : 'Falta'}</span>
                                <span>R$ {Math.abs(difference).toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </main>
                    
                    <footer className="mt-6 flex-shrink-0">
                        <button
                            onClick={handleConfirmClick}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-500 transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            Confirmar e Fechar Caixa
                        </button>
                    </footer>
                </div>
            </div>
            <CancelSaleConfirmationModal isOpen={!!saleToCancel} onClose={() => setSaleToCancel(null)} onConfirm={handleConfirmCancelSale} sale={saleToCancel} />
            <ChangeProfessionalModal isOpen={!!editingSaleItem} onClose={() => setEditingSaleItem(null)} onConfirm={handleConfirmChangeProfessional} item={editingSaleItem?.item ?? null} professionals={professionals} />
        </>
    );
};

// --- InstallmentsModal Component ---
interface InstallmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (installments: number) => void;
    maxInstallments: number;
    totalAmount: number;
    minInstallmentValue: number;
}

const InstallmentsModal: React.FC<InstallmentsModalProps> = ({ isOpen, onClose, onConfirm, maxInstallments, totalAmount, minInstallmentValue }) => {
    
    const installmentOptions = useMemo(() => {
        return Array.from({ length: maxInstallments }, (_, i) => i + 1)
            .filter(i => (totalAmount / i) >= minInstallmentValue);
    }, [totalAmount, maxInstallments, minInstallmentValue]);
    
    const [installments, setInstallments] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setInstallments(installmentOptions.length > 0 ? installmentOptions[0] : 1);
        }
    }, [isOpen, installmentOptions]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Pagamento com Crédito</h2>
                <div className="mb-4">
                    <label htmlFor="installments-select" className="block text-sm font-medium text-gray-300 mb-2">Número de Parcelas</label>
                    {installmentOptions.length > 0 ? (
                        <select
                            id="installments-select"
                            value={installments}
                            onChange={e => setInstallments(Number(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                        >
                            {installmentOptions.map(i => (
                                <option key={i} value={i}>
                                    {i}x de R$ {(totalAmount / i).toFixed(2).replace('.', ',')}
                                </option>
                            ))}
                        </select>
                    ) : (
                         <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500">
                            Valor baixo demais para parcelar.
                        </div>
                    )}
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400">Total da Compra</p>
                    <p className="text-3xl font-bold">R$ {totalAmount.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                    <button onClick={() => onConfirm(installments)} disabled={installmentOptions.length === 0} className="px-4 py-2 bg-green-600 font-semibold rounded-lg hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed">Confirmar Pagamento</button>
                </div>
            </div>
        </div>
    );
};

// --- CashPaymentModal Component ---
const CashPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    onConfirm: () => void;
}> = ({ isOpen, onClose, totalAmount, onConfirm }) => {
    const [amountPaid, setAmountPaid] = useState('');

    const amountPaidValue = parseFloat(amountPaid.replace(',', '.')) || 0;
    const change = amountPaidValue > 0 ? amountPaidValue - totalAmount : 0;

    useEffect(() => {
        if (isOpen) {
            setAmountPaid('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Pagamento em Dinheiro</h2>

                <div className="bg-gray-800 p-4 rounded-lg text-center mb-4">
                    <p className="text-gray-400">Total da Compra</p>
                    <p className="text-3xl font-bold">R$ {totalAmount.toFixed(2).replace('.', ',')}</p>
                </div>

                <div>
                    <label htmlFor="amount-paid" className="block text-sm font-medium text-gray-300 mb-2">Valor Recebido (R$)</label>
                    <input
                        type="text"
                        id="amount-paid"
                        value={amountPaid}
                        onChange={e => setAmountPaid(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0,00"
                        autoFocus
                    />
                </div>
                
                {amountPaidValue >= totalAmount && (
                     <div className="mt-4 bg-blue-900/50 p-4 rounded-lg text-center">
                        <p className="text-blue-300">Troco a ser devolvido</p>
                        <p className="text-3xl font-bold text-blue-200">R$ {change.toFixed(2).replace('.', ',')}</p>
                    </div>
                )}
               
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={amountPaidValue < totalAmount}
                        className="w-full bg-green-600 font-semibold rounded-lg py-3 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Confirmar Pagamento
                    </button>
                    <button onClick={onClose} className="w-full bg-gray-700 font-semibold rounded-lg py-3 hover:bg-gray-600">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- TipModal Component ---
const TipModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tipAmount: number) => void;
    currentTip: number;
    subtotal: number;
}> = ({ isOpen, onClose, onConfirm, currentTip, subtotal }) => {
    const [amount, setAmount] = useState(String(currentTip > 0 ? currentTip.toFixed(2).replace('.', ',') : ''));

    if (!isOpen) return null;

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
        onConfirm(numericAmount);
        onClose();
    };
    
    const quickAdd = (value: number, isPercent: boolean = false) => {
        const newAmount = isPercent ? (subtotal * value) / 100 : value;
        setAmount(newAmount.toFixed(2).replace('.', ','));
    };
    
    const quickOptions = [
        { label: '10%', value: 10, isPercent: true },
        { label: '15%', value: 15, isPercent: true },
        { label: 'R$ 5', value: 5, isPercent: false },
        { label: 'R$ 10', value: 10, isPercent: false },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Adicionar Gorjeta</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>

                <main className="space-y-4">
                    <div>
                        <label htmlFor="tip-amount" className="block text-sm font-medium text-gray-300 mb-2">Valor da Gorjeta (R$)</label>
                        <input
                            type="text"
                            id="tip-amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0,00"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {quickOptions.map(opt => (
                            <button key={opt.label} onClick={() => quickAdd(opt.value, opt.isPercent)} className="bg-gray-700 rounded-lg py-3 text-sm font-semibold hover:bg-gray-600">
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </main>

                <footer className="mt-8">
                    <button onClick={handleConfirm} className="w-full bg-green-600 font-bold py-3 rounded-lg text-lg hover:bg-green-500">
                        Confirmar
                    </button>
                </footer>
            </div>
        </div>
    );
};


// Internal Modals for this screen
const DoseModal: React.FC<{
    item: CartItem;
    onClose: () => void;
    onApply: (itemId: string, price: number | null) => void;
}> = ({ item, onClose, onApply }) => {
    const initialPrice = item.overridePrice ?? (item.item as Service).dosePrice ?? '';
    const [price, setPrice] = useState(String(initialPrice));

    const handleApply = () => {
        const numericPrice = parseFloat(String(price));
        if (!isNaN(numericPrice) && numericPrice >= 0) {
            onApply(item.id, numericPrice);
        } else {
             onApply(item.id, null); // Remove dose if input is invalid
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Valor da Dose</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <p className="text-gray-300 mb-4">Serviço: <span className="font-semibold">{item.item.name}</span></p>
                <div>
                     <label htmlFor="dose-price-input" className="block text-sm font-medium text-gray-300 mb-2">Preço da Dose (R$)</label>
                    <input
                        type="number"
                        id="dose-price-input"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                        placeholder="Valor do produto"
                    />
                     <p className="text-xs text-gray-500 mt-1">Deixe em branco ou 0 para remover a cobrança de dose.</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 mt-2">
                     <button onClick={() => onApply(item.id, null)} className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Remover Dose
                    </button>
                    <button onClick={handleApply} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                        Aplicar
                    </button>
                </div>
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

interface ProfessionalCommissionData {
    prof: Professional;
    commissionValue: number;
    totalSaleValue: number;
    avgCommission: number;
}
const CommissionModal: React.FC<{
    onClose: () => void;
    onConfirm: (newPercentages: Record<string, number>) => void;
    professionalsData: ProfessionalCommissionData[];
}> = ({ onClose, onConfirm, professionalsData }) => {
    const [percentages, setPercentages] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialPercentages = professionalsData.reduce((acc, { prof, avgCommission }) => {
            acc[prof.id] = avgCommission.toFixed(2).replace('.', ',');
            return acc;
        }, {} as Record<string, string>);
        setPercentages(initialPercentages);
    }, [professionalsData]);


    const handleSave = () => {
        const newPercentages = Object.entries(percentages).reduce((acc, [id, value]) => {
            const numericValue = parseFloat(String(value).replace(',', '.'));
            if (!isNaN(numericValue)) {
                acc[id] = numericValue;
            }
            return acc;
        }, {} as Record<string, number>);
        onConfirm(newPercentages);
    };

    const handlePercentageChange = (profId: string, value: string) => {
        const sanitizedValue = value.replace('.', ',');
        setPercentages(prev => ({ ...prev, [profId]: sanitizedValue }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Editar Porcentagem</h2>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                    {professionalsData.map(({ prof, commissionValue, totalSaleValue }) => {
                        const currentPercentageStr = percentages[prof.id] || '0';
                        const currentPercentageNum = parseFloat(currentPercentageStr.replace(',', '.')) || 0;
                        const newCommissionValue = totalSaleValue * (currentPercentageNum / 100);
                        const difference = newCommissionValue - commissionValue;

                        return (
                            <div key={prof.id}>
                                <label className="text-sm text-gray-400 flex justify-between items-baseline mb-1">
                                    <span>{prof.name}</span>
                                    <span className="text-xs">Original: R$ {commissionValue.toFixed(2).replace('.', ',')}</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={percentages[prof.id]}
                                        onChange={(e) => handlePercentageChange(prof.id, e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pr-9 pl-4 py-2 text-right"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                </div>
                                <p className={`text-sm text-right mt-1 font-semibold`}>
                                    Novo valor: R$ {newCommissionValue.toFixed(2).replace('.', ',')}
                                </p>
                                {Math.abs(difference) > 0.001 && (
                                    <p className={`text-xs text-right mt-1 font-semibold ${difference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        Diferença: {difference > 0 ? '+' : ''}R$ {difference.toFixed(2).replace('.', ',')}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
                 <div className="flex justify-end gap-3 pt-4 mt-4">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

const SangriaModal: React.FC<{
    onClose: () => void;
    onConfirm: (amount: number, reason: string) => void;
}> = ({ onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount);
        if (!isNaN(numericAmount) && numericAmount > 0) {
            onConfirm(numericAmount, reason);
        } else {
            alert('Por favor, insira um valor válido.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Retirada de Caixa (Sangria)</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="sangria-amount" className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
                        <input
                            type="number"
                            id="sangria-amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            placeholder="0,00"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="sangria-reason" className="block text-sm font-medium text-gray-300 mb-2">Motivo (Opcional)</label>
                        <input
                            type="text"
                            id="sangria-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            placeholder="Ex: Pagamento de fornecedor"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 mt-4">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50" disabled={!amount}>
                        Confirmar Retirada
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ReturnItem {
    product: SaleProduct;
    quantity: number;
}

const AdminCashierScreen: React.FC = () => {
    const navigate = useNavigate();
    const { clients, addClient } = useClients();
    const { services, getServiceCategories } = useServices();
    const { professionals } = useProfessionals();
    const { stockItems, updateStockQuantity } = useStock();
    const { appointments, updateAppointment } = useAppointments();
    const { settings: salonSettings } = useSalonSettings();
    const { loggedInProfessional } = useAuth();
    const { addVale } = useVales();
    const { cashierState, openCashier, closeCashier, addTransaction, addSessionToHistory } = useCashier();
    const { settings: financialSettings } = useFinancials();
    const { sales, addSale } = useSalesHistory();
    const { vales } = useVales();
    const { packageTemplates, clientPackages, buyPackage, getPackagesForClient, useCredit } = usePackages();
    const { discounts } = useDiscounts();

    const salonServices = useMemo(() => services.filter(s => !s.ownerId), [services]);
    const salonPackageTemplates = useMemo(() => packageTemplates.filter(p => !p.ownerId), [packageTemplates]);

    const [selectedClients, setSelectedClients] = useState<Client[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [itemSearch, setItemSearch] = useState('');
    const [activeItemTab, setActiveItemTab] = useState<'services' | 'products' | 'packages'>('services');
    const [clientTab, setClientTab] = useState<'scheduled' | 'search' | 'employees'>('scheduled');

    const [modal, setModal] = useState<'discount' | 'commission' | 'password' | 'return' | 'sangria' | 'dose' | null>(null);
    const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
    const [selectedItemForDose, setSelectedItemForDose] = useState<CartItem | null>(null);
    const [passwordAction, setPasswordAction] = useState<(() => void) | null>(null);

    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [clientSearchForModal, setClientSearchForModal] = useState('');
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [showPaymentMethods, setShowPaymentMethods] = useState(false);
    const [loanAmount, setLoanAmount] = useState('');
    const [isCloseCashierModalOpen, setIsCloseCashierModalOpen] = useState(false);
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
    const [isCashPaymentModalOpen, setIsCashPaymentModalOpen] = useState(false);
    const [tip, setTip] = useState(0);
    const [isTipModalOpen, setIsTipModalOpen] = useState(false);

    const salesInSession = useMemo(() => {
        if (!cashierState.isOpen || !cashierState.openTimestamp) {
            return [];
        }
        const openTime = new Date(cashierState.openTimestamp);
        return sales
            .filter(s => new Date(s.date) >= openTime)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [sales, cashierState.isOpen, cashierState.openTimestamp]);

    const getWeeklyDiscount = (item: Service | ServicePackageTemplate, itemType: 'service' | 'package'): WeeklyDiscount | undefined => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const activeDiscount = discounts.find(d => 
            d.itemId === item.id && 
            d.itemType === itemType && 
            d.days.includes(dayOfWeek)
        );
        return activeDiscount;
    };

    const sessionSummary = useMemo(() => {
        if (!cashierState.isOpen || !cashierState.openTimestamp) {
            return {
                date: new Date(),
                totalSales: 0,
                payments: { cash: 0, card: 0, pix: 0 },
                totalVales: 0,
                totalSangrias: 0,
            };
        }
    
        const openTime = new Date(cashierState.openTimestamp);
    
        const payments = { cash: 0, card: 0, pix: 0 };
        salesInSession.forEach(sale => {
            switch (sale.payment.method) {
                case 'Dinheiro': payments.cash += sale.totals.total; break;
                case 'Débito':
                case 'Crédito': payments.card += sale.totals.total; break;
                case 'Pix': payments.pix += sale.totals.total; break;
            }
        });
    
        const valesInSession = vales.filter(v => new Date(v.date) >= openTime);
        const totalVales = valesInSession.reduce((sum, v) => sum + v.totalAmount, 0);
    
        const sangriasInSession = (cashierState.transactions || [])
            .filter(t => t.type === 'sangria' && new Date(t.timestamp) >= openTime);
        const totalSangrias = sangriasInSession.reduce((sum, t) => sum + t.amount, 0);
    
        return {
            date: new Date(),
            totalSales: salesInSession.reduce((sum, s) => sum + s.totals.total, 0),
            payments,
            totalVales,
            totalSangrias,
        };
    }, [cashierState.isOpen, cashierState.openTimestamp, cashierState.transactions, salesInSession, vales]);

    const handleOpenCashier = (amount: number) => {
        openCashier(amount);
        setIsOpeningModalOpen(false);
    };

    const canCloseCashier = loggedInProfessional?.permissions?.includes('Caixa');

    const handleConfirmClose = (countedCashValue: number, differenceValue: number) => {
        if (!loggedInProfessional || !cashierState.date) return;
        
        const summary: Omit<ClosedCashierSummary, 'id'> = {
            date: cashierState.date,
            closeTime: new Date().toISOString(),
            initialCash: cashierState.initialCash,
            finalCash: countedCashValue,
            difference: differenceValue,
            totalSales: sessionSummary.totalSales,
            payments: sessionSummary.payments,
            totalVales: sessionSummary.totalVales,
            totalSangrias: sessionSummary.totalSangrias,
            closedBy: loggedInProfessional.name,
        };

        addSessionToHistory(summary);
        closeCashier();
        
        setIsCloseCashierModalOpen(false);
        alert('Caixa fechado com sucesso!');
        setCart([]);
        setSelectedClients([]);
        setShowPaymentMethods(false);
    };

    const {
        processedCart,
        totals,
        rentedTotals,
        professionalsDataForCommissionModal,
    } = useMemo(() => {
        let salonSubtotal = 0;
        let salonManualDiscountTotal = 0;
        let salonPackageDiscountTotal = 0;

        let rentedSubtotal = 0;
        let rentedManualDiscountTotal = 0;
    
        const processedCartItems: ProcessedCartItem[] = cart.map(item => {
            let finalPrice: number;
            let finalCommissionValue: number;
            let manualDiscount = 0;
            const isDoseApplied = !!item.isDose;
            
            // Commission for rented professionals is handled in their own system, not here.
            const commissionPercentage = item.isRented ? 0 : item.commission;
    
            if (item.isPackage && item.clientPackageId) {
                const clientPackage = clientPackages.find(p => p.id === item.clientPackageId);
                const template = packageTemplates.find(t => t.id === clientPackage?.packageTemplateId);
    
                if (template && template.sessionCount > 0) {
                    const pricePerSession = template.price / template.sessionCount;
                    finalCommissionValue = pricePerSession * (commissionPercentage / 100);
                } else {
                    finalCommissionValue = 0;
                }
                
                finalPrice = 0;
                if (!item.isRented) {
                    salonPackageDiscountTotal += item.item.price;
                }
                manualDiscount = item.item.price;
            } else {
                const effectivePrice = item.overridePrice ?? item.item.price;
                
                if (item.discountValue > 0) {
                    if (item.discountType === 'FIXED') {
                        manualDiscount = Math.min(effectivePrice, item.discountValue);
                    } else { // PERCENT
                        manualDiscount = effectivePrice * (item.discountValue / 100);
                    }
                }
    
                finalPrice = Math.max(0, effectivePrice - manualDiscount);
                const finalCommissionPercentage = isDoseApplied ? 0 : commissionPercentage;
                finalCommissionValue = finalPrice * (finalCommissionPercentage / 100);
            }

            if (item.isRented) {
                rentedSubtotal += item.item.price;
                rentedManualDiscountTotal += manualDiscount;
            } else {
                salonSubtotal += item.item.price;
                if (!item.isPackage) {
                     salonManualDiscountTotal += manualDiscount;
                }
            }
    
            return {
                ...item,
                finalPrice,
                finalCommissionValue,
                isDoseApplied,
                manualDiscount,
            };
        });
        
        const salonTotal = salonSubtotal - salonPackageDiscountTotal - salonManualDiscountTotal + tip;
        const rentedTotal = rentedSubtotal - rentedManualDiscountTotal;
        
        const profsData: Record<string, {
            prof: Professional;
            commissionValue: number;
            totalSaleValue: number;
        }> = {};
    
        processedCartItems.forEach(item => {
            if (item.professionalId && !item.isRented) {
                const prof = professionals.find(p => p.id === item.professionalId);
                if (prof) {
                    if (!profsData[item.professionalId]) {
                        profsData[item.professionalId] = { prof, commissionValue: 0, totalSaleValue: 0 };
                    }
                    profsData[item.professionalId].commissionValue += item.finalCommissionValue;
                    
                    if (item.isPackage && item.clientPackageId) {
                        const clientPackage = clientPackages.find(p => p.id === item.clientPackageId);
                        const template = packageTemplates.find(t => t.id === clientPackage?.packageTemplateId);
                        if (template && template.sessionCount > 0) {
                            const pricePerSession = template.price / template.sessionCount;
                            profsData[item.professionalId].totalSaleValue += pricePerSession;
                        }
                    } else {
                        profsData[item.professionalId].totalSaleValue += item.finalPrice;
                    }
                }
            }
        });
    
        const professionalsDataForCommissionModal = Object.values(profsData).map(data => {
            const avgCommission = data.totalSaleValue > 0 ? (data.commissionValue / data.totalSaleValue) * 100 : 0;
            return {
                ...data,
                avgCommission: isNaN(avgCommission) ? 0 : avgCommission,
            };
        });
        
        return {
            processedCart: processedCartItems,
            totals: {
                subtotal: salonSubtotal,
                total: salonTotal,
                discount: salonManualDiscountTotal + salonPackageDiscountTotal,
                tip,
            },
            rentedTotals: {
                total: rentedTotal,
            },
            professionalsDataForCommissionModal,
        };
    
    }, [cart, professionals, tip, clientPackages, packageTemplates]);


    const productsForSale: SaleProduct[] = useMemo(() => stockItems
        .filter(item => item.category.toLowerCase() === 'revenda' && item.price !== undefined)
        .map(item => ({ id: item.id, name: item.name, price: item.price!, stock: item.quantity, commissionPercentage: item.commissionPercentage })), [stockItems]);
    
    const stockCategories = useMemo(() => [...new Set(stockItems.map(item => item.category))].sort(), [stockItems]);
    
    const todayAppointments = useMemo(() => {
        const todayString = new Date().toDateString();
        return appointments.filter(app => 
            new Date(app.date).toDateString() === todayString &&
            app.status === 'scheduled' &&
            !app.service.ownerId
        )
               .sort((a,b) => a.time.localeCompare(b.time));
    }, [appointments]);
    
    const searchResults = useMemo(() => {
        if (!clientSearch.trim()) return [];

        const matchingClients = clients.filter(c => 
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) &&
            !selectedClients.some(sc => sc.id === c.id)
        );

        const results: (Client | Appointment)[] = [];
        const clientIdsWithAppointments = new Set<string>();

        // First, add appointments for matching clients
        matchingClients.forEach(client => {
            const appointmentsForClient = todayAppointments.filter(app => app.clientId === client.id);
            if (appointmentsForClient.length > 0) {
                results.push(...appointmentsForClient);
                clientIdsWithAppointments.add(client.id);
            }
        });

        // Then, add clients who matched but had no appointments today
        matchingClients.forEach(client => {
            if (!clientIdsWithAppointments.has(client.id)) {
                results.push(client);
            }
        });
        
        results.sort((a, b) => {
            const aIsApp = 'service' in a;
            const bIsApp = 'service' in b;

            if (aIsApp && !bIsApp) return -1;
            if (!aIsApp && bIsApp) return 1;
            if (aIsApp && bIsApp) {
                return (a as Appointment).time.localeCompare((b as Appointment).time);
            }
            return (a as Client).name.localeCompare((b as Client).name);
        });

        return results;
    }, [clientSearch, clients, todayAppointments, selectedClients]);

    const handleConfirmReturn = (returnedItems: ReturnItem[], professionalId: string, isEmployeePurchase: boolean) => {
        returnedItems.forEach(item => {
            const stockItem = stockItems.find(si => si.id === item.product.id);
            if (stockItem) {
                updateStockQuantity(stockItem.id, stockItem.quantity + 1);
            }
        });

        let commissionReversed = 0;
        if (!isEmployeePurchase) {
            const professional = professionals.find(p => p.id === professionalId);
            if (professional) {
                const totalCommissionReversed = returnedItems.reduce((sum, item) => {
                    const commissionPercentage = item.product.commissionPercentage || 0;
                    const commissionValue = item.product.price * item.quantity * (commissionPercentage / 100);
                    return sum + commissionValue;
                }, 0);
                
                commissionReversed = totalCommissionReversed;

                if (totalCommissionReversed > 0) {
                    addVale({
                        employeeId: professionalId,
                        employeeName: professional.name,
                        date: new Date().toISOString(),
                        items: [{
                            name: `Estorno de comissão por devolução`,
                            quantity: returnedItems.length,
                            price: totalCommissionReversed
                        }],
                        totalAmount: totalCommissionReversed,
                    });
                }
            }
        }
        
        setModal(null);
        alert(`Devolução processada com sucesso!\n- Itens retornados ao estoque.\n${!isEmployeePurchase && commissionReversed > 0 ? `- Estorno de comissão de R$ ${commissionReversed.toFixed(2).replace('.', ',')} lançado para o funcionário.` : '- Nenhuma comissão estornada.'}`);
    };

    const handleSelectClient = (client: Client) => {
        if (!selectedClients.some(c => c.id === client.id)) {
            setSelectedClients(prev => [...prev, client]);
        }
        setClientSearch('');
    };
    
    const handleSelectEmployee = (prof: Professional) => {
        const clientFromProf: Client = {
            id: `emp-${prof.id}`,
            name: prof.name,
            email: '',
            phone: '',
            avatarUrl: prof.avatarUrl,
            isEmployee: true,
            employeeId: prof.id,
        };
        handleSelectClient(clientFromProf);
    };

    const handleRemoveClient = (clientId: string) => {
        setSelectedClients(prev => prev.filter(c => c.id !== clientId));
    };

    const handleOpenAddClientModal = () => {
        setClientSearchForModal(clientSearch);
        setIsAddClientModalOpen(true);
    };

    const handleSaveNewClient = async (clientData: Omit<Client, 'id' | 'avatarUrl' | 'notes'>) => {
        const newClient = await addClient(clientData);
        handleSelectClient(newClient);
        setIsAddClientModalOpen(false);
    };

    const handleSelectScheduledClient = (appointment: Appointment) => {
        const client = clients.find(c => c.id === appointment.clientId);
        if (client) {
            handleSelectClient(client);
        }

        if (appointment.paymentStatus === 'pending_package_purchase' && appointment.pendingPackagePurchaseId) {
            const isAlreadyInCart = cart.some(cartItem => cartItem.triggeredByAppointmentId === appointment.id);
            if (isAlreadyInCart) {
                return;
            }
    
            const packageTemplate = packageTemplates.find(t => t.id === appointment.pendingPackagePurchaseId);
            if (packageTemplate) {
                const sellerId = loggedInProfessional?.id ?? professionals[0]?.id;
                let commissionPercentage = 0;
                const prof = professionals.find(p => p.id === sellerId);
                const override = prof?.commissionOverrides?.find(o => o.itemType === 'package' && o.itemId === packageTemplate.id);
                if (override) {
                    commissionPercentage = override.percentage;
                }
    
                const cartItem: CartItem = {
                    id: `pkg-purchase-${appointment.id}`,
                    type: 'package',
                    item: packageTemplate,
                    professionalId: sellerId,
                    commission: commissionPercentage,
                    discountValue: 0,
                    discountType: 'FIXED',
                    triggeredByAppointmentId: appointment.id,
                };
                setCart(prev => [...prev, cartItem]);
                setClientSearch('');
            } else {
                alert(`Erro: Pacote (ID: ${appointment.pendingPackagePurchaseId}) agendado para compra não foi encontrado.`);
            }
            return;
        }

        const isAlreadyInCart = cart.some(cartItem => cartItem.id === appointment.id);
        if (isAlreadyInCart) {
            return;
        }

        let discountValue = 0;
        let discountType: 'FIXED' | 'PERCENT' = 'FIXED';
        let appliedDiscountName: string | undefined = undefined;

        if (appointment.paymentStatus === 'paid' || appointment.paymentStatus === 'paid_with_package') {
            discountValue = appointment.service.price;
        } else {
            const activeDiscount = getWeeklyDiscount(appointment.service, 'service');
            if (activeDiscount) {
                appliedDiscountName = activeDiscount.name;
                discountValue = activeDiscount.discountValue;
                discountType = activeDiscount.discountType;
            }
        }

        const professionalForCommission = professionals.find(p => p.id === appointment.professional.id);
        const override = professionalForCommission?.commissionOverrides?.find(o => o.itemType === 'service' && o.itemId === appointment.service.id);

        const finalCommission = override
            ? override.percentage
            : (appointment.commissionPercentage ?? appointment.service.commissionPercentage ?? salonSettings.defaultCommissionPercentage);

        const newCartItem: CartItem = {
            id: appointment.id,
            type: 'service',
            item: appointment.service,
            professionalId: appointment.professional.id,
            commission: finalCommission,
            discountValue: discountValue,
            discountType: discountType,
            appliedDiscountName: appliedDiscountName,
            isPackage: appointment.paymentStatus === 'paid_with_package',
            clientPackageId: appointment.clientPackageId,
            isRented: professionalForCommission?.employmentType === 'rented',
        };
        
        setCart(prev => [...prev, newCartItem]);
        setClientSearch('');
    };


    const handleAddItemToCart = (item: Service | SaleProduct | ServicePackageTemplate, type: 'service' | 'product' | 'package') => {
        const clientIsEmployee = selectedClients.length > 0 && selectedClients.every(c => c.isEmployee);
    
        let assignedProfessionalId: string | null = null;
        if (type === 'service') {
            if (selectedClients.length === 1 && selectedClients[0].isEmployee) {
                 assignedProfessionalId = selectedClients[0].employeeId ?? null;
            }
        } else {
            assignedProfessionalId = loggedInProfessional?.id ?? professionals[0]?.id;
        }

        const professional = professionals.find(p => p.id === assignedProfessionalId);
        const isRentedProfessional = professional?.employmentType === 'rented';

        const cartItem: CartItem = {
            id: `${type}-${item.id}-${Date.now()}`,
            type,
            item,
            professionalId: assignedProfessionalId,
            commission: 0,
            discountValue: 0,
            discountType: 'FIXED',
            isDose: false,
            overridePrice: undefined,
            isRented: isRentedProfessional
        };

        if (type === 'service' || type === 'package') {
            const activeDiscount = getWeeklyDiscount(item as Service | ServicePackageTemplate, type);
            if (activeDiscount) {
                cartItem.appliedDiscountName = activeDiscount.name;
                cartItem.discountValue = activeDiscount.discountValue;
                cartItem.discountType = activeDiscount.discountType;
            }
        }
    
        if (type === 'service') {
            const service = item as Service;
            
            if (assignedProfessionalId) {
                const professionalForCommission = professionals.find(p => p.id === assignedProfessionalId);
                const override = professionalForCommission?.commissionOverrides?.find(o => o.itemType === 'service' && o.itemId === service.id);
                if (override) {
                    cartItem.commission = override.percentage;
                } else {
                    cartItem.commission = service.commissionPercentage ?? salonSettings.defaultCommissionPercentage;
                }
            }
            
            if (clientIsEmployee && service.dosePrice !== undefined) {
                cartItem.isDose = true;
                cartItem.overridePrice = service.dosePrice;
            }

            if (selectedClients.length === 1 && !clientIsEmployee) {
                const client = selectedClients[0];
                const availablePackages = getPackagesForClient(client.id);
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const applicablePackage = availablePackages.find(pkg =>
                    pkg.template?.serviceId === service.id &&
                    pkg.creditsRemaining > 0 &&
                    new Date(pkg.expiryDate) >= today
                );

                if (applicablePackage) {
                    if (window.confirm(
                        `${client.name} possui um pacote de "${applicablePackage.template?.name}" com ${applicablePackage.creditsRemaining} crédito(s) restante(s).\n\nDeseja usar um crédito para este serviço?`
                    )) {
                        cartItem.clientPackageId = applicablePackage.id;
                        cartItem.isPackage = true;
                        cartItem.discountValue = service.price;
                        cartItem.discountType = 'FIXED';
                        cartItem.appliedDiscountName = undefined; // Override promo
                    }
                }
            }

        } else if (type === 'product') {
            const product = item as SaleProduct;
            cartItem.commission = product.commissionPercentage ?? 0;
            if (clientIsEmployee) {
                cartItem.discountValue = product.commissionPercentage ?? 0;
                cartItem.discountType = 'PERCENT';
                cartItem.commission = 0;
            }
        } else if (type === 'package') {
             if (selectedClients.length === 0) {
                alert('Por favor, selecione um cliente antes de adicionar um pacote.');
                return;
            }
            if (loggedInProfessional) {
                const prof = professionals.find(p => p.id === loggedInProfessional.id);
                const override = prof?.commissionOverrides?.find(o => o.itemType === 'package' && o.itemId === item.id);
                if (override) {
                    cartItem.commission = override.percentage;
                } else {
                    cartItem.commission = 0; // Default: No commission for selling a package
                }
            } else {
                cartItem.commission = 0;
            }
        }
        
        setCart(prev => [...prev, cartItem]);
    };
    
    const handleRemoveFromCart = (cartItemId: string) => {
        setCart(prev => prev.filter(item => item.id !== cartItemId));
    };

    const handleUpdateCartItem = (cartItemId: string, updates: Partial<CartItem>) => {
        setCart(prev => prev.map(item => {
            if (item.id === cartItemId) {
                const updatedItem = { ...item, ...updates };
    
                if ('professionalId' in updates && updates.professionalId) {
                    const newProfessional = professionals.find(p => p.id === updates.professionalId);
                    
                    updatedItem.isRented = newProfessional?.employmentType === 'rented';

                    if (item.type === 'service') {
                         const service = updatedItem.item as Service;
                        if (newProfessional) {
                            const override = newProfessional.commissionOverrides?.find(o => o.itemType === 'service' && o.itemId === service.id);
                            
                            if (override) {
                                updatedItem.commission = override.percentage;
                            } else {
                                updatedItem.commission = service.commissionPercentage ?? salonSettings.defaultCommissionPercentage;
                            }
                        }
                    }
                }
                
                return updatedItem;
            }
            return item;
        }));
    };
    
    const applyDiscount = (itemId: string, value: number, type: 'FIXED' | 'PERCENT') => {
        handleUpdateCartItem(itemId, { discountValue: value, discountType: type });
        setModal(null);
    };

    const removeDiscount = (itemId: string) => {
        handleUpdateCartItem(itemId, { discountValue: 0, discountType: 'FIXED' });
        setModal(null);
    };

     const applyDose = (itemId: string, price: number | null) => {
        handleUpdateCartItem(itemId, { 
            overridePrice: price !== null ? price : undefined,
            isDose: price !== null
        });
        setModal(null);
    };
    
    const handlePasswordProtectedAction = (action: () => void) => {
        if (salonSettings.privacyPassword) {
            setPasswordAction(() => action);
            setModal('password');
        } else {
            action();
        }
    };
    
    const handleConfirmCommission = (newPercentages: Record<string, number>) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.professionalId && newPercentages[item.professionalId] !== undefined) {
                    return {
                        ...item,
                        commission: newPercentages[item.professionalId],
                    };
                }
                return item;
            });
        });
        setModal(null);
        alert("Porcentagens de comissão atualizadas para esta venda!");
    };
    
    const handleProceedToPayment = () => {
        if (processedCart.length > 0) {
            setShowPaymentMethods(true);
        }
    };

    const completeCheckout = (paymentMethod: string, installments: number = 1) => {
        const hasPackage = processedCart.some(item => item.type === 'package');
        if (hasPackage && selectedClients.length === 0) {
            alert('Por favor, selecione um cliente para associar ao pacote.');
            return;
        }

        const salonItems = processedCart.filter(item => !item.isRented);
        const rentedItems = processedCart.filter(item => item.isRented);

        // Process salon sale
        if (salonItems.length > 0) {
            if (paymentMethod !== 'Vale') {
                const saleRecord: Omit<SaleRecord, 'id'> = {
                    date: new Date().toISOString(),
                    clientIds: selectedClients.map(c => c.id),
                    clientNames: selectedClients.map(c => c.name),
                    items: salonItems,
                    totals: totals,
                    payment: {
                        method: paymentMethod,
                        installments: paymentMethod === 'Crédito' ? installments : undefined,
                    },
                };
                addSale(saleRecord);
            } else {
                const employeeClient = selectedClients[0];
                if (!employeeClient?.isEmployee || !employeeClient.employeeId) {
                    alert('Erro: Para lançar um vale, um único funcionário deve ser selecionado.');
                    return;
                }
                addVale({
                    employeeId: employeeClient.employeeId,
                    employeeName: employeeClient.name,
                    date: new Date().toISOString(),
                    items: salonItems.map(cartItem => ({ name: cartItem.item.name, quantity: 1, price: cartItem.finalPrice })),
                    totalAmount: totals.total,
                });
            }
        }
        
        // Process rented sales
        if (rentedItems.length > 0) {
            const rentedSalesByProf = rentedItems.reduce((acc, item) => {
                const profId = item.professionalId;
                if (profId) {
                    if (!acc[profId]) acc[profId] = [];
                    acc[profId].push(item);
                }
                return acc;
            }, {} as Record<string, ProcessedCartItem[]>);

            for (const profId in rentedSalesByProf) {
                const itemsForProf = rentedSalesByProf[profId];
                const subtotal = itemsForProf.reduce((sum, i) => sum + i.item.price, 0);
                const discount = itemsForProf.reduce((sum, i) => sum + i.manualDiscount, 0);
                const total = subtotal - discount;

                const rentedSaleRecord: Omit<SaleRecord, 'id'> = {
                    date: new Date().toISOString(),
                    clientIds: selectedClients.map(c => c.id),
                    clientNames: selectedClients.map(c => c.name),
                    items: itemsForProf,
                    totals: { subtotal, discount, tip: 0, total },
                    payment: { method: paymentMethod, installments }
                };

                try {
                    const key = `personal_dashboard_${profId}`;
                    const existingDataRaw = localStorage.getItem(key);
                    const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : { sales: [], stock: [] };
                    existingData.sales.push({ ...rentedSaleRecord, id: `rented-sale-${Date.now()}` });
                    localStorage.setItem(key, JSON.stringify(existingData));
                } catch (e) {
                    console.error(`Falha ao salvar venda para funcionário ${profId}`, e);
                }
            }
        }
        
        // Update stock and appointments for all items
        processedCart.forEach(cartItem => {
            if (cartItem.type === 'package' && cartItem.triggeredByAppointmentId) {
                const newPackage = buyPackage(selectedClients[0].id, cartItem.item.id);
                useCredit(newPackage.id);
                 updateAppointment(cartItem.triggeredByAppointmentId, {
                    status: 'completed',
                    paymentStatus: 'paid_with_package',
                    clientPackageId: newPackage.id,
                    pendingPackagePurchaseId: undefined,
                });
            } else if (cartItem.type === 'package') {
                buyPackage(selectedClients[0].id, cartItem.item.id);
            } else if (cartItem.type === 'product') {
                const stockItem = stockItems.find(si => si.id === cartItem.item.id);
                if (stockItem) {
                    updateStockQuantity(stockItem.id, stockItem.quantity - 1);
                }
            } else if (cartItem.id.startsWith('a')) { // This is an appointment
                 updateAppointment(cartItem.id, { 
                    status: 'completed', 
                    paymentStatus: cartItem.isPackage ? 'paid_with_package' : 'paid' 
                });
            }
        
            if (cartItem.clientPackageId && !cartItem.id.startsWith('a')) {
                useCredit(cartItem.clientPackageId);
            }
        });

        setCart([]);
        setSelectedClients([]);
        setShowPaymentMethods(false);
        setTip(0);
        alert(paymentMethod === 'Vale' ? 'Vale lançado com sucesso!' : 'Venda(s) finalizada(s) com sucesso!');
    };
    
    const handlePaymentMethodSelect = (paymentMethod: string) => {
        if (paymentMethod === 'Crédito') {
            setIsInstallmentsModalOpen(true);
        } else if (paymentMethod === 'Dinheiro') {
            setIsCashPaymentModalOpen(true);
        } else {
            completeCheckout(paymentMethod);
        }
    };

    const showLoanOption = selectedClients.length === 1 && selectedClients[0].isEmployee && cart.length === 0 && !showPaymentMethods;

    const handleRegisterLoan = () => {
        const amount = parseFloat(loanAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, insira um valor válido para o empréstimo.');
            return;
        }

        const employeeClient = selectedClients[0];
        if (!employeeClient?.isEmployee || !employeeClient.employeeId) {
            alert('Erro: Um funcionário deve ser selecionado.');
            return;
        }

        addVale({
            employeeId: employeeClient.employeeId,
            employeeName: employeeClient.name,
            date: new Date().toISOString(),
            items: [{ name: 'Empréstimo', quantity: 1, price: amount }],
            totalAmount: amount,
        });

        alert(`Empréstimo de R$ ${amount.toFixed(2).replace('.', ',')} registrado para ${employeeClient.name}.`);
        
        setCart([]);
        setSelectedClients([]);
        setLoanAmount('');
        setTip(0);
    };
    
    const handleConfirmSangria = (amount: number, reason: string) => {
        addTransaction({ type: 'sangria', amount, reason });
        alert(`Retirada de R$ ${amount.toFixed(2).replace(',',',')} registrada com sucesso.`);
        setModal(null);
    };

    const salonAsProfessionalForReturn: Professional = {
        id: 'salon',
        name: 'Salão (Compra de Funcionário)',
        avatarUrl: '', 
        serviceIds: [],
        loginId: '',
        password: '',
        permissions: [],
        employmentType: 'commissioned',
    };
    const professionalsForReturn = [...professionals, salonAsProfessionalForReturn];

    const filteredServices = salonServices.filter(s => s.name.toLowerCase().includes(itemSearch.toLowerCase()));

    return (
        <div className="flex flex-col h-screen bg-black text-white relative">
             {!cashierState.isOpen && !isOpeningModalOpen && (
                <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-2xl font-bold mb-4">Caixa Fechado</h2>
                    <p className="text-gray-400 mb-6">Para iniciar as vendas, você precisa abrir o caixa do dia.</p>
                    <button
                        onClick={() => setIsOpeningModalOpen(true)}
                        className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-500 transition-colors"
                    >
                        Abrir Caixa Agora
                    </button>
                </div>
            )}
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                    <h1 className="text-xl font-bold">Caixa</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsCalculatorOpen(true)} className="p-2 rounded-full hover:bg-gray-800 transition-colors" title="Abrir calculadora"><CalculatorIcon className="w-6 h-6"/></button>
                    <button onClick={() => setModal('return')} className="p-2 rounded-full hover:bg-gray-800 transition-colors"><ArrowUturnLeftIcon /></button>
                    <button onClick={() => setModal('sangria')} className="p-2 rounded-full hover:bg-gray-800 transition-colors"><BanknotesIcon /></button>
                    {canCloseCashier && (
                        <button
                            onClick={() => setIsCloseCashierModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <ChartIcon className="w-5 h-5" />
                            <span>Fechar Caixa</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row gap-4 p-4 overflow-y-auto pb-4">
                <div className="lg:w-2/5 xl:w-1/3 flex flex-col gap-4">
                    <section className="bg-gray-900 p-4 rounded-lg">
                        <h2 className="font-semibold mb-3">1. Cliente(s)</h2>
                        <div className="space-y-2 mb-3">
                            {selectedClients.map(c => (
                                <div key={c.id} className="bg-gray-800 p-2 rounded flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <img src={c.avatarUrl} className="w-8 h-8 rounded-full" />
                                        <span>{c.name}</span>
                                        {c.isEmployee && <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">Funcionário</span>}
                                    </div>
                                    <button onClick={() => handleRemoveClient(c.id)}><XIcon className="w-4 h-4 text-red-400" /></button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex border-b border-gray-700 mb-3">
                             <button onClick={() => setClientTab('scheduled')} className={`flex-1 py-2 text-sm ${clientTab === 'scheduled' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Agendados</button>
                             <button onClick={() => setClientTab('search')} className={`flex-1 py-2 text-sm ${clientTab === 'search' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Buscar</button>
                             <button onClick={() => setClientTab('employees')} className={`flex-1 py-2 text-sm ${clientTab === 'employees' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Funcionários</button>
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {clientTab === 'scheduled' && (
                                todayAppointments.length > 0 ? todayAppointments.map(app => {
                                    const client = clients.find(c => c.id === app.clientId);
                                    if (!client) return null;
                                    const isAdded = cart.some(cartItem => cartItem.id === app.id || cartItem.triggeredByAppointmentId === app.id);
                                    return (
                                        <button key={app.id} onClick={() => handleSelectScheduledClient(app)} className="w-full text-left p-3 hover:bg-gray-700 bg-gray-800 rounded-md cursor-pointer flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isAdded}>
                                            <img src={client.avatarUrl} alt={client.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-white truncate flex items-center gap-2">
                                                    <span className="truncate">{client.name}</span>
                                                     {app.paymentStatus === 'pending_package_purchase' && (
                                                        <span className="text-xs font-bold bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-1">
                                                            <GiftIcon className="w-3 h-3" /> COMPRAR PACOTE
                                                        </span>
                                                    )}
                                                    {app.paymentStatus === 'paid' && (
                                                        <span className="text-xs font-bold bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full flex-shrink-0">
                                                            PAGO ONLINE
                                                        </span>
                                                    )}
                                                    {(app.paymentStatus === 'paid_with_package' || app.clientPackageId) && !isAdded && (
                                                        <span className="text-xs font-bold bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-1">
                                                            <GiftIcon className="w-3 h-3"/> PACOTE
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-gray-300 truncate text-sm">{app.service.name}</p>
                                            </div>
                                            {isAdded && <div className="text-xs text-green-400 font-semibold pl-2 flex-shrink-0">Adicionado</div>}
                                        </button>
                                    );
                                }) : <p className="text-center text-gray-500 text-sm py-4">Nenhum cliente agendado.</p>
                            )}

                            {clientTab === 'search' && (
                                <div className="relative">
                                    <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-2" />
                                    {clientSearch && (searchResults.length > 0 ? searchResults.map(item => (
                                        'service' in item ? (
                                            <button key={item.id} onClick={() => handleSelectScheduledClient(item)} className="w-full text-left p-2 hover:bg-gray-700 bg-gray-800/50 rounded-md cursor-pointer mb-1 text-sm">Agendamento: {clients.find(c => c.id === item.clientId)?.name} - {item.service.name}</button>
                                        ) : (
                                            <button key={item.id} onClick={() => handleSelectClient(item)} className="w-full text-left p-2 hover:bg-gray-700 bg-gray-800/50 rounded-md cursor-pointer mb-1 text-sm">{item.name}</button>
                                        )
                                    )) : <div className="p-3 text-gray-500 text-sm"><p>Nenhum resultado.</p><button onClick={handleOpenAddClientModal} className="text-blue-400 font-semibold mt-2 text-left hover:text-blue-300">+ Adicionar novo cliente</button></div>)}
                                </div>
                            )}

                            {clientTab === 'employees' && (
                                professionals.map(prof => (
                                    <button key={prof.id} onClick={() => handleSelectEmployee(prof)} className="w-full text-left p-3 hover:bg-gray-700 bg-gray-800 rounded-md cursor-pointer flex items-center gap-3">
                                        <img src={prof.avatarUrl} alt={prof.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold text-white truncate">{prof.name}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>
                    
                    <section className="bg-gray-900 p-4 rounded-lg flex-grow flex flex-col">
                         <h2 className="font-semibold mb-2">2. Serviços e Produtos</h2>
                         <div className="flex border-b border-gray-700">
                             <button onClick={() => setActiveItemTab('services')} className={`flex-1 py-2 text-sm ${activeItemTab === 'services' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Serviços</button>
                             <button onClick={() => setActiveItemTab('products')} className={`flex-1 py-2 text-sm ${activeItemTab === 'products' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Revenda</button>
                             <button onClick={() => setActiveItemTab('packages')} className={`flex-1 py-2 text-sm ${activeItemTab === 'packages' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Pacotes</button>
                         </div>
                         <input type="text" value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Buscar item..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mt-3 mb-2 text-sm" />
                         <div className="flex-grow overflow-y-auto space-y-2">
                            {activeItemTab === 'services' && (
                                <>
                                    {filteredServices.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                                            <div>
                                                <p>{s.name}</p>
                                                <p className="text-sm text-gray-400">R$ {s.price.toFixed(2).replace('.', ',')}</p>
                                            </div>
                                            <button onClick={() => handleAddItemToCart(s, 'service')} className="p-1 bg-blue-600 rounded-full"><PlusIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {itemSearch && filteredServices.length === 0 && (
                                        <div className="text-center p-4 text-gray-500">
                                            <p>Nenhum serviço encontrado.</p>
                                            <button onClick={() => setIsAddServiceModalOpen(true)} className="mt-2 text-sm font-semibold text-blue-400 hover:text-blue-300">
                                                + Cadastrar serviço "{itemSearch}"
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            {activeItemTab === 'products' && (
                                productsForSale.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                                        <div>
                                            <p>{p.name}</p>
                                            <div className="flex items-center gap-2 text-sm">
                                                 <p className="text-gray-400">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                                                 <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock > 5 ? 'bg-green-900/50 text-green-400' : p.stock > 0 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
                                                    Estoque: {p.stock}
                                                 </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAddItemToCart(p, 'product')} 
                                            className="p-1 bg-blue-600 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed"
                                            disabled={p.stock <= 0}
                                            aria-label={p.stock > 0 ? 'Adicionar ao carrinho' : 'Produto esgotado'}
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                             {activeItemTab === 'packages' && (
                                salonPackageTemplates.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                                        <div>
                                            <p>{p.name}</p>
                                            <p className="text-sm text-gray-400">R$ {p.price.toFixed(2).replace('.', ',')} - {p.sessionCount} sessões</p>
                                        </div>
                                        <button 
                                            onClick={() => handleAddItemToCart(p, 'package')} 
                                            className="p-1 bg-blue-600 rounded-full"
                                            aria-label={`Adicionar pacote ${p.name} ao carrinho`}
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                         </div>
                    </section>
                </div>
                
                <div className="lg:w-3/5 xl:w-2/3 flex flex-col gap-4">
                    <section className="bg-gray-900 p-4 rounded-lg">
                        <h2 className="font-semibold mb-2">3. Funcionário(s) do Salão</h2>
                        <div className="space-y-2">
                             {professionalsDataForCommissionModal.map(({ prof, commissionValue }) => (
                                <div key={prof.id} className="bg-gray-800 p-2 rounded flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <img src={prof.avatarUrl} className="w-8 h-8 rounded-full" />
                                        <span>{prof.name}</span>
                                    </div>
                                    <span className="font-semibold text-green-400">R$ {commissionValue.toFixed(2).replace('.', ',')}</span>
                                </div>
                            ))}
                            {professionalsDataForCommissionModal.length > 0 && (
                                <div className="text-right">
                                    <button onClick={() => setModal('commission')} className="text-xs text-blue-400 font-semibold">Editar porcentagem</button>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-gray-900 p-4 rounded-lg flex-grow flex flex-col">
                        <h2 className="font-semibold mb-2">{showPaymentMethods ? '4. Pagamento' : '4. Resumo da Compra'}</h2>
                        <div className="flex-grow overflow-y-auto space-y-2">
                            {showPaymentMethods ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <p>Selecione o método de pagamento abaixo.</p>
                                </div>
                            ) : showLoanOption ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300 p-4">
                                    <BanknotesIcon className="w-16 h-16 text-gray-500 mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Registrar Empréstimo</h3>
                                    <p className="text-sm text-gray-400 text-center mb-4">
                                        Insira o valor do adiantamento para {selectedClients[0].name}.
                                    </p>
                                    <div className="w-full max-w-xs">
                                        <label htmlFor="loan-amount" className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
                                        <input
                                            type="number"
                                            id="loan-amount"
                                            value={loanAmount}
                                            onChange={(e) => setLoanAmount(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-gray-500"
                                            placeholder="0,00"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            ) : processedCart.length > 0 ? processedCart.map(cItem => {
                                const clientIsEmployee = selectedClients.length > 0 && selectedClients.every(c => c.isEmployee);
                                const isOnlinePayment = cItem.id.startsWith('a') && cItem.discountValue > 0 && cItem.discountValue === cItem.item.price && !cItem.isPackage;
                                
                                return (
                                <div key={cItem.id}>
                                    {cItem.isRented && (
                                        <div className="text-xs text-center font-bold text-teal-300 bg-teal-900/50 py-1 px-2 rounded-t-md -mb-2 relative z-10">
                                            Item de Profissional Alugado (Não entra no caixa do salão)
                                        </div>
                                    )}
                                    <div className={`bg-gray-800 p-3 ${cItem.isRented ? 'rounded-b-lg border-t-2 border-teal-500' : 'rounded-lg'}`}>
                                    <div className="flex justify-between items-start">
                                        <p className="flex items-center gap-2 flex-wrap">
                                            <span>{cItem.item.name}</span>
                                            {cItem.isPackage && (
                                                <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                                    <GiftIcon className="w-3 h-3"/> PACOTE
                                                </span>
                                            )}
                                            {cItem.isDoseApplied && <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full font-semibold">DOSE</span>}
                                            {isOnlinePayment && (
                                                <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full font-semibold">
                                                    PAGO ONLINE
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                             {(cItem.manualDiscount > 0 || cItem.isDoseApplied || cItem.isPackage) ? (
                                                <>
                                                    <span className="line-through text-gray-500 text-sm">R$ {cItem.item.price.toFixed(2).replace('.', ',')}</span>
                                                    <span className="font-semibold">R$ {cItem.finalPrice.toFixed(2).replace('.', ',')}</span>
                                                </>
                                            ) : (
                                                <span className="font-semibold">R$ {cItem.item.price.toFixed(2).replace('.', ',')}</span>
                                            )}
                                            <button onClick={() => handleRemoveFromCart(cItem.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                                        </div>
                                    </div>

                                    {cItem.appliedDiscountName && (
                                        <div className="mt-1 border-t border-gray-700/50 pt-1 text-xs space-y-0.5">
                                             <div className="flex justify-between text-green-400 font-semibold">
                                                <span>Promo: {cItem.appliedDiscountName}</span>
                                                <span>- R$ {cItem.manualDiscount.toFixed(2).replace('.',',')}</span>
                                            </div>
                                        </div>
                                    )}

                                    {cItem.manualDiscount > 0 && !cItem.appliedDiscountName && !isOnlinePayment && !cItem.isPackage && cItem.type !== 'package' && (
                                        <div className="mt-1 border-t border-gray-700/50 pt-1 text-xs space-y-0.5">
                                             <div className="flex justify-between text-yellow-400 font-semibold">
                                                <span>
                                                    Desconto Manual 
                                                    {cItem.discountType === 'PERCENT' && ` (${cItem.discountValue}%)`}
                                                </span>
                                                <span>- R$ {cItem.manualDiscount.toFixed(2).replace('.',',')}</span>
                                            </div>
                                        </div>
                                    )}
                            
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/50 text-sm">
                                        {cItem.type === 'service' ? (
                                            <div className={!cItem.professionalId ? 'bg-yellow-900/20 p-2 rounded-lg' : ''}>
                                                {!cItem.professionalId && <label className="block text-xs font-semibold text-yellow-300 mb-1">Profissional:</label>}
                                                <select
                                                    value={cItem.professionalId || ''}
                                                    onChange={e => handleUpdateCartItem(cItem.id, { professionalId: e.target.value })}
                                                    className={`bg-gray-700 rounded p-1 text-xs w-full max-w-[150px] ${!cItem.professionalId ? 'border border-yellow-500' : 'border-transparent'}`}
                                                    disabled={cItem.isDoseApplied}
                                                >
                                                    <option value="" disabled>Escolha...</option>
                                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <select value={cItem.professionalId || ''} onChange={e => handleUpdateCartItem(cItem.id, { professionalId: e.target.value })} className="bg-gray-700 rounded p-1 text-xs max-w-[150px]">
                                                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        )}
                                        
                                        <div className="flex items-center gap-3">
                                            {cItem.type === 'service' && clientIsEmployee && (
                                                 <button onClick={() => { setSelectedItemForDose(cItem); setModal('dose'); }} className="text-purple-400 font-semibold text-xs flex items-center gap-1">
                                                     <PencilIcon className="w-3 h-3"/> {cItem.isDoseApplied ? 'Editar Dose' : 'Aplicar Dose'}
                                                 </button>
                                            )}
                                            {!isOnlinePayment && !cItem.isPackage && cItem.type !== 'package' && (
                                                <button onClick={() => { setSelectedItemForDiscount(cItem); setModal('discount'); }} className="text-blue-400 font-semibold text-xs disabled:text-gray-500 disabled:cursor-not-allowed" disabled={!!cItem.appliedDiscountName}>
                                                     {cItem.manualDiscount > 0 && !cItem.appliedDiscountName ? 'Editar Desconto' : 'Aplicar Desconto'}
                                                 </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                </div>
                            )}) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <p>Selecione um cliente e adicione itens à compra.</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                             {showPaymentMethods ? (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <button onClick={() => setShowPaymentMethods(false)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                                            <ArrowLeftIcon className="w-4 h-4" />
                                            Voltar
                                        </button>
                                        <div className="text-right">
                                            <span className="text-gray-400 text-sm">Total a pagar</span>
                                            <p className="font-bold text-3xl">R$ {(totals.total + rentedTotals.total).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { name: 'Dinheiro', icon: <BanknotesIcon className="w-8 h-8"/> },
                                            { name: 'Pix', icon: <SparklesIcon className="w-8 h-8"/> },
                                            { name: 'Débito', icon: <CreditCardIcon className="w-8 h-8"/> },
                                            { name: 'Crédito', icon: <CreditCardIcon className="w-8 h-8"/> },
                                        ].map(method => (
                                            <button 
                                                key={method.name}
                                                onClick={() => handlePaymentMethodSelect(method.name)}
                                                className="flex flex-col items-center justify-center gap-2 bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                                            >
                                                {method.icon}
                                                <span className="font-semibold">{method.name}</span>
                                            </button>
                                        ))}
                                        {selectedClients.length === 1 && selectedClients[0].isEmployee && (
                                            <button 
                                                key="Vale"
                                                onClick={() => completeCheckout('Vale')}
                                                className="flex flex-col items-center justify-center gap-2 bg-blue-900/60 p-6 rounded-lg hover:bg-blue-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-800 text-blue-300"
                                            >
                                                <ClipboardDocumentListIcon className="w-8 h-8"/>
                                                <span className="font-semibold">Lançar como Vale</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : showLoanOption ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between font-bold text-2xl">
                                        <span>Total do Empréstimo</span>
                                        <span>R$ {(parseFloat(loanAmount) || 0).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <button
                                        onClick={handleRegisterLoan}
                                        className="w-full bg-blue-600 font-bold py-3 rounded-lg mt-2 hover:bg-blue-500 disabled:bg-gray-600"
                                        disabled={!loanAmount || parseFloat(loanAmount) <= 0}
                                    >
                                        Registrar Empréstimo como Vale
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-gray-400"><span>Subtotal (Salão)</span><span>R$ {totals.subtotal.toFixed(2).replace('.', ',')}</span></div>
                                    
                                    {totals.discount > 0 && (
                                        <div className="flex justify-between text-red-400">
                                            <span>Descontos (Salão)</span>
                                            <span>- R$ {totals.discount.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Gorjeta (Salão)</span>
                                        {tip > 0 ? (
                                            <button onClick={() => setIsTipModalOpen(true)} className="font-semibold text-green-400 hover:text-green-300 flex items-center gap-1">
                                                <PencilIcon className="w-3 h-3" />
                                                <span>+ R$ {tip.toFixed(2).replace('.', ',')}</span>
                                            </button>
                                        ) : (
                                            <button onClick={() => setIsTipModalOpen(true)} className="text-blue-400 font-semibold text-sm hover:text-blue-300">
                                                + Adicionar Gorjeta
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex justify-between font-bold text-2xl border-t border-gray-700 pt-2 mt-2"><span>Total (Salão)</span><span>R$ {totals.total.toFixed(2).replace('.', ',')}</span></div>
                                    
                                    {rentedTotals.total > 0 && (
                                         <div className="flex justify-between font-semibold text-lg mt-2 text-teal-300 border-t border-gray-700 pt-2">
                                            <span>Total (Aluguel de Sala)</span>
                                            <span>R$ {rentedTotals.total.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleProceedToPayment}
                                        className="w-full bg-green-600 font-bold py-3 rounded-lg mt-2 hover:bg-green-500 disabled:bg-gray-600" 
                                        disabled={processedCart.length === 0 || selectedClients.length === 0 || processedCart.some(item => item.type === 'service' && !item.professionalId)}
                                    >
                                        Ir para Pagamento
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <OpeningCashierModal
                isOpen={isOpeningModalOpen}
                onConfirm={handleOpenCashier}
                onCancel={() => setIsOpeningModalOpen(false)}
            />

            <TipModal
                isOpen={isTipModalOpen}
                onClose={() => setIsTipModalOpen(false)}
                onConfirm={(newTip) => setTip(newTip)}
                currentTip={tip}
                subtotal={totals.subtotal}
            />

            {modal === 'dose' && selectedItemForDose && (
                <DoseModal 
                    item={selectedItemForDose} 
                    onClose={() => setModal(null)} 
                    onApply={applyDose} 
                />
            )}
            {modal === 'discount' && selectedItemForDiscount && (
                <DiscountModal item={selectedItemForDiscount} onClose={() => setModal(null)} onApply={applyDiscount} onRemove={removeDiscount} />
            )}
            {modal === 'password' && (
                <PasswordRevealModal 
                    isOpen={true} 
                    onClose={() => setModal(null)} 
                    onConfirm={password => {
                        if (password === salonSettings.privacyPassword) {
                            passwordAction?.();
                            setModal(null);
                        } else {
                            alert('Senha incorreta!');
                        }
                    }}
                />
            )}
            {modal === 'commission' && (
                <CommissionModal 
                    onClose={() => setModal(null)}
                    professionalsData={professionalsDataForCommissionModal}
                    onConfirm={handleConfirmCommission}
                />
            )}
            {modal === 'return' && (
                <ReturnModal 
                    isOpen={true}
                    onClose={() => setModal(null)}
                    onConfirm={handleConfirmReturn}
                    products={productsForSale}
                    professionals={professionalsForReturn}
                    categories={stockCategories}
                />
            )}
             {modal === 'sangria' && (
                <SangriaModal
                    onClose={() => setModal(null)}
                    onConfirm={handleConfirmSangria}
                />
            )}
            {isAddClientModalOpen && (
                <AdminAddClientModal 
                    onClose={() => setIsAddClientModalOpen(false)}
                    onSave={handleSaveNewClient}
                    initialName={clientSearchForModal}
                />
            )}
            {isAddServiceModalOpen && (
                <AdminAddServiceModal
                    onClose={() => setIsAddServiceModalOpen(false)}
                    serviceToEdit={null}
                    allCategories={getServiceCategories()}
                    defaultCommission={salonSettings.defaultCommissionPercentage}
                    initialName={itemSearch}
                />
            )}
            <FloatingCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
            {isCloseCashierModalOpen && (
                <CloseCashierModal
                    isOpen={isCloseCashierModalOpen}
                    onClose={() => setIsCloseCashierModalOpen(false)}
                    onConfirm={handleConfirmClose}
                    sessionSummary={sessionSummary}
                    initialCash={cashierState.initialCash}
                    salesInSession={salesInSession}
                />
            )}
            <InstallmentsModal
                isOpen={isInstallmentsModalOpen}
                onClose={() => setIsInstallmentsModalOpen(false)}
                onConfirm={(installments) => {
                    setIsInstallmentsModalOpen(false);
                    completeCheckout('Crédito', installments);
                }}
                maxInstallments={financialSettings.maxInstallments}
                totalAmount={totals.total}
                minInstallmentValue={financialSettings.minInstallmentValue}
            />
            <CashPaymentModal
                isOpen={isCashPaymentModalOpen}
                onClose={() => setIsCashPaymentModalOpen(false)}
                totalAmount={totals.total + rentedTotals.total}
                onConfirm={() => {
                    setIsCashPaymentModalOpen(false);
                    completeCheckout('Dinheiro');
                }}
            />
        </div>
    );
};

export default AdminCashierScreen;