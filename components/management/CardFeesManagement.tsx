import React, { useState, useMemo } from 'react';
import ReceiptPercentIcon from '../icons/ReceiptPercentIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import { useFinancials, FinancialSettings } from '../../contexts/FinancialsContext';

// Define the structure for credit fee tiers with string for form control
interface CreditFeeTierForm {
    installments: number;
    fee: string;
}

const CardFeesManagement: React.FC = () => {
    const { settings, saveSettings } = useFinancials();

    // Use local state for form management, initialized from context
    const [formState, setFormState] = useState({
        debitFee: String(settings.debitFee),
        creditFeeType: settings.creditFeeType,
        fixedCreditFee: String(settings.fixedCreditFee),
        creditFeeTiers: settings.creditFeeTiers.map(tier => ({ ...tier, fee: String(tier.fee) })),
        maxInstallments: String(settings.maxInstallments),
        minInstallmentValue: String(settings.minInstallmentValue),
        feeBearer: settings.feeBearer,
    });

    const getFormStateAsSettings = (form: typeof formState): FinancialSettings => ({
        ...settings,
        debitFee: parseFloat(form.debitFee) || 0,
        creditFeeType: form.creditFeeType,
        fixedCreditFee: parseFloat(form.fixedCreditFee) || 0,
        creditFeeTiers: form.creditFeeTiers.map(tier => ({
            installments: tier.installments,
            fee: parseFloat(tier.fee) || 0,
        })).sort((a, b) => a.installments - b.installments),
        maxInstallments: parseInt(form.maxInstallments, 10) || 1,
        minInstallmentValue: parseFloat(form.minInstallmentValue) || 0,
        feeBearer: form.feeBearer,
    });
    
    const hasChanges = useMemo(() => {
        const currentFormSettings = getFormStateAsSettings(formState);
        const originalSettingsForComparison = {
            ...settings,
            creditFeeTiers: [...settings.creditFeeTiers].sort((a, b) => a.installments - b.installments),
        };
        return JSON.stringify(originalSettingsForComparison) !== JSON.stringify(currentFormSettings);
    }, [formState, settings]);

    const [newInstallments, setNewInstallments] = useState('');
    const [newFee, setNewFee] = useState('');
    const [simPaymentType, setSimPaymentType] = useState<'debit' | 'credit'>('credit');
    const [simSaleValue, setSimSaleValue] = useState('100.00');
    const [simInstallments, setSimInstallments] = useState('1');

    const handleFormChange = <K extends keyof typeof formState>(field: K, value: (typeof formState)[K]) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        saveSettings(getFormStateAsSettings(formState));
        alert('Configurações de taxas salvas com sucesso!');
    };

    const handleDiscard = () => {
        setFormState({
            debitFee: String(settings.debitFee),
            creditFeeType: settings.creditFeeType,
            fixedCreditFee: String(settings.fixedCreditFee),
            creditFeeTiers: settings.creditFeeTiers.map(tier => ({ ...tier, fee: String(tier.fee) })),
            maxInstallments: String(settings.maxInstallments),
            minInstallmentValue: String(settings.minInstallmentValue),
            feeBearer: settings.feeBearer,
        });
    };

    const handleAddCreditFee = () => {
        const installments = parseInt(newInstallments, 10);
        const fee = parseFloat(newFee);

        if (!installments || installments <= 0 || isNaN(fee) || fee < 0) {
            alert('Por favor, insira valores válidos para parcelas e taxa.');
            return;
        }
        if (formState.creditFeeTiers.some(tier => tier.installments === installments)) {
            alert(`Já existe uma regra para ${installments} parcela(s).`);
            return;
        }

        const newTiers = [...formState.creditFeeTiers, { installments, fee: newFee }].sort((a, b) => a.installments - b.installments);
        handleFormChange('creditFeeTiers', newTiers);
        setNewInstallments('');
        setNewFee('');
    };

    const handleRemoveCreditFee = (installmentsToRemove: number) => {
        const updatedTiers = formState.creditFeeTiers.filter(tier => tier.installments !== installmentsToRemove);
        handleFormChange('creditFeeTiers', updatedTiers);
    };

    const simulationResult = useMemo(() => {
        const value = parseFloat(simSaleValue) || 0;
        let feePercentage = 0;

        if (simPaymentType === 'debit') {
            feePercentage = parseFloat(formState.debitFee) || 0;
        } else {
            if (formState.creditFeeType === 'fixed') {
                feePercentage = parseFloat(formState.fixedCreditFee) || 0;
            } else {
                const numInstallments = parseInt(simInstallments, 10) || 1;
                const applicableTier = formState.creditFeeTiers
                    .filter(tier => tier.installments >= numInstallments)
                    .sort((a, b) => a.installments - b.installments)[0];
                
                if (applicableTier) {
                    feePercentage = parseFloat(applicableTier.fee) || 0;
                } else if (formState.creditFeeTiers.length > 0) {
                    feePercentage = parseFloat(formState.creditFeeTiers[formState.creditFeeTiers.length - 1].fee) || 0;
                }
            }
        }
        
        const totalFee = value * (feePercentage / 100);
        const netValue = value - totalFee;

        return { totalFee, netValue, feePercentage };
    }, [simSaleValue, simPaymentType, simInstallments, formState]);

    return (
        <div className="space-y-8">
             <div>
                <h2 className="text-2xl font-bold">Taxas da Máquina de Cartão</h2>
                <p className="text-gray-400">Configure as taxas e simule parcelamentos.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex items-start gap-4">
                        <ReceiptPercentIcon className="w-8 h-8 text-gray-400 mt-1 flex-shrink-0"/>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Configuração de Taxas</h3>
                            <p className="text-sm text-gray-400 mb-6">Defina as taxas para débito e crédito.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="debit-fee" className="block text-sm font-medium text-gray-300 mb-2">Taxa de Débito (%)</label>
                                    <input type="number" id="debit-fee" value={formState.debitFee} onChange={(e) => handleFormChange('debitFee', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" />
                                </div>
                                
                                <div>
                                    <h4 className="text-md font-semibold text-gray-300 mb-3">Taxas de Crédito</h4>
                                    <div className="flex gap-4 bg-gray-800 p-1 rounded-lg mb-4">
                                        <button onClick={() => handleFormChange('creditFeeType', 'tiered')} className={`w-full text-center rounded-md py-2 text-sm font-semibold transition-colors ${formState.creditFeeType === 'tiered' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}>Por Parcela</button>
                                        <button onClick={() => handleFormChange('creditFeeType', 'fixed')} className={`w-full text-center rounded-md py-2 text-sm font-semibold transition-colors ${formState.creditFeeType === 'fixed' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}>Fixa</button>
                                    </div>

                                    {formState.creditFeeType === 'tiered' ? (
                                        <>
                                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                                                {formState.creditFeeTiers.map(tier => (
                                                    <div key={tier.installments} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                                                        <p className="text-sm">Até <span className="font-bold">{tier.installments}x</span></p>
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-semibold">{tier.fee}%</p>
                                                            <button onClick={() => handleRemoveCreditFee(tier.installments)} className="p-1 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-end gap-2 border-t border-gray-700 pt-3">
                                                <div className="flex-1"><label htmlFor="new-installments" className="text-xs text-gray-400">Parcelas (até)</label><input type="number" id="new-installments" value={newInstallments} onChange={e => setNewInstallments(e.target.value)} placeholder="Ex: 3" min="1" className="w-full bg-gray-700 rounded-md px-2 py-1.5 mt-1" /></div>
                                                <div className="flex-1"><label htmlFor="new-fee" className="text-xs text-gray-400">Taxa (%)</label><input type="number" id="new-fee" value={newFee} onChange={e => setNewFee(e.target.value)} placeholder="Ex: 6.99" min="0" step="0.01" className="w-full bg-gray-700 rounded-md px-2 py-1.5 mt-1" /></div>
                                                <button onClick={handleAddCreditFee} className="p-2 bg-blue-600 rounded-md hover:bg-blue-500"><PlusIcon className="w-5 h-5" /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label htmlFor="fixed-credit-fee" className="block text-sm font-medium text-gray-300 mb-2">Taxa de Crédito Fixa (%)</label>
                                            <input type="number" id="fixed-credit-fee" value={formState.fixedCreditFee} onChange={(e) => handleFormChange('fixedCreditFee', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"/>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="max-installments" className="block text-sm font-medium text-gray-300 mb-2">Máximo de parcelas</label>
                                        <input type="number" id="max-installments" value={formState.maxInstallments} onChange={(e) => handleFormChange('maxInstallments', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" min="1"/>
                                    </div>
                                    <div>
                                        <label htmlFor="min-installment-value" className="block text-sm font-medium text-gray-300 mb-2">Valor mín. por parcela</label>
                                        <input type="number" id="min-installment-value" value={formState.minInstallmentValue} onChange={(e) => handleFormChange('minInstallmentValue', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" min="0" step="0.01" placeholder="R$"/>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-300 mb-2">Quem assume os custos da taxa?</span>
                                     <div className="flex gap-4 bg-gray-800 p-1 rounded-lg">
                                        <button onClick={() => handleFormChange('feeBearer', 'salon')} className={`w-full text-center rounded-md py-2 text-sm font-semibold transition-colors ${formState.feeBearer === 'salon' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}>Salão</button>
                                        <button onClick={() => handleFormChange('feeBearer', 'employee')} className={`w-full text-center rounded-md py-2 text-sm font-semibold transition-colors ${formState.feeBearer === 'employee' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}>Funcionário</button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Isto define de quem o valor da taxa será descontado no fechamento do ciclo.</p>
                                </div>
                                <div className="flex justify-end items-center gap-4 mt-4">
                                    {hasChanges && (
                                        <button onClick={handleDiscard} className="text-gray-400 font-bold py-2 px-6 rounded-lg text-base hover:text-white transition-colors">
                                            Descartar
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleSave} 
                                        disabled={!hasChanges}
                                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg text-base hover:bg-blue-500 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-6">Simulação de Venda</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="sim-sale-value" className="block text-sm font-medium text-gray-300 mb-2">Valor da Venda (R$)</label>
                             <input type="number" id="sim-sale-value" value={simSaleValue} onChange={(e) => setSimSaleValue(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" />
                        </div>
                        <div>
                            <label htmlFor="sim-payment-type" className="block text-sm font-medium text-gray-300 mb-2">Forma</label>
                            <select id="sim-payment-type" value={simPaymentType} onChange={e => setSimPaymentType(e.target.value as 'debit' | 'credit')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 h-[50px]">
                                <option value="debit">Débito</option>
                                <option value="credit">Crédito</option>
                            </select>
                        </div>
                    </div>
                    {simPaymentType === 'credit' && (
                        <div className="mb-6">
                            <label htmlFor="sim-installments" className="block text-sm font-medium text-gray-300 mb-2">Nº de Parcelas</label>
                             <input type="number" id="sim-installments" value={simInstallments} onChange={(e) => setSimInstallments(e.target.value)} min="1" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"/>
                            <p className="text-xs text-gray-500 mt-2">Máximo permitido: {formState.maxInstallments}x</p>
                        </div>
                    )}

                    <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Taxa aplicada:</span>
                            <span className="font-semibold">{simulationResult.feePercentage.toFixed(2).replace('.', ',')}%</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Valor da taxa:</span>
                            <span className="font-semibold text-red-400">R$ {simulationResult.totalFee.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-gray-700 pt-3">
                            <span>Valor líquido:</span>
                            <span className="text-green-400">R$ {simulationResult.netValue.toFixed(2).replace('.', ',')}</span>
                        </div>
                         <p className="text-xs text-gray-500 pt-2"> Esta simulação assume que o salão absorve o custo da taxa. O valor cobrado do cliente permanece o mesmo da venda. </p>
                    </div>
                 </section>
            </div>
        </div>
    );
};

export default CardFeesManagement;