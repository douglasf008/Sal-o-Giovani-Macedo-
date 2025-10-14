
import React, { useMemo, useState } from 'react';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';
import { useFinancials, CycleConfig } from '../../contexts/FinancialsContext';
import { usePaymentCycle } from '../../hooks/usePaymentCycle';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { useVales } from '../../contexts/ValesContext';
import ArrowTrendingUpIcon from '../icons/ArrowTrendingUpIcon';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';


const PastCycleCard: React.FC<{ offset: number }> = ({ offset }) => {
    const { currentCycle } = usePaymentCycle(offset);
    const { sales } = useSalesHistory();
    const { professionals } = useProfessionals();
    const { vales } = useVales();
    const [isOpen, setIsOpen] = useState(offset === -1); // Open the most recent past cycle by default

    const cyclePerformance = useMemo(() => {
        const { startDate, endDate } = currentCycle;
        
        const salesInCycle = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
        const valesInCycle = vales.filter(vale => {
            const valeDate = new Date(vale.date);
            return valeDate >= startDate && valeDate <= endDate;
        });

        const performanceData = professionals.map(prof => {
            const salesItems = salesInCycle.flatMap(s => s.items).filter(item => item.professionalId === prof.id);
            const valesItems = valesInCycle.filter(v => v.employeeId === prof.id);

            const totalRevenue = salesItems.reduce((sum, item) => sum + item.finalPrice, 0);
            const totalCommission = salesItems.reduce((sum, item) => sum + item.finalCommissionValue, 0);
            const totalVales = valesItems.reduce((sum, vale) => sum + vale.totalAmount, 0);
            const netToBePaid = totalCommission - totalVales;

            return {
                prof,
                totalRevenue,
                netToBePaid,
                hasActivity: totalRevenue > 0 || totalVales > 0,
            };
        }).filter(p => p.hasActivity).sort((a, b) => b.totalRevenue - a.totalRevenue);

        const cycleTotal = performanceData.reduce((sum, p) => sum + p.totalRevenue, 0);
        
        return {
            period: `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
            total: cycleTotal,
            performanceData,
        };

    }, [currentCycle, sales, professionals, vales]);
    
    if (cyclePerformance.performanceData.length === 0) {
        return null; // Don't render card if there's no activity in that cycle
    }

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-700/50 transition-colors"
            >
                <div>
                    <p className="font-semibold">{cyclePerformance.period}</p>
                    <p className="text-sm text-green-400">Total Faturado: R$ {cyclePerformance.total.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-300">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Relatório</span>
                    </button>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50">
                    {cyclePerformance.performanceData.map(({ prof, totalRevenue, netToBePaid }) => (
                        <div key={prof.id} className="p-3 bg-gray-900/50 rounded-md">
                            <div className="flex items-center gap-3">
                                <img src={prof.avatarUrl} alt={prof.name} className="w-10 h-10 rounded-full" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{prof.name}</p>
                                    <div className="flex flex-col sm:flex-row sm:gap-4 text-sm mt-1">
                                        <div className="flex items-center gap-1.5 text-green-400">
                                            <ArrowTrendingUpIcon className="w-4 h-4" />
                                            <span>Contribuição:</span>
                                            <span className="font-bold">R$ {totalRevenue.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-400">
                                            <CurrencyDollarIcon className="w-4 h-4" />
                                            <span>A Pagar:</span>
                                            <span className="font-bold">R$ {netToBePaid.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const PaymentCycles: React.FC = () => {
    const { settings, saveSettings } = useFinancials();
    const [formConfig, setFormConfig] = React.useState<CycleConfig>(settings.cycleConfig);

    const hasChanges = useMemo(() => JSON.stringify(settings.cycleConfig) !== JSON.stringify(formConfig), [settings.cycleConfig, formConfig]);

    const handleConfigChange = <K extends keyof CycleConfig>(field: K, value: CycleConfig[K]) => {
        setFormConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleConfigChange('cycleType', e.target.value as CycleConfig['cycleType']);
    }

    const weekDaysOptions = [
        { value: '0', label: 'Domingo' },
        { value: '1', label: 'Segunda-feira' },
        { value: '2', label: 'Terça-feira' },
        { value: '3', label: 'Quarta-feira' },
        { value: '4', label: 'Quinta-feira' },
        { value: '5', label: 'Sexta-feira' },
        { value: '6', label: 'Sábado' },
    ];

    const handleSaveRule = () => {
        saveSettings({ ...settings, cycleConfig: formConfig });
        alert('Regra de ciclo de pagamento salva com sucesso!');
    };

    const handleDiscardChanges = () => {
        setFormConfig(settings.cycleConfig);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Ciclos de Pagamento</h2>
                <p className="text-gray-400">Configure as regras de pagamento e visualize o histórico.</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Configuração do Ciclo Atual</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`p-4 border rounded-lg cursor-pointer transition-colors flex items-center flex-wrap gap-2 ${formConfig.cycleType === 'days_5_20' ? 'bg-gray-700 border-gray-500' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input type="radio" name="cycleType" value="days_5_20" checked={formConfig.cycleType === 'days_5_20'} onChange={handleRadioChange} className="mr-2" />
                            <span>Todo dia</span>
                            <input 
                                type="number" 
                                value={formConfig.dayOne}
                                onChange={e => handleConfigChange('dayOne', e.target.value)}
                                onClick={e => { e.stopPropagation(); if (formConfig.cycleType !== 'days_5_20') handleConfigChange('cycleType', 'days_5_20'); }}
                                min="1" max="31"
                                className="w-16 bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span>e</span>
                            <input 
                                type="number" 
                                value={formConfig.dayTwo}
                                onChange={e => handleConfigChange('dayTwo', e.target.value)}
                                onClick={e => { e.stopPropagation(); if (formConfig.cycleType !== 'days_5_20') handleConfigChange('cycleType', 'days_5_20'); }}
                                min="1" max="31"
                                className="w-16 bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </label>
                        <label className={`p-4 border rounded-lg cursor-pointer transition-colors flex items-center flex-wrap gap-2 ${formConfig.cycleType === 'day_5' ? 'bg-gray-700 border-gray-500' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input type="radio" name="cycleType" value="day_5" checked={formConfig.cycleType === 'day_5'} onChange={handleRadioChange} className="mr-2" />
                            <span>Somente todo dia</span>
                             <input 
                                type="number" 
                                value={formConfig.dayOne}
                                onChange={e => handleConfigChange('dayOne', e.target.value)}
                                onClick={e => { e.stopPropagation(); if (formConfig.cycleType !== 'day_5') handleConfigChange('cycleType', 'day_5'); }}
                                min="1" max="31"
                                className="w-16 bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </label>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`p-4 border rounded-lg cursor-pointer transition-colors flex items-center flex-wrap gap-2 ${formConfig.cycleType === 'business_day' ? 'bg-gray-700 border-gray-500' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input type="radio" name="cycleType" value="business_day" checked={formConfig.cycleType === 'business_day'} onChange={handleRadioChange} className="mr-2" />
                            <span>No</span>
                            <input 
                                type="number" 
                                value={formConfig.businessDay}
                                onChange={e => handleConfigChange('businessDay', e.target.value)}
                                onClick={e => { e.stopPropagation(); if (formConfig.cycleType !== 'business_day') handleConfigChange('cycleType', 'business_day'); }}
                                min="1" max="10"
                                className="w-16 bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                             <span>º dia útil</span>
                        </label>
                        <label className={`p-4 border rounded-lg cursor-pointer transition-colors flex items-center flex-wrap gap-2 ${formConfig.cycleType === 'weekly' ? 'bg-gray-700 border-gray-500' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input type="radio" name="cycleType" value="weekly" checked={formConfig.cycleType === 'weekly'} onChange={handleRadioChange} className="mr-2" />
                            <span>Semanal (Toda</span>
                             <select
                                value={formConfig.weeklyDay}
                                onChange={e => handleConfigChange('weeklyDay', e.target.value)}
                                onClick={e => { e.stopPropagation(); if (formConfig.cycleType !== 'weekly') handleConfigChange('cycleType', 'weekly'); }}
                                className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {weekDaysOptions.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                            </select>
                            <span>)</span>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end items-center gap-4 mt-6">
                    {hasChanges && (
                         <button
                            onClick={handleDiscardChanges}
                            className="text-gray-400 font-bold py-2 px-6 rounded-lg text-base hover:text-white transition-colors"
                        >
                            Descartar
                        </button>
                    )}
                    <button
                        onClick={handleSaveRule}
                        disabled={!hasChanges}
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg text-base hover:bg-blue-500 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        Salvar Regra
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                     <ArchiveBoxIcon className="w-6 h-6 text-gray-400" />
                     <h3 className="text-lg font-semibold text-gray-300">Ciclos Anteriores</h3>
                </div>
                 <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <PastCycleCard key={i} offset={-i} />)}
                </div>
            </div>
        </div>
    );
};

export default PaymentCycles;
