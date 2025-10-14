import React, { useState, useMemo, useEffect } from 'react';
import { useSalonSettings } from '../../salonSettings';
import TagIcon from '../icons/TagIcon';

const ResultRow: React.FC<{ label: string; value: string; color?: string; isTotal?: boolean }> = ({ label, value, color = 'text-white', isTotal = false }) => (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t border-gray-700 mt-2 pt-3' : ''}`}>
        <span className={`text-sm ${isTotal ? 'font-bold' : 'text-gray-400'}`}>{label}</span>
        <span className={`font-semibold ${isTotal ? 'text-xl' : 'text-base'} ${color}`}>{value}</span>
    </div>
);


const ServicePricingCalculator: React.FC = () => {
    const { settings } = useSalonSettings();
    const [price, setPrice] = useState('');
    const [materialCost, setMaterialCost] = useState('');
    const [commission, setCommission] = useState('');
    const [cardFee, setCardFee] = useState('');

    // State for average calculation helper
    const [debitFeeInput, setDebitFeeInput] = useState('');
    const [creditFeeInput, setCreditFeeInput] = useState('');

    useEffect(() => {
        setCommission(String(settings.defaultCommissionPercentage));
    }, [settings.defaultCommissionPercentage]);
    
    // As per user request
    const GOV_TAX_PERCENT = 6;
    const FIXED_COST_PERCENT = 20;

    const results = useMemo(() => {
        const p = parseFloat(price) || 0;
        const mc = parseFloat(materialCost) || 0;
        const comm = parseFloat(commission) || 0;
        const cf = parseFloat(cardFee) || 0;

        if (p <= 0) return null;

        const commissionCost = p * (comm / 100);
        const taxCost = p * (GOV_TAX_PERCENT / 100);
        const fixedCost = p * (FIXED_COST_PERCENT / 100);
        const cardFeeCost = p * (cf / 100);
        
        const totalCosts = commissionCost + taxCost + fixedCost + mc + cardFeeCost;
        const netProfit = p - totalCosts;
        const netProfitPercent = p > 0 ? (netProfit / p) * 100 : 0;
        
        return {
            revenue: p,
            commissionCost,
            taxCost,
            fixedCost,
            materialCost: mc,
            cardFeeCost,
            totalCosts,
            netProfit,
            netProfitPercent
        };
    }, [price, materialCost, commission, cardFee]);

    const handleUseAverage = () => {
        const debit = parseFloat(debitFeeInput) || 0;
        const credit = parseFloat(creditFeeInput) || 0;

        if (debit > 0 || credit > 0) {
            const average = (debit + credit) / 2;
            setCardFee(average.toFixed(2));
        }
    };


    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Calculadora de Precificação de Serviços</h2>
                <p className="text-gray-400">Analise a estrutura de custos e a lucratividade de um serviço para definir o preço ideal.</p>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Inputs */}
                <div className="bg-gray-900 p-6 rounded-lg space-y-6">
                    <div>
                        <label htmlFor="service-price" className="block text-sm font-medium text-gray-300 mb-2">Preço de Venda do Serviço (R$)</label>
                        <input
                            type="number"
                            id="service-price"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 150.00"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label htmlFor="material-cost" className="block text-sm font-medium text-gray-300 mb-2">Custo de Material/Dose (R$)</label>
                        <input
                            type="number"
                            id="material-cost"
                            value={materialCost}
                            onChange={(e) => setMaterialCost(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 25.00"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="commission-percent" className="block text-sm font-medium text-gray-300 mb-2">Comissão (%)</label>
                        <input
                            type="number"
                            id="commission-percent"
                            value={commission}
                            onChange={(e) => setCommission(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 45"
                        />
                    </div>
                    <div>
                        <label htmlFor="card-fee-percent" className="block text-sm font-medium text-gray-300 mb-2">Taxa Cartão (%)</label>
                        <input
                            type="number"
                            id="card-fee-percent"
                            value={cardFee}
                            onChange={(e) => setCardFee(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 4.99"
                        />
                        <div className="bg-gray-800 p-3 rounded-lg mt-2">
                            <p className="text-xs text-gray-400 mb-2">Ou, para calcular uma média:</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={debitFeeInput}
                                    onChange={(e) => setDebitFeeInput(e.target.value)}
                                    placeholder="Débito %"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm"
                                />
                                <span className="text-gray-400">+</span>
                                <input
                                    type="number"
                                    value={creditFeeInput}
                                    onChange={(e) => setCreditFeeInput(e.target.value)}
                                    placeholder="Crédito %"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm"
                                />
                                <button
                                    onClick={handleUseAverage}
                                    className="bg-blue-600 text-white font-semibold px-3 py-1 rounded-md text-sm hover:bg-blue-500 whitespace-nowrap"
                                >
                                    Usar Média
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4 text-sm space-y-2 text-gray-400">
                        <p><strong>Parâmetros Fixos:</strong></p>
                        <p>- Imposto sobre o serviço: {GOV_TAX_PERCENT}%</p>
                        <p>- Custo Fixo/Operacional estimado: {FIXED_COST_PERCENT}%</p>
                    </div>

                </div>

                {/* Results */}
                <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-3">
                        <TagIcon className="w-6 h-6" />
                        Análise de Lucratividade
                    </h3>

                    {results ? (
                        <div className="space-y-1">
                             <ResultRow
                                label="Receita Bruta"
                                value={`R$ ${results.revenue.toFixed(2).replace('.', ',')}`}
                                color="text-green-400"
                            />
                            <ResultRow
                                label={`Comissão (${commission || 0}%)`}
                                value={`- R$ ${results.commissionCost.toFixed(2).replace('.', ',')}`}
                                color="text-yellow-400"
                            />
                            <ResultRow
                                label={`Imposto (${GOV_TAX_PERCENT}%)`}
                                value={`- R$ ${results.taxCost.toFixed(2).replace('.', ',')}`}
                                color="text-orange-400"
                            />
                             <ResultRow
                                label={`Custo Fixo (${FIXED_COST_PERCENT}%)`}
                                value={`- R$ ${results.fixedCost.toFixed(2).replace('.', ',')}`}
                                color="text-orange-400"
                            />
                             <ResultRow
                                label={`Taxa do Cartão (${cardFee || 0}%)`}
                                value={`- R$ ${results.cardFeeCost.toFixed(2).replace('.', ',')}`}
                                color="text-orange-400"
                            />
                            <ResultRow
                                label="Custo de Material"
                                value={`- R$ ${results.materialCost.toFixed(2).replace('.', ',')}`}
                                color="text-orange-400"
                            />
                            
                            <ResultRow
                                label="Lucro Líquido do Salão"
                                value={`R$ ${results.netProfit.toFixed(2).replace('.', ',')}`}
                                color={results.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}
                                isTotal
                            />

                            <div className="text-center bg-gray-800 p-4 rounded-lg mt-4">
                                <p className="text-sm text-gray-400">Margem de Lucro Líquido</p>
                                <p className={`text-3xl font-bold ${results.netProfitPercent >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                    {results.netProfitPercent.toFixed(2).replace('.', ',')}%
                                </p>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center py-12 text-gray-500">
                            <p>Insira os valores para calcular a lucratividade.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServicePricingCalculator;
