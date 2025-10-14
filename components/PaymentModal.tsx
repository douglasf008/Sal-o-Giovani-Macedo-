import React, { useState, useEffect } from 'react';
import XIcon from './icons/XIcon';
import { usePayment } from '../contexts/PaymentContext';
import CreditCardIcon from './icons/CreditCardIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import ClipboardIcon from './icons/ClipboardIcon';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    onPaymentSuccess: (transactionId: string) => void;
    maxInstallments: number;
    acceptsDebit: boolean;
    minInstallmentValue: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, onPaymentSuccess, maxInstallments, acceptsDebit, minInstallmentValue }) => {
    const [activeTab, setActiveTab] = useState<'card' | 'debit' | 'pix'>('card');
    const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvc: '' });
    const [installments, setInstallments] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { processPayment } = usePayment();

    const installmentOptions = Array.from({ length: maxInstallments }, (_, i) => i + 1)
        .filter(i => (amount / i) >= minInstallmentValue);

    useEffect(() => {
        // Reset state when modal is opened or amount changes
        if (isOpen) {
            setActiveTab('card');
            setCardDetails({ number: '', name: '', expiry: '', cvc: '' });
            setInstallments(installmentOptions.length > 0 ? installmentOptions[0] : 1);
            setIsLoading(false);
            setError('');
        }
    }, [isOpen, amount, installmentOptions]);


    if (!isOpen) return null;

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async (method: 'card' | 'debit' | 'pix') => {
         if ((method === 'card' || method === 'debit') && (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvc)) {
            setError('Por favor, preencha todos os campos do cartão.');
            return;
        }
        setError('');
        setIsLoading(true);

        const paymentDetails = method === 'card' ? { ...cardDetails, installments } : cardDetails;
        
        try {
            const result = await processPayment(amount, method, paymentDetails);
            if (result.success) {
                onPaymentSuccess(result.transactionId);
            } else {
                setError('O pagamento falhou. Por favor, tente novamente.');
            }
        } catch (e) {
            setError('Ocorreu um erro ao processar o pagamento.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyPixCode = () => {
        navigator.clipboard.writeText('00020126330014br.gov.bcb.pix0111123456789010214valor_a_pagar5303986540550.005802BR5913Nome do Salao6009SAO PAULO62070503***6304E4A9');
        alert('Código Pix copiado!');
    }

    const isCardFormValid = cardDetails.number && cardDetails.name && cardDetails.expiry && cardDetails.cvc;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-lg text-white" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Pagamento</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>

                <div className="flex border-b border-gray-700 mb-6">
                     {acceptsDebit && (
                         <button onClick={() => setActiveTab('debit')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'debit' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                            <CreditCardIcon className="w-5 h-5"/> Débito
                        </button>
                    )}
                    <button onClick={() => setActiveTab('card')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'card' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                        <CreditCardIcon className="w-5 h-5"/> Crédito
                    </button>
                    <button onClick={() => setActiveTab('pix')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'pix' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                        <QrCodeIcon className="w-5 h-5"/> Pix
                    </button>
                </div>

                {(activeTab === 'card' || activeTab === 'debit') ? (
                    <div className="space-y-4">
                        <input type="text" name="number" placeholder="Número do Cartão" value={cardDetails.number} onChange={handleCardChange} className="w-full bg-gray-800 rounded px-3 py-2" />
                        <input type="text" name="name" placeholder="Nome no Cartão" value={cardDetails.name} onChange={handleCardChange} className="w-full bg-gray-800 rounded px-3 py-2" />
                        <div className="flex gap-4">
                            <input type="text" name="expiry" placeholder="Validade (MM/AA)" value={cardDetails.expiry} onChange={handleCardChange} className="w-1/2 bg-gray-800 rounded px-3 py-2" />
                            <input type="text" name="cvc" placeholder="CVC" value={cardDetails.cvc} onChange={handleCardChange} className="w-1/2 bg-gray-800 rounded px-3 py-2" />
                        </div>
                        {activeTab === 'card' && maxInstallments > 1 && (
                            <div>
                                <label htmlFor="installments-select" className="block text-sm font-medium text-gray-400 mb-2">Parcelas</label>
                                {installmentOptions.length > 0 ? (
                                    <select
                                        id="installments-select"
                                        value={installments}
                                        onChange={(e) => setInstallments(Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                                    >
                                        {installmentOptions.map(i => (
                                            <option key={i} value={i}>
                                                {i}x de R$ {(amount / i).toFixed(2).replace('.', ',')}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500">
                                        Valor baixo demais para parcelar.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <p className="text-gray-400">Escaneie o QR Code ou copie o código abaixo para pagar.</p>
                        <div className="bg-white p-4 inline-block rounded-lg">
                            <QrCodeIcon className="w-40 h-40 text-black" />
                        </div>
                        <button onClick={copyPixCode} className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-gray-600 transition-colors">
                            <ClipboardIcon className="w-5 h-5"/>
                            <span>Copiar Código Pix</span>
                        </button>
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

                <footer className="mt-8">
                    <button 
                        onClick={() => handlePayment(activeTab)}
                        disabled={isLoading || ((activeTab === 'card' || activeTab === 'debit') && !isCardFormValid)}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-500 transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                    >
                        {isLoading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2).replace('.', ',')}`}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PaymentModal;