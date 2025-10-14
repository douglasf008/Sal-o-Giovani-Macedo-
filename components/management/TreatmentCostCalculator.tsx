import React, { useState, useMemo, useEffect } from 'react';
import { useStock } from '../../contexts/StockContext';
import { StockItem } from '../../types';
import CalculatorIcon from '../icons/CalculatorIcon';

// Helper to parse size like "1L", "250ml", "60g"
const parseSize = (detail: string): { value: number; unit: string } | null => {
    const match = detail.match(/(\d+\.?\d*)\s*(ml|l|g|kg)/i);
    if (!match) return null;
    return {
        value: parseFloat(match[1]),
        unit: match[2].toLowerCase(),
    };
};

const ResultRow: React.FC<{ label: string; value: string; subtext?: string; color?: string; isBold?: boolean }> = ({ label, value, subtext, color = 'text-white', isBold = false }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-800">
        <div>
            <p className={`text-sm ${isBold ? 'font-semibold' : 'text-gray-400'}`}>{label}</p>
            {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
        <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
);


const TreatmentCostCalculator: React.FC = () => {
    const { stockItems } = useStock();
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [dosage, setDosage] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [commission, setCommission] = useState('45');
    const [productSearchTerm, setProductSearchTerm] = useState('');

    // State for manual/incomplete product data
    const [manualName, setManualName] = useState('');
    const [manualCost, setManualCost] = useState('');
    const [manualSize, setManualSize] = useState('');
    const [manualUnit, setManualUnit] = useState<'ml' | 'g' | 'l' | 'kg'>('ml');

    const treatmentProducts = useMemo(() => {
        return stockItems.filter(item => item.category.toLowerCase() !== 'revenda');
    }, [stockItems]);
    
    const filteredTreatmentProducts = useMemo(() => {
        if (!productSearchTerm) {
            return treatmentProducts;
        }
        return treatmentProducts.filter(product =>
            product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            product.detail.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
    }, [treatmentProducts, productSearchTerm]);

    const selectedProduct = useMemo(() => {
        return stockItems.find(item => item.id === selectedProductId);
    }, [selectedProductId, stockItems]);
    
    const needsManualInput = useMemo(() => {
        if (selectedProductId === 'manual') return true;
        if (!selectedProduct) return false;
        return !selectedProduct.cost || !parseSize(selectedProduct.detail);
    }, [selectedProductId, selectedProduct]);

    useEffect(() => {
        if (selectedProductId === 'manual') {
            setManualCost('');
            setManualSize('');
            setManualUnit('ml');
        } else if (selectedProduct) {
            setManualName(selectedProduct.name);
            setManualCost(selectedProduct.cost ? String(selectedProduct.cost) : '');
            const sizeInfo = parseSize(selectedProduct.detail);
            setManualSize(sizeInfo ? String(sizeInfo.value) : '');
            
            if (sizeInfo?.unit && ['ml', 'g', 'l', 'kg'].includes(sizeInfo.unit)) {
                setManualUnit(sizeInfo.unit as 'ml' | 'g' | 'l' | 'kg');
            } else {
                setManualUnit('ml');
            }
        }
    }, [selectedProduct, selectedProductId]);


    const productDetailsForCalc = useMemo(() => {
        if (!selectedProductId) return null;

        if (needsManualInput) {
            const cost = parseFloat(manualCost);
            const size = parseFloat(manualSize);
            const name = selectedProductId === 'manual' ? manualName : selectedProduct?.name;

            if (!name || isNaN(cost) || cost <= 0 || isNaN(size) || size <= 0) return null;
            return {
                name,
                cost,
                packageSize: size,
                packageUnit: manualUnit,
                detail: `${size}${manualUnit}`
            };
        }
        
        const sizeInfo = parseSize(selectedProduct!.detail);
        if (!selectedProduct || !selectedProduct.cost || !sizeInfo) return null;

        return {
            name: selectedProduct.name,
            cost: selectedProduct.cost,
            packageSize: sizeInfo.value,
            packageUnit: sizeInfo.unit,
            detail: selectedProduct.detail
        };

    }, [selectedProductId, needsManualInput, selectedProduct, manualName, manualCost, manualSize, manualUnit]);

    const calculationResults = useMemo(() => {
        if (!productDetailsForCalc || !dosage || !servicePrice || !commission) return null;

        const { cost: productCost, packageSize, packageUnit } = productDetailsForCalc;

        let standardizedPackageSize = packageSize;
        let standardizedUnit = packageUnit;
        
        if (standardizedUnit === 'l') {
            standardizedPackageSize *= 1000;
            standardizedUnit = 'ml';
        } else if (standardizedUnit === 'kg') {
            standardizedPackageSize *= 1000;
            standardizedUnit = 'g';
        }

        const dosageValue = parseFloat(dosage);
        const servicePriceValue = parseFloat(servicePrice);
        const commissionValue = parseFloat(commission);

        if (isNaN(dosageValue) || dosageValue <= 0 || isNaN(servicePriceValue) || servicePriceValue < 0 || isNaN(commissionValue) || commissionValue < 0) {
            return null;
        }

        const applicationsPerPackage = standardizedPackageSize / dosageValue;
        if (applicationsPerPackage <= 0 || !isFinite(applicationsPerPackage)) return null;

        const costPerApplication = productCost / applicationsPerPackage;
        const totalRevenue = applicationsPerPackage * servicePriceValue;
        const totalCommissionPaid = totalRevenue * (commissionValue / 100);
        const salonGrossProfit = totalRevenue - totalCommissionPaid;
        const salonNetProfit = salonGrossProfit - productCost;
        const profitPerApplication = salonNetProfit / applicationsPerPackage;

        return {
            applicationsPerPackage: applicationsPerPackage.toFixed(1),
            packageUnit: standardizedUnit,
            dosageUnit: standardizedUnit,
            costPerApplication: costPerApplication.toFixed(2),
            totalRevenue: totalRevenue.toFixed(2),
            totalCommissionPaid: totalCommissionPaid.toFixed(2),
            salonGrossProfit: salonGrossProfit.toFixed(2),
            salonNetProfit: salonNetProfit.toFixed(2),
            profitPerApplication: profitPerApplication.toFixed(2),
        };

    }, [productDetailsForCalc, dosage, servicePrice, commission]);


    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Calculadora de Custo de Tratamentos</h2>
                <p className="text-gray-400">Analise o custo e lucro de serviços que utilizam produtos do estoque.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Inputs */}
                <div className="bg-gray-900 p-6 rounded-lg space-y-6">
                    <div>
                        <label htmlFor="product-search" className="block text-sm font-medium text-gray-300 mb-2">1. Pesquise e Selecione o Produto</label>
                        <input
                            type="text"
                            id="product-search"
                            placeholder="Buscar produto pelo nome..."
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <select
                            id="product-select"
                            value={selectedProductId}
                            onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setProductSearchTerm(''); // Clear search on select
                            }}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            <option value="">{productSearchTerm && filteredTreatmentProducts.length === 0 ? 'Nenhum produto encontrado' : 'Escolha um produto...'}</option>
                            {filteredTreatmentProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.detail})
                                </option>
                            ))}
                        </select>
                         {productSearchTerm && filteredTreatmentProducts.length === 0 && (
                            <div className="text-center p-3 text-gray-500 border border-dashed border-gray-700 rounded-lg mt-2">
                                <p>Nenhum produto encontrado com "{productSearchTerm}".</p>
                                <button
                                    onClick={() => {
                                        setSelectedProductId('manual');
                                        setManualName(productSearchTerm);
                                        setProductSearchTerm(''); // Clear search
                                    }}
                                    className="mt-2 text-sm text-blue-400 font-semibold hover:text-blue-300"
                                >
                                    + Adicionar "{productSearchTerm}" manualmente
                                </button>
                            </div>
                        )}
                    </div>

                    {needsManualInput && selectedProductId && (
                        <div className="bg-gray-800 p-4 rounded-lg space-y-4 border border-dashed border-gray-600">
                             <h4 className="font-semibold text-gray-300">
                                {selectedProductId === 'manual' ? "Informações do Novo Produto" : "Complete as Informações do Produto"}
                            </h4>
                            {selectedProductId === 'manual' && (
                                <div>
                                    <label htmlFor="manual-name" className="block text-sm text-gray-400 mb-1">Nome do Produto</label>
                                    <input type="text" id="manual-name" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" placeholder="Nome do produto"/>
                                </div>
                            )}
                            <div>
                                <label htmlFor="manual-cost" className="block text-sm text-gray-400 mb-1">Custo do Pacote (R$)</label>
                                <input type="number" id="manual-cost" value={manualCost} onChange={e => setManualCost(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" placeholder="Ex: 90.00"/>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <label htmlFor="manual-size" className="block text-sm text-gray-400 mb-1">Tamanho do Pacote</label>
                                    <input type="number" id="manual-size" value={manualSize} onChange={e => setManualSize(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" placeholder="Ex: 1000"/>
                                </div>
                                <div>
                                     <label htmlFor="manual-unit" className="block text-sm text-gray-400 mb-1">Unidade</label>
                                     <select id="manual-unit" value={manualUnit} onChange={e => setManualUnit(e.target.value as 'ml'|'g'|'l'|'kg')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 h-[42px]">
                                        <option value="ml">ml</option>
                                        <option value="g">g</option>
                                        <option value="l">L</option>
                                        <option value="kg">kg</option>
                                     </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {productDetailsForCalc && (
                         <div className="bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-semibold">{productDetailsForCalc.name}</h4>
                            <p className="text-sm text-gray-400">
                                Custo do Pacote ({productDetailsForCalc.detail}): <span className="font-bold text-white">R$ {productDetailsForCalc.cost.toFixed(2).replace('.', ',')}</span>
                            </p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="dosage" className="block text-sm font-medium text-gray-300 mb-2">2. Dosagem por Atendimento</label>
                        <div className="relative">
                            <input
                                type="number"
                                id="dosage"
                                value={dosage}
                                onChange={(e) => setDosage(e.target.value)}
                                disabled={!productDetailsForCalc}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                                placeholder="Ex: 20"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                                {productDetailsForCalc?.packageUnit.replace('l', 'ml').replace('kg', 'g') || 'unid'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="service-price" className="block text-sm font-medium text-gray-300 mb-2">3. Preço do Serviço</label>
                            <input
                                type="number"
                                id="service-price"
                                value={servicePrice}
                                onChange={(e) => setServicePrice(e.target.value)}
                                disabled={!productDetailsForCalc}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                                placeholder="R$"
                            />
                        </div>
                         <div>
                            <label htmlFor="commission" className="block text-sm font-medium text-gray-300 mb-2">4. Comissão</label>
                            <input
                                type="number"
                                id="commission"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                                disabled={!productDetailsForCalc}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                                placeholder="%"
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-3">
                        <CalculatorIcon className="w-6 h-6" />
                        Resultados da Análise
                    </h3>
                    {calculationResults ? (
                        <div className="space-y-2">
                             <ResultRow
                                label="Aplicações por Pacote"
                                value={`${calculationResults.applicationsPerPackage.replace('.',',')} atendimentos`}
                            />
                            <ResultRow
                                label="Custo da Dose (Material por Aplicação)"
                                subtext="Este é o valor de custo do produto para cobrar do funcionário."
                                value={`R$ ${calculationResults.costPerApplication.replace('.',',')}`}
                                color="text-red-400"
                            />
                            <div className="pt-4 mt-4 border-t border-gray-700">
                                <h4 className="font-semibold text-gray-400 text-sm mb-2">Projeção por Pacote (baseado em {calculationResults.applicationsPerPackage.replace('.',',')} atendimentos)</h4>
                                <ResultRow
                                    label="Receita Bruta Total"
                                    value={`R$ ${calculationResults.totalRevenue.replace('.',',')}`}
                                    color="text-green-400"
                                />
                                <ResultRow
                                    label="Total de Comissão Paga"
                                    value={`- R$ ${calculationResults.totalCommissionPaid.replace('.',',')}`}
                                    color="text-yellow-400"
                                />
                                <ResultRow
                                    label="Lucro Bruto do Salão"
                                    subtext="(Receita - Comissão)"
                                    value={`R$ ${calculationResults.salonGrossProfit.replace('.',',')}`}
                                    color="text-blue-400"
                                />
                                <ResultRow
                                    label="Lucro Líquido Final"
                                    subtext="(Lucro Bruto - Custo do Produto)"
                                    value={`R$ ${calculationResults.salonNetProfit.replace('.',',')}`}
                                    color={parseFloat(calculationResults.salonNetProfit) >= 0 ? 'text-green-400' : 'text-red-400'}
                                    isBold={true}
                                />
                                <ResultRow
                                    label="Lucro por Seção"
                                    subtext="(Líquido Final / Nº de Aplicações)"
                                    value={`R$ ${calculationResults.profitPerApplication.replace('.', ',')}`}
                                    color={parseFloat(calculationResults.profitPerApplication) >= 0 ? 'text-green-400' : 'text-red-400'}
                                    isBold={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>Preencha todos os campos para ver a análise de custo e lucro.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TreatmentCostCalculator;