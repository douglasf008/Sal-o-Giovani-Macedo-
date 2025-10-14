import React, { useState, useMemo, useEffect, useCallback } from 'react';
import TrashIcon from '../icons/TrashIcon';
import PlusIcon from '../icons/PlusIcon';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';
import { useStock } from '../../contexts/StockContext';
import { useClients } from '../../contexts/ClientsContext';
import { Client, Professional, Service, ServicePackageTemplate, StockItem } from '../../types';
import SparklesIcon from '../icons/SparklesIcon';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import BeakerIcon from '../icons/BeakerIcon';
import { GoogleGenAI } from '@google/genai';

interface SavedMixFormula {
    id: string;
    name: string;
    productType: 'coloração' | 'tonalizante';
    targetTone: string;
    rows: { baseValue: string, grams: string }[];
    createdAt: string;
}

// --- Module 1: Formula Mixer ---
const FormulaMixerModule: React.FC<{
    onTransfer: (formula: { productType: 'coloração' | 'tonalizante'; rows: { stockId: string; grams: string }[] }) => void;
}> = ({ onTransfer }) => {
    const { stockItems } = useStock();
    const [productType, setProductType] = useState<'coloração' | 'tonalizante'>('coloração');
    const [targetTone, setTargetTone] = useState('');
    const [mixRows, setMixRows] = useState<{ id: number, stockId: string, grams: string }[]>([
        { id: Date.now(), stockId: '', grams: '' },
        { id: Date.now() + 1, stockId: '', grams: '' },
    ]);
    const [suggestionMessage, setSuggestionMessage] = useState<{ type: 'info' | 'error', text: string } | null>(null);
    const [suggestionTotalMix, setSuggestionTotalMix] = useState('60');

    const availableBases = useMemo(() => {
        const colorRegex = /\b(\d{1,2}(?:\.\d{1,2})?)\b/;
        const bases = stockItems
            .filter(item => item.category.toLowerCase() === productType)
            .map(item => {
                const match = item.detail.match(colorRegex) || item.name.match(colorRegex);
                if (match) {
                    return {
                        id: item.id,
                        name: item.name,
                        value: match[1],
                        brand: item.brand || 'Sem Marca'
                    };
                }
                return null;
            })
            .filter((item): item is { id: string; name: string; value: string; brand: string } => item !== null);

        // Sort but keep brand variations
        return bases.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
    }, [stockItems, productType]);

    useEffect(() => {
        setMixRows([
            { id: Date.now(), stockId: '', grams: '' },
            { id: Date.now() + 1, stockId: '', grams: '' }
        ]);
        setSuggestionMessage(null);
    }, [productType]);

    const handleAddRow = () => {
        if (mixRows.length < 6) {
            setMixRows(prev => [...prev, { id: Date.now(), stockId: '', grams: '' }]);
        }
    };

    const handleRemoveRow = (id: number) => {
        if (mixRows.length > 2) {
            setMixRows(prev => prev.filter(row => row.id !== id));
        }
    };

    const handleRowChange = (id: number, field: 'stockId' | 'grams', value: string) => {
        setMixRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
        setSuggestionMessage(null); // Clear suggestion message on manual change
    };

    const calculationResult = useMemo(() => {
        const validRows = mixRows.filter(row => row.stockId && parseFloat(row.grams) > 0);
        if (validRows.length === 0) {
            return null;
        }

        const colorRegex = /Cor:\s*(\d{1,2})\.?(\d*)/;

        const sums = validRows.reduce((acc, row) => {
            const grams = parseFloat(row.grams);
            const product = stockItems.find(p => p.id === row.stockId);
            if (!product) return acc;

            const match = product.detail.match(colorRegex);
            if (!match) return acc;
            
            const baseValueStr = match[1];
            const nuanceValueStr = match[2] || '';
            
            const baseValue = parseFloat(baseValueStr) || 0;
            const nuanceValue = parseInt(nuanceValueStr, 10) || 0;


            acc.totalGrams += grams;
            acc.weightedBaseSum += baseValue * grams;
            acc.weightedNuanceSum += nuanceValue * grams;
            
            return acc;
        }, { totalGrams: 0, weightedBaseSum: 0, weightedNuanceSum: 0 });

        if (sums.totalGrams === 0) {
            return null;
        }

        const finalBase = sums.weightedBaseSum / sums.totalGrams;
        const finalNuance = sums.weightedNuanceSum / sums.totalGrams;
        
        const baseInt = Math.round(finalBase);
        const nuanceInt = Math.round(finalNuance);
        
        let finalToneString: string;
        let finalToneNumeric: number;
        
        if (nuanceInt > 0) {
            finalToneString = `${baseInt}.${nuanceInt}`;
            finalToneNumeric = parseFloat(finalToneString);
        } else {
            finalToneString = `${baseInt}.0`;
            finalToneNumeric = baseInt;
        }

        return { totalGrams: sums.totalGrams, finalToneString, finalToneNumeric };
    }, [mixRows, stockItems]);
    
    const handleSuggestProportions = () => {
        const target = parseFloat(targetTone);
        
        const colorRegex = /\b(\d{1,2}(?:\.\d{1,2})?)\b/;
        const getBaseValueFromStockId = (stockId: string): number => {
            const product = stockItems.find(p => p.id === stockId);
            if (!product) return NaN;
            const match = product.detail.match(colorRegex) || product.name.match(colorRegex);
            return match ? parseFloat(match[1]) : NaN;
        };
        
        const selectedBases = mixRows
            .map(row => getBaseValueFromStockId(row.stockId))
            .filter(val => !isNaN(val))
            .sort((a, b) => a - b);
        
        if (isNaN(target)) {
            setSuggestionMessage({ type: 'error', text: "Defina um Tom Alvo para receber a sugestão."});
            return;
        }

        let darkerBase = -Infinity;
        let lighterBase = Infinity;

        selectedBases.forEach(base => {
            if (base <= target && base > darkerBase) darkerBase = base;
            if (base >= target && base < lighterBase) lighterBase = base;
        });
        
        if (!isFinite(darkerBase) || !isFinite(lighterBase) || darkerBase === lighterBase) {
            setSuggestionMessage({ type: 'error', text: "Não é possível atingir o alvo. Selecione cores acima e abaixo do tom desejado."});
            return;
        }
        
        const totalMix = parseFloat(suggestionTotalMix) || 60;
        const gramsLighter = ((target - darkerBase) / (lighterBase - darkerBase)) * totalMix;
        const gramsDarker = totalMix - gramsLighter;

        const newMixRows = mixRows.map(row => {
            const rowBase = getBaseValueFromStockId(row.stockId);
            if (isNaN(rowBase)) return { ...row, grams: '' };

            // Using a small epsilon for floating point comparison
            if (Math.abs(rowBase - darkerBase) < 0.001) return { ...row, grams: gramsDarker.toFixed(1) };
            if (Math.abs(rowBase - lighterBase) < 0.001) return { ...row, grams: gramsLighter.toFixed(1) };
            return { ...row, grams: '' }; // Clear other fields
        });

        setMixRows(newMixRows);
        setSuggestionMessage({ type: 'info', text: `Sugestão calculada para ${totalMix}g de mistura total.`});
    };
    
    const handleSendToClientFormula = () => {
        const validRows = mixRows.filter(r => r.stockId && r.grams);
        if (validRows.length > 0) {
            onTransfer({
                productType,
                rows: validRows.map(({ stockId, grams }) => ({ stockId, grams })),
            });
        } else {
            alert("Adicione pelo menos um produto à mistura para poder enviar.");
        }
    };

    const canSuggest = useMemo(() => {
        const hasTarget = !!targetTone && !isNaN(parseFloat(targetTone));
        const hasBases = mixRows.filter(row => !!row.stockId).length >= 2;
        const hasGrams = mixRows.some(row => !!row.grams);
        return hasTarget && hasBases && !hasGrams;
    }, [targetTone, mixRows]);

    return (
        <section className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-blue-300">Mixer de Fórmulas</h3>
            <p className="text-sm text-gray-400 mb-6">Misture múltiplas bases do seu estoque e veja o resultado em tempo real. Adicione um tom alvo para comparar ou deixe que a calculadora sugira as proporções.</p>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">1. Tipo de Produto</label>
                    <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                        <button onClick={() => setProductType('coloração')} className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${productType === 'coloração' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            Coloração
                        </button>
                        <button onClick={() => setProductType('tonalizante')} className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${productType === 'tonalizante' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            Tonalizante
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="target-tone" className="block text-sm font-medium text-gray-300 mb-2">2. Tom Alvo (Opcional)</label>
                    <input type="number" id="target-tone" value={targetTone} onChange={(e) => setTargetTone(e.target.value)} placeholder="Ex: 5.0 (Necessário para sugestão)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">3. Componentes da Mistura</label>
                    <div className="space-y-2">
                        {mixRows.map((row, index) => (
                            <div key={row.id} className="grid grid-cols-[1fr,100px,auto] gap-2 items-center">
                                <select value={row.stockId} onChange={e => handleRowChange(row.id, 'stockId', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                                    <option value="">Selecione a base...</option>
                                    {availableBases.map(base => <option key={base.id} value={base.id} title={`${base.name} (${base.brand})`}>{base.value} ({base.brand})</option>)}
                                </select>
                                <input type="number" value={row.grams} onChange={e => handleRowChange(row.id, 'grams', e.target.value)} placeholder="Qtd (g)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                                <button onClick={() => handleRemoveRow(row.id)} disabled={mixRows.length <= 2} className="p-2 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row justify-between items-end gap-4">
                        <button onClick={handleAddRow} disabled={mixRows.length >= 6} className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed self-start sm:self-end">
                            <PlusIcon className="w-4 h-4" /> Adicionar Cor
                        </button>
                        <div className="flex items-end gap-2 w-full sm:w-auto">
                            <div className="flex-grow">
                                <label htmlFor="suggestion-total" className="block text-xs font-medium text-gray-400 mb-1">Total da Mistura</label>
                                <input 
                                    type="number"
                                    id="suggestion-total"
                                    value={suggestionTotalMix}
                                    onChange={(e) => setSuggestionTotalMix(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    placeholder="g"
                                />
                            </div>
                            <button 
                                onClick={handleSuggestProportions}
                                disabled={!canSuggest}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors h-[42px] flex-shrink-0"
                            >
                               <SparklesIcon className="w-5 h-5"/> Sugerir
                            </button>
                        </div>
                    </div>
                     {suggestionMessage && (
                        <p className={`text-xs text-center mt-3 font-semibold ${suggestionMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                            {suggestionMessage.text}
                        </p>
                    )}
                </div>
            </div>

            {calculationResult && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-center">
                        <div>
                            <p className="text-sm text-gray-400">Tom e Nuance Final</p>
                            <p className="text-2xl font-bold text-green-400">{calculationResult.finalToneString.replace('.',',')}</p>
                        </div>
                        {targetTone && (
                             <div>
                                <p className="text-sm text-gray-400">Diferença do Alvo</p>
                                <p className={`text-2xl font-bold ${Math.abs(calculationResult.finalToneNumeric - parseFloat(targetTone)) < 0.01 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {(calculationResult.finalToneNumeric - parseFloat(targetTone)).toFixed(2).replace('.',',')}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-400">Quantidade Total</p>
                            <p className="text-2xl font-bold">{calculationResult.totalGrams.toFixed(1).replace('.',',')}g</p>
                        </div>
                    </div>
                     <div className="mt-4 pt-4 border-t border-gray-700">
                        <button 
                            onClick={handleSendToClientFormula} 
                            disabled={!calculationResult}
                            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg text-base hover:bg-purple-500 transition-colors disabled:bg-gray-700 disabled:text-gray-500"
                        >
                            Enviar para Ficha do Cliente
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};


// --- Module 2: Rule of 11 ---
const TONE_INFO: { [key: number]: { fc: string; neutralizer: string } } = {
    10: { fc: 'Amarelo-Claríssimo (Pálido)', neutralizer: 'Violeta (.2)' },
    9: { fc: 'Amarelo-Muito-Claro', neutralizer: 'Violeta (.2)' },
    8: { fc: 'Amarelo', neutralizer: 'Violeta (.2)' },
    7: { fc: 'Laranja-Amarelado', neutralizer: 'Azul (.1) e Violeta (.2)' },
    6: { fc: 'Laranja', neutralizer: 'Azul (.1)' },
    5: { fc: 'Vermelho-Alaranjado', neutralizer: 'Azul (.1) e Verde (Mate)' },
    4: { fc: 'Vermelho', neutralizer: 'Verde (Mate)' },
};

const RuleOf11Module: React.FC = () => {
    const [toneH, setToneH] = useState('8');
    const [baseAmount, setBaseAmount] = useState('60');
    const [result, setResult] = useState<{ amount: number } | string | null>(null);

    const handleCalculateMix = () => {
        const h = parseInt(toneH, 10);
        const base = parseFloat(baseAmount);

        if (isNaN(h) || h < 4 || h > 10) {
            setResult("Selecione uma altura de tom válida.");
            return;
        }
        if (isNaN(base) || base <= 0) {
            setResult("Insira uma quantidade de coloração base válida.");
            return;
        }

        const correctorFor60g = 11 - h;
        const amount = (base / 60) * correctorFor60g;
        setResult({ amount });
    };

    const selectedToneInfo = TONE_INFO[parseInt(toneH, 10)];

    return (
        <section className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-teal-300">Correção e Nuance (Regra do 11)</h3>
            <p className="text-sm text-gray-400 mb-6">Calcule a quantidade correta de Mix/Corretor (em gramas) para neutralizar o Fundo de Clareamento (FC).</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="tone-h" className="block text-sm font-medium text-gray-300 mb-2">1. Qual é a Altura do Tom Aplicado?</label>
                    <select id="tone-h" value={toneH} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setToneH(e.currentTarget.value); setResult(null); }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        {Object.keys(TONE_INFO).map(Number).sort((a,b) => b-a).map(tone => (
                            <option key={tone} value={tone}>Tom {tone}.0</option>
                        ))}
                    </select>
                </div>
                {selectedToneInfo && (
                    <div className="bg-gray-800 p-3 rounded-md text-sm">
                        <p><span className="text-gray-400">Fundo de Clareamento (FC):</span> <span className="font-semibold">{selectedToneInfo.fc}</span></p>
                        <p><span className="text-gray-400">Corretor Necessário:</span> <span className="font-semibold">{selectedToneInfo.neutralizer}</span></p>
                    </div>
                )}
                <div>
                    <label htmlFor="base-amount" className="block text-sm font-medium text-gray-300 mb-2">2. Quantidade de Coloração Base (g)</label>
                    <input 
                        type="number" 
                        id="base-amount" 
                        value={baseAmount} 
                        onChange={e => { setBaseAmount(e.target.value); setResult(null); }} 
                        placeholder="Ex: 60" 
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" 
                    />
                </div>
                <button onClick={handleCalculateMix} className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg text-base hover:bg-teal-500 transition-colors">
                    CALCULAR MIX E CORRETOR
                </button>
            </div>
             {result && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
                    {typeof result === 'string' ? (
                        <p className="text-red-400">{result}</p>
                    ) : (
                        <div>
                             <p className="text-gray-300 mb-2">Para neutralizar o fundo de clareamento no tom <span className="font-bold text-white">{toneH}.0</span>:</p>
                            <p className="text-2xl font-bold text-green-400">
                                Use {result.amount.toFixed(1).replace('.',',')}g de corretor
                            </p>
                             <p className="text-gray-400 text-sm">para cada {baseAmount}g de coloração base.</p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};


// --- Module 3: OX Mixing ---
const OxMixingModule: React.FC = () => {
    const [oxX, setOxX] = useState(''); // Desired
    const [oxA, setOxA] = useState(''); // Weaker
    const [oxB, setOxB] = useState(''); // Stronger
    const [result, setResult] = useState<{ gramsA: number, gramsB: number } | string | null>(null);

    const handleCalculateOx = () => {
        const x = parseFloat(oxX);
        const a = parseFloat(oxA);
        const b = parseFloat(oxB);

        if (isNaN(x) || isNaN(a) || isNaN(b)) {
            setResult("Por favor, insira volumes numéricos válidos.");
            return;
        }

        if (a >= b) {
            setResult("O OX mais fraco deve ter um volume menor que o mais forte.");
            return;
        }

        if (x < a || x > b) {
            setResult("O OX desejado deve ter um volume entre o mais fraco e o mais forte.");
            return;
        }
        
        // Formula for 100g total mixture
        const gramsA = ((b - x) / (b - a)) * 100;
        const gramsB = ((x - a) / (b - a)) * 100;

        setResult({ gramsA, gramsB });
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-cyan-300">Mistura de Água Oxigenada (OX)</h3>
            <p className="text-sm text-gray-400 mb-6">Calcule a proporção exata para misturar dois volumes diferentes e obter o resultado desejado.</p>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="ox-x" className="block text-sm font-medium text-gray-300 mb-2">1. Qual Volume de OX Você Deseja Criar?</label>
                    <input type="number" id="ox-x" value={oxX} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOxX(e.currentTarget.value)} placeholder="Ex: 30" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">2. Quais Volumes de OX Você Tem para Misturar?</label>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={oxA} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOxA(e.currentTarget.value)} placeholder="OX mais fraco (Ex: 20)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <input type="number" value={oxB} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOxB(e.currentTarget.value)} placeholder="OX mais forte (Ex: 40)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                </div>
                <button onClick={handleCalculateOx} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-lg text-base hover:bg-cyan-500 transition-colors">
                    CALCULAR MISTURA DE OX
                </button>
            </div>
            {result && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
                    {typeof result === 'string' ? (
                        <p className="text-red-400">{result}</p>
                    ) : (
                        <div>
                            <p className="text-gray-300 mb-2">Para criar <span className="font-bold text-white">100g</span> de OX com <span className="font-bold text-white">{oxX} volumes</span>, misture:</p>
                            <p className="text-2xl font-bold text-green-400">
                                {result.gramsA.toFixed(1).replace('.',',')}g <span className="text-lg text-gray-300">de OX {oxA}vol</span> + {result.gramsB.toFixed(1).replace('.',',')}g <span className="text-lg text-gray-300">de OX {oxB}vol</span>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

// --- Module 4: Bleaching Powder ---
const BleachingPowderModule: React.FC = () => {
    const [powderAmount, setPowderAmount] = useState('');
    const [ratio, setRatio] = useState('2'); // Default to 1:2
    const [result, setResult] = useState<{ oxAmount: number; totalMix: number } | null>(null);

    const handleCalculate = () => {
        const powder = parseFloat(powderAmount);
        const ratioValue = parseFloat(ratio);
        if (isNaN(powder) || powder <= 0) {
            alert("Insira uma quantidade válida de pó descolorante.");
            return;
        }

        const oxAmount = powder * ratioValue;
        const totalMix = powder + oxAmount;
        setResult({ oxAmount, totalMix });
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-yellow-300">Calculadora de Descolorante</h3>
            <p className="text-sm text-gray-400 mb-6">Calcule a quantidade de OX para a sua mistura de pó descolorante.</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="powder-amount" className="block text-sm font-medium text-gray-300 mb-2">1. Quantidade de Pó Descolorante (g)</label>
                    <input type="number" id="powder-amount" value={powderAmount} onChange={e => setPowderAmount(e.target.value)} placeholder="Ex: 50" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">2. Proporção da Mistura (Pó : OX)</label>
                    <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                        {['1', '1.5', '2', '3'].map(ratioValue => (
                            <button key={ratioValue} onClick={() => setRatio(ratioValue)} className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${ratio === ratioValue ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                                1 : {ratioValue.replace('.', ',')}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={handleCalculate} className="w-full bg-yellow-600 text-white font-bold py-3 rounded-lg text-base hover:bg-yellow-500 transition-colors">
                    CALCULAR MISTURA
                </button>
            </div>

            {result && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
                    <div>
                        <p className="text-gray-300 mb-2">Para <span className="font-bold text-white">{powderAmount}g</span> de pó na proporção <span className="font-bold text-white">1:{ratio.replace('.',',')}</span>, use:</p>
                        <p className="text-2xl font-bold text-green-400">
                            {result.oxAmount.toFixed(1).replace('.',',')}ml de OX
                        </p>
                        <p className="text-gray-400 text-sm mt-2">Total da mistura: {result.totalMix.toFixed(1).replace('.',',')}g</p>
                    </div>
                </div>
            )}
        </section>
    );
};

// --- Module 5: OX Proportion ---
const OxProportionModule: React.FC = () => {
    const [colorAmounts, setColorAmounts] = useState([{ id: 1, value: '' }]);
    const [ratio, setRatio] = useState('1.5');
    const [result, setResult] = useState<{ oxAmount: number; totalColor: number } | string | null>(null);

    const handleAddColor = () => {
        setColorAmounts(prev => [...prev, { id: Date.now(), value: '' }]);
    };

    const handleRemoveColor = (id: number) => {
        if (colorAmounts.length > 1) {
            setColorAmounts(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleColorChange = (id: number, value: string) => {
        setColorAmounts(prev => prev.map(item => item.id === id ? { ...item, value } : item));
    };

    const handleCalculate = () => {
        const totalColor = colorAmounts.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
        
        if (totalColor <= 0) {
            setResult("Por favor, insira uma quantidade válida de coloração.");
            return;
        }

        const ratioValue = parseFloat(ratio);
        const oxAmount = totalColor * ratioValue;
        setResult({ oxAmount, totalColor });
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-indigo-300">Cálculo de Proporção de OX</h3>
            <p className="text-sm text-gray-400 mb-6">Calcule a quantidade de OX necessária para a sua mistura de coloração.</p>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">1. Quantidade de Coloração (g)</label>
                    <div className="space-y-2">
                        {colorAmounts.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={item.value} 
                                    onChange={(e) => handleColorChange(item.id, e.target.value)} 
                                    placeholder={`Coloração ${index + 1} (g)`}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={() => handleRemoveColor(item.id)}
                                    disabled={colorAmounts.length === 1}
                                    className="p-2 bg-red-800/50 text-red-400 rounded-lg hover:bg-red-800/80 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddColor} className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300">
                        <PlusIcon className="w-5 h-5" />
                        Adicionar outra coloração
                    </button>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">2. Proporção da Mistura</label>
                    <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setRatio('1.5')} 
                            className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${ratio === '1.5' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        >
                            1 : 1,5
                        </button>
                        <button 
                            onClick={() => setRatio('2')} 
                            className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${ratio === '2' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        >
                            1 : 2
                        </button>
                    </div>
                </div>

                <button onClick={handleCalculate} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg text-base hover:bg-indigo-500 transition-colors">
                    CALCULAR OX NECESSÁRIO
                </button>
            </div>
            {result !== null && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
                    {typeof result === 'string' ? (
                        <p className="text-red-400">{result}</p>
                    ) : (
                        <div>
                            <p className="text-gray-300 mb-2">Para <span className="font-bold text-white">{result.totalColor}g</span> de coloração (total) na proporção <span className="font-bold text-white">1:{ratio.replace('.',',')}</span>, você precisará de:</p>
                            <p className="text-2xl font-bold text-green-400">
                                {result.oxAmount.toFixed(1).replace('.',',')}ml de OX
                            </p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

// --- Module 6: Gemini Mixer ---
const GeminiMixerModule: React.FC<{
    onTransfer: (formula: { productType: 'coloração' | 'tonalizante'; rows: { stockId: string; grams: string }[] }) => void;
}> = ({ onTransfer }) => {
    const { stockItems } = useStock();
    const [targetColor, setTargetColor] = useState('');
    const [productType, setProductType] = useState<'coloração' | 'tonalizante'>('coloração');
    const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ formula: { colorCode: string; grams: number }[]; explanation: string; isPossible: boolean } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const availableColors = useMemo(() => {
        const colorRegex = /\b(\d{1,2}(?:\.\d{1,2})?)\b/;
        const colors = stockItems
            .filter(item => item.category.toLowerCase() === productType)
            .map(item => {
                const match = item.detail.match(colorRegex) || item.name.match(colorRegex);
                return {
                    id: item.id,
                    name: item.name,
                    code: match ? match[1] : null,
                    brand: item.brand || 'N/A'
                };
            })
            .filter((item): item is {id: string; name: string; code: string; brand: string} => item.code !== null)
            .sort((a, b) => parseFloat(a.code!) - parseFloat(b.code!));
        return colors;
    }, [stockItems, productType]);
    
    useEffect(() => {
        setSelectedStockIds([]);
        setResult(null);
        setError(null);
    }, [productType]);

    const handleToggleColor = (id: string) => {
        setSelectedStockIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCalculate = async () => {
        if (!targetColor) {
            setError("Por favor, descreva a cor alvo.");
            return;
        }
        if (selectedStockIds.length < 2) {
            setError("Selecione pelo menos duas cores disponíveis para a mistura.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        const selectedColors = availableColors.filter(c => selectedStockIds.includes(c.id));
        const availableColorsText = selectedColors.map(c => `- ${c.code} (${c.brand})`).join('\n');

        const prompt = `
            Você é um assistente de IA colorista de cabelo de classe mundial. Sua tarefa é criar uma fórmula de coloração precisa para alcançar uma cor de cabelo alvo usando um conjunto específico de tubos de coloração disponíveis.

            **Instruções:**
            1. Analise a 'Cor Alvo' desejada pelo usuário.
            2. Analise a lista de 'Cores Disponíveis' fornecida, que inclui seus códigos de cor e marcas.
            3. Crie uma fórmula de mistura usando apenas as 'Cores Disponíveis'.
            4. A fórmula deve ser baseada em uma mistura total padrão de 60 gramas. A soma de todas as partes de cor na sua fórmula sugerida deve ser igual a 60g.
            5. Forneça a mistura em proporções (gramas) para cada cor selecionada.
            6. Forneça uma explicação breve e profissional para a sua mistura escolhida, referenciando princípios de colorimetria (como neutralização ou realce de tons).
            7. Se a cor alvo for impossível de alcançar com as cores selecionadas, explique por que e sugira quais outras bases de cor podem ser necessárias.

            **Formato de Saída:**
            Responda APENAS com um objeto JSON válido com a seguinte estrutura. Não adicione nenhum texto, formatação markdown ou quaisquer caracteres antes ou depois do objeto JSON.

            {
              "formula": [
                {
                  "colorCode": "[Código da Cor do produto, ex: '7.1']",
                  "grams": "[Número de gramas, ex: 45]"
                },
                {
                  "colorCode": "[Código da Cor de outro produto, ex: '8.3']",
                  "grams": "[Número de gramas, ex: 15]"
                }
              ],
              "explanation": "[Sua explicação profissional aqui.]",
              "isPossible": "[true ou false]"
            }

            **Solicitação do Usuário:**
            - Cor Alvo: "${targetColor}"
            - Cores Disponíveis (${productType}):
            ${availableColorsText}
        `;

        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                 config: {
                    responseMimeType: "application/json",
                },
            });
            
            const jsonText = response.text.trim();
            const parsedResult = JSON.parse(jsonText);
            setResult(parsedResult);
        } catch (error) {
            console.error("Error calling Gemini API or parsing response", error);
            setError("Ocorreu um erro ao calcular com a IA. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseInFormula = () => {
        if (!result) return;
        
        const rows = result.formula.map(f => {
            const color = availableColors.find(c => c.code === f.colorCode);
            return {
                stockId: color ? color.id : '',
                grams: String(f.grams)
            };
        }).filter(r => r.stockId);

        if (rows.length > 0) {
            onTransfer({
                productType: productType,
                rows,
            });
        }
    };
    
    return (
        <section className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-rose-300">Mixer Inteligente (IA)</h3>
            <p className="text-sm text-gray-400 mb-6">Descreva a cor desejada, selecione as cores que você tem em estoque e deixe a IA criar a fórmula perfeita.</p>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="target-color-ai" className="block text-sm font-medium text-gray-300 mb-2">1. Cor Alvo</label>
                    <input type="text" id="target-color-ai" value={targetColor} onChange={e => setTargetColor(e.target.value)} placeholder="Ex: Loiro bege acinzentado na altura de 7" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">2. Cores Disponíveis no Estoque</label>
                    <div className="flex gap-2 bg-gray-800 p-1 rounded-lg mb-2">
                        <button onClick={() => setProductType('coloração')} className={`w-full py-1.5 rounded-md text-xs font-semibold transition-colors ${productType === 'coloração' ? 'bg-rose-600/80 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            Coloração
                        </button>
                        <button onClick={() => setProductType('tonalizante')} className={`w-full py-1.5 rounded-md text-xs font-semibold transition-colors ${productType === 'tonalizante' ? 'bg-rose-600/80 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            Tonalizante
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-800 rounded-lg">
                        {availableColors.map(color => (
                            <button
                                key={color.id}
                                onClick={() => handleToggleColor(color.id)}
                                className={`p-2 rounded-md text-sm text-left transition-colors ${selectedStockIds.includes(color.id) ? 'bg-rose-600/80 text-white ring-2 ring-rose-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                <span className="font-bold">{color.code}</span>
                                <span className="block text-xs truncate opacity-80" title={color.name}>{color.brand}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={handleCalculate} disabled={isLoading || !targetColor || selectedStockIds.length < 2} className="w-full mt-6 bg-rose-600 text-white font-bold py-3 rounded-lg text-base hover:bg-rose-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isLoading ? 'Calculando...' : <> <SparklesIcon className="w-5 h-5"/> Calcular com IA</> }
            </button>
            
            {error && <p className="text-center text-red-400 mt-4">{error}</p>}
            
            {result && !isLoading && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-4">
                    <h4 className="font-bold text-lg">Sugestão da IA</h4>
                    {result.isPossible ? (
                        <div className="bg-green-900/50 p-3 rounded-md">
                            <p className="font-semibold text-green-300">Fórmula Sugerida:</p>
                            <ul className="list-disc list-inside text-white">
                                {result.formula.map((f, i) => (
                                    <li key={i}>{f.grams}g de {f.colorCode}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                         <div className="bg-yellow-900/50 p-3 rounded-md">
                             <p className="font-semibold text-yellow-300">Alvo não é possível com as cores selecionadas.</p>
                         </div>
                    )}
                    <div>
                        <p className="font-semibold text-gray-300">Explicação:</p>
                        <p className="text-sm text-gray-400 leading-relaxed">{result.explanation}</p>
                    </div>
                    {result.isPossible && (
                        <button 
                            onClick={handleUseInFormula} 
                            className="w-full mt-2 bg-purple-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <BeakerIcon className="w-5 h-5"/>
                            Usar na Ficha do Cliente
                        </button>
                    )}
                </div>
            )}
        </section>
    );
};

// --- Module 7: Client Formula ---
interface ColorRow {
    id: number;
    stockId: string;
    grams: string;
}

interface FormulaToLoad {
    productType: 'coloração' | 'tonalizante';
    rows: { stockId: string; grams: string }[];
}

interface ClientFormulaModuleProps {
    formulaToLoad: FormulaToLoad | null;
    onFormulaLoaded: () => void;
}

const ClientFormulaModule: React.FC<ClientFormulaModuleProps> = ({
    formulaToLoad,
    onFormulaLoaded,
}) => {
    const { clients, updateClient } = useClients();
    const { stockItems } = useStock();
    const { professionals, updateProfessional } = useProfessionals();

    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [clientSearch, setClientSearch] = useState('');
    const [formulaName, setFormulaName] = useState('');
    const [productTypeForFormula, setProductTypeForFormula] = useState<'coloração' | 'tonalizante'>('coloração');
    const [colorRows, setColorRows] = useState<ColorRow[]>([{ id: Date.now(), stockId: '', grams: '' }]);
    const [oxVolume, setOxVolume] = useState('20');
    const [oxRatio, setOxRatio] = useState('1.5');
    const [additives, setAdditives] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [aiPrediction, setAiPrediction] = useState<{ predictedColorName: string; explanation: string } | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictionError, setPredictionError] = useState<string | null>(null);
    
    useEffect(() => {
        if (formulaToLoad) {
            setProductTypeForFormula(formulaToLoad.productType);
            setColorRows(formulaToLoad.rows.map(row => ({
                id: Date.now() + Math.random(),
                stockId: row.stockId,
                grams: row.grams,
            })));
            onFormulaLoaded(); // Clear the transfer state in the parent
        }
    }, [formulaToLoad, onFormulaLoaded]);

    const coloringProducts = useMemo(() => {
        return stockItems.filter(item => item.category.toLowerCase() === productTypeForFormula);
    }, [stockItems, productTypeForFormula]);

    const colorOptions = useMemo(() => {
        const colorRegex = /(?:Cor:\s*)(\d+\.?\d*)/;
        const options = coloringProducts.map(product => {
            const match = product.detail.match(colorRegex);
            const colorNumber = match ? match[1] : product.detail;
            return {
                id: product.id,
                displayText: `${colorNumber} (${product.brand || 'Sem Marca'})`,
                fullInfo: product.name,
                numericValue: parseFloat(colorNumber) || 0
            };
        });
        return options.sort((a, b) => a.numericValue - b.numericValue);
    }, [coloringProducts]);


    const filteredClients = useMemo(() => {
        if (!clientSearch.trim()) return [];
        return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
    }, [clientSearch, clients]);

    const selectedClient = clients.find(c => c.id === selectedClientId);
    
    const calculatedFinalTone = useMemo(() => {
        const validRows = colorRows.filter(row => row.stockId && parseFloat(row.grams) > 0);
        if (validRows.length === 0) return null;

        const colorRegex = /Cor:\s*(\d{1,2})\.?(\d*)/;

        const sums = validRows.reduce((acc, row) => {
            const grams = parseFloat(row.grams);
            const product = stockItems.find(p => p.id === row.stockId);
            if (!product) return acc;

            const match = product.detail.match(colorRegex);
            if (!match) return acc;
            
            const baseValueStr = match[1];
            const nuanceValueStr = match[2] || '';
            
            const baseValue = parseFloat(baseValueStr) || 0;
            const nuanceValue = parseInt(nuanceValueStr, 10) || 0;

            acc.totalGrams += grams;
            acc.weightedBaseSum += baseValue * grams;
            acc.weightedNuanceSum += nuanceValue * grams;
            
            return acc;
        }, { totalGrams: 0, weightedBaseSum: 0, weightedNuanceSum: 0 });

        if (sums.totalGrams === 0) return null;

        const finalBase = sums.weightedBaseSum / sums.totalGrams;
        const finalNuance = sums.weightedNuanceSum / sums.totalGrams;
        
        const baseInt = Math.round(finalBase);
        const nuanceInt = Math.round(finalNuance);
        
        if (nuanceInt > 0) {
            return `${baseInt}.${nuanceInt}`;
        } else {
            return `${baseInt}.0`;
        }
    }, [colorRows, stockItems]);
    
    const handlePredictWithAI = async () => {
        const validRows = colorRows.filter(row => row.stockId && parseFloat(row.grams) > 0);
        if (validRows.length === 0) {
            setPredictionError("Adicione pelo menos uma cor à mistura para obter uma previsão.");
            return;
        }

        setIsPredicting(true);
        setPredictionError(null);
        setAiPrediction(null);

        const mixtureText = validRows.map(row => {
            const product = colorOptions.find(opt => opt.id === row.stockId);
            if (!product) return '';
            const colorCode = product.displayText.split(' ')[0];
            const brand = product.displayText.match(/\((.*?)\)/)?.[1] || 'N/A';
            return `- ${row.grams}g de ${colorCode} (${brand})`;
        }).join('\n');

        const prompt = `
            Você é um assistente de IA colorista de cabelo de classe mundial. Sua tarefa é prever o resultado de uma mistura de coloração.

            **Instruções:**
            1. Analise a 'Mistura Fornecida'.
            2. Preveja o nome da cor resultante (ex: "Loiro Médio Bege Acinzentado", "Castanho Claro Dourado").
            3. Forneça uma explicação breve e profissional do resultado, considerando a neutralização ou combinação de nuances.

            **Formato de Saída:**
            Responda APENAS com um objeto JSON válido.

            {
              "predictedColorName": "[Nome descritivo da cor resultante]",
              "explanation": "[Sua explicação técnica aqui.]"
            }

            **Solicitação:**
            - Mistura Fornecida (${productTypeForFormula}):
            ${mixtureText}
        `;

        try {
            // FIX: Added non-null assertion to process.env.API_KEY
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                },
            });
            
            const jsonText = response.text.trim();
            const parsedResult = JSON.parse(jsonText);
            setAiPrediction(parsedResult);
        } catch (error) {
            console.error("Error predicting with AI:", error);
            setPredictionError("Não foi possível obter a previsão da IA. Tente novamente.");
        } finally {
            setIsPredicting(false);
        }
    };


    const totalColorGrams = useMemo(() => {
        return colorRows.reduce((sum, row) => sum + (parseFloat(row.grams) || 0), 0);
    }, [colorRows]);

    const requiredOxAmount = useMemo(() => {
        if (totalColorGrams > 0) {
            return totalColorGrams * parseFloat(oxRatio);
        }
        return 0;
    }, [totalColorGrams, oxRatio]);
    
    const resetForm = () => {
        setSelectedClientId('');
        setSelectedEmployeeId('');
        setClientSearch('');
        setFormulaName('');
        setColorRows([{ id: Date.now(), stockId: '', grams: '' }]);
        setOxVolume('20');
        setOxRatio('1.5');
        setAdditives('');
        setAiPrediction(null);
    };
    
    const handleSaveFormula = () => {
        if (!selectedClientId && !selectedEmployeeId) {
            alert('Por favor, selecione um cliente ou um funcionário para salvar a fórmula.');
            return;
        }

        if (!formulaName.trim() || colorRows.some(row => !row.stockId || !row.grams)) {
            alert('Por favor, dê um nome à fórmula e preencha todos os campos de coloração.');
            return;
        }

        const today = new Date().toLocaleDateString('pt-BR');
        let formulaString = `\n--- FÓRMULA: ${formulaName.trim()} (${today}) ---\n`;
        
        if (aiPrediction) {
            formulaString += `Previsão IA: ${aiPrediction.predictedColorName}\n`;
        } else if (calculatedFinalTone !== null) {
            formulaString += `Tom e Nuance (Cálculo): ${calculatedFinalTone.replace('.', ',')}\n`;
        }

        formulaString += `${productTypeForFormula.charAt(0).toUpperCase() + productTypeForFormula.slice(1)}:\n`;
        colorRows.forEach(row => {
            const product = coloringProducts.find(p => p.id === row.stockId);
            if (product) {
                const brandText = product.brand ? ` ${product.brand}` : '';
                const colorRegex = /\b(\d{1,2}(?:\.\d{1,2})?)\b/;
                const match = product.detail.match(colorRegex) || product.name.match(colorRegex);
                const colorNumber = match ? match[1] : product.detail;

                formulaString += `- ${row.grams}g de ${colorNumber}${brandText}\n`;
            }
        });

        if (requiredOxAmount > 0) {
            formulaString += "OX:\n";
            formulaString += `- ${requiredOxAmount.toFixed(1).replace('.',',')}ml de OX ${oxVolume} volumes\n`;
        }

        if (additives.trim()) {
            formulaString += "Aditivos:\n";
            formulaString += `- ${additives.trim()}\n`;
        }
        formulaString += "----------------------------------------------------\n";
        
        let successMsg = '';
        const client = clients.find(c => c.id === selectedClientId);
        const employee = professionals.find(p => p.id === selectedEmployeeId);

        if (client) {
            const updatedClient = { ...client, notes: (client.notes || '') + formulaString };
            updateClient(updatedClient);
        }

        if (employee) {
            const updatedEmployee = { ...employee, notes: (employee.notes || '') + formulaString };
            updateProfessional(updatedEmployee);
        }

        if (client && employee) {
            successMsg = `Fórmula salva para ${client.name} e ${employee.name}!`;
        } else if (client) {
            successMsg = `Fórmula salva para ${client.name}!`;
        } else if (employee) {
            successMsg = `Fórmula salva para ${employee.name}!`;
        }
        
        setSuccessMessage(successMsg);
        setTimeout(() => setSuccessMessage(''), 3000);
        resetForm();
    };


    const handleAddColorRow = () => {
        setColorRows(prev => [...prev, { id: Date.now(), stockId: '', grams: '' }]);
    };
    
    const handleRemoveColorRow = (id: number) => {
        if (colorRows.length > 1) {
            setColorRows(prev => prev.filter(row => row.id !== id));
        }
    };

    const handleColorRowChange = (id: number, field: 'stockId' | 'grams', value: string) => {
        setColorRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
        setAiPrediction(null); // Reset prediction on change
    };
    
    const handleClientSelect = (client: Client) => {
        setSelectedClientId(client.id);
        setClientSearch('');
    };
    
    const handleProductTypeChange = (type: 'coloração' | 'tonalizante') => {
        setProductTypeForFormula(type);
        // Reset color selections to avoid having a color from the other category selected
        setColorRows([{ id: Date.now(), stockId: '', grams: '' }]);
        setAiPrediction(null);
    };

    return (
        <section className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-purple-300">Criador de Fórmula para Cliente</h3>
            <p className="text-sm text-gray-400 mb-6">Monte, nomeie e salve a fórmula de coloração diretamente nas anotações do cliente.</p>

            <div className="space-y-4">
                {/* Client Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">1. Selecione o Cliente (Opcional)</label>
                    {selectedClient ? (
                        <div className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src={selectedClient.avatarUrl} alt={selectedClient.name} className="w-10 h-10 rounded-full" />
                                <span className="font-semibold">{selectedClient.name}</span>
                            </div>
                            <button onClick={() => setSelectedClientId('')} className="text-sm text-blue-400 hover:text-blue-300">Trocar</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" />
                            {clientSearch && (
                                <div className="absolute w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-48 overflow-y-auto z-20">
                                    {filteredClients.length > 0 ? filteredClients.map(client => (
                                        <div key={client.id} onClick={() => handleClientSelect(client)} className="p-3 hover:bg-gray-700 cursor-pointer flex items-center gap-3">
                                            <img src={client.avatarUrl} alt={client.name} className="w-8 h-8 rounded-full" />
                                            <span>{client.name}</span>
                                        </div>
                                    )) : <p className="p-3 text-gray-500">Nenhum cliente encontrado.</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                 {/* Employee Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">2. Funcionário (Opcional)</label>
                    <select
                        value={selectedEmployeeId}
                        onChange={e => setSelectedEmployeeId(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                    >
                        <option value="">Nenhum (salvar apenas no cliente)</option>
                        {professionals.map(prof => (
                            <option key={prof.id} value={prof.id}>{prof.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Selecione para salvar a fórmula também no perfil do funcionário.</p>
                </div>
                {/* Formula Name */}
                <div>
                    <label htmlFor="formula-name" className="block text-sm font-medium text-gray-300 mb-2">3. Dê um Nome para a Fórmula</label>
                    <input type="text" id="formula-name" value={formulaName} onChange={e => setFormulaName(e.target.value)} placeholder="Ex: Loiro Mel Verão 2024" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" />
                </div>
                {/* Product Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">4. Tipo de Produto</label>
                    <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => handleProductTypeChange('coloração')}
                            className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${productTypeForFormula === 'coloração' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        >
                            Coloração
                        </button>
                        <button
                            onClick={() => handleProductTypeChange('tonalizante')}
                            className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${productTypeForFormula === 'tonalizante' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        >
                            Tonalizante
                        </button>
                    </div>
                </div>
                {/* Colors */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">5. Produtos Usados</label>
                    <div className="space-y-2">
                        {colorRows.map(row => (
                            <div key={row.id} className="grid grid-cols-[1fr,100px,auto] gap-2 items-center">
                                <select value={row.stockId} onChange={e => handleColorRowChange(row.id, 'stockId', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                                    <option value="">Selecione a cor...</option>
                                    {colorOptions.map(opt => <option key={opt.id} value={opt.id} title={opt.fullInfo}>{opt.displayText}</option>)}
                                </select>
                                <input type="number" value={row.grams} onChange={e => handleColorRowChange(row.id, 'grams', e.target.value)} placeholder="Qtd (g)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                                <button onClick={() => handleRemoveColorRow(row.id)} className="p-2 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={colorRows.length <= 1}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddColorRow} className="mt-2 flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"><PlusIcon className="w-4 h-4"/> Adicionar Cor</button>
                </div>
                 {/* Result */}
                 <div className="bg-gray-800 p-3 rounded-lg space-y-3">
                     <div className="flex justify-between items-center">
                        <div className="text-center">
                            <p className="text-sm text-gray-400">Tom (Cálculo)</p>
                            <p className="text-xl font-bold text-green-400">{calculatedFinalTone ? calculatedFinalTone.replace('.',',') : '-'}</p>
                        </div>
                        <button onClick={handlePredictWithAI} disabled={isPredicting || colorRows.every(r => !r.stockId || !r.grams)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors">
                            <SparklesIcon className="w-5 h-5"/>
                            {isPredicting ? 'Prevendo...' : 'Prever Cor com IA'}
                        </button>
                     </div>

                    {isPredicting && <div className="text-center text-sm text-gray-400 animate-pulse">A IA está analisando sua fórmula...</div>}
                    {predictionError && <p className="text-center text-red-400 text-sm">{predictionError}</p>}
                    {aiPrediction && (
                        <div className="border-t border-gray-700 pt-3 mt-3">
                             <p className="text-sm text-gray-400 text-center">Previsão da IA</p>
                             <p className="text-xl font-bold text-rose-300 text-center mb-2">{aiPrediction.predictedColorName}</p>
                             <p className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded-md">{aiPrediction.explanation}</p>
                        </div>
                    )}
                </div>

                 {/* OX */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">6. Água Oxigenada (OX)</label>
                    <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Proporção (Coloração : OX)</p>
                        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                            {['1', '1.5', '2'].map(ratioValue => (
                                <button
                                    key={ratioValue}
                                    onClick={() => setOxRatio(ratioValue)}
                                    className={`w-full py-2 px-2 rounded-md text-sm font-semibold transition-colors ${oxRatio === ratioValue ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                >
                                    1 : {ratioValue.replace('.', ',')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-[120px,1fr] gap-2">
                         <select value={oxVolume} onChange={e => setOxVolume(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm h-[42px]">
                            <option value="10">10 Volumes</option>
                            <option value="20">20 Volumes</option>
                            <option value="30">30 Volumes</option>
                            <option value="40">40 Volumes</option>
                        </select>
                        <div className="relative">
                            <input 
                                type="text"
                                value={requiredOxAmount > 0 ? requiredOxAmount.toFixed(1).replace('.',',') : ''} 
                                readOnly 
                                placeholder="Qtd (ml)" 
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-300 h-[42px]"
                            />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">ml</span>
                        </div>
                    </div>
                </div>
                 {/* Additives */}
                 <div>
                    <label htmlFor="additives" className="block text-sm font-medium text-gray-300 mb-2">7. Aditivos (Opcional)</label>
                    <textarea id="additives" value={additives} onChange={e => setAdditives(e.target.value)} rows={2} placeholder="Ex: 1 ampola de tratamento X, 5 gotas de óleo Y" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm"/>
                </div>
                {successMessage && <p className="text-center text-green-400 font-semibold">{successMessage}</p>}
                <button onClick={handleSaveFormula} className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg text-base hover:bg-purple-500 transition-colors">
                    SALVAR FÓRMULA
                </button>
            </div>
        </section>
    );
};

const ColoringCalculation: React.FC = () => {
    type ActiveCalculator = 'base' | 'gemini' | 'rule11' | 'ox' | 'proportion' | 'formula' | 'descolorante';
    const [activeCalculator, setActiveCalculator] = useState<ActiveCalculator>('base');
    const [formulaToTransfer, setFormulaToTransfer] = useState<FormulaToLoad | null>(null);

    const handleTransferFormula = (formulaData: FormulaToLoad) => {
        setFormulaToTransfer(formulaData);
        setActiveCalculator('formula');
    };

    const renderCalculator = () => {
        switch (activeCalculator) {
            case 'base': return <FormulaMixerModule onTransfer={handleTransferFormula} />;
            case 'gemini': return <GeminiMixerModule onTransfer={handleTransferFormula} />;
            case 'rule11': return <RuleOf11Module />;
            case 'ox': return <OxMixingModule />;
            case 'proportion': return <OxProportionModule />;
            case 'descolorante': return <BleachingPowderModule />;
            case 'formula': return <ClientFormulaModule 
                                        formulaToLoad={formulaToTransfer} 
                                        onFormulaLoaded={() => setFormulaToTransfer(null)}
                                    />;
            default: return <FormulaMixerModule onTransfer={handleTransferFormula} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                 <h2 className="text-3xl font-bold mb-2" style={{fontFamily: 'Playfair Display, serif'}}>Fórmula Pro: Colorimetria</h2>
                 <p className="text-gray-400 max-w-2xl mx-auto mb-6">A ferramenta essencial que transforma a colorimetria complexa em fórmulas exatas para garantir resultados perfeitos.</p>
                 
                 <div className="flex flex-wrap justify-center gap-2 bg-gray-900 p-1.5 rounded-xl max-w-5xl mx-auto border border-gray-800">
                    <button 
                        onClick={() => setActiveCalculator('base')} 
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors ${activeCalculator === 'base' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        Mixer de Fórmulas
                    </button>
                    <button 
                        onClick={() => setActiveCalculator('gemini')} 
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${activeCalculator === 'gemini' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <SparklesIcon className="w-4 h-4"/> Mixer IA
                    </button>
                    <button 
                        onClick={() => setActiveCalculator('rule11')} 
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors ${activeCalculator === 'rule11' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        Regra 11
                    </button>
                    <button 
                        onClick={() => setActiveCalculator('descolorante')} 
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${activeCalculator === 'descolorante' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                       <BeakerIcon className="w-4 h-4"/> Descolorante
                    </button>
                    <button 
                        onClick={() => setActiveCalculator('ox')} 
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors ${activeCalculator === 'ox' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        Misturar OX
                    </button>
                    <button 
                        onClick={() => setActiveCalculator('proportion')} 
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors ${activeCalculator === 'proportion' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        Proporção OX
                    </button>
                    <button 
                        onClick={() => setActiveCalculator('formula')} 
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors ${activeCalculator === 'formula' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        Fórmula Cliente
                    </button>
                </div>
            </div>
            
            <div className="mt-6">
                {renderCalculator()}
            </div>
        </div>
    );
};

export default ColoringCalculation;