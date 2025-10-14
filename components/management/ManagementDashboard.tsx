import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';
import { usePaymentCycle } from '../../hooks/usePaymentCycle';
import { useVales, Vale } from '../../contexts/ValesContext';
import { Professional, ProcessedCartItem } from '../../types';
import XIcon from '../icons/XIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import PayslipModal from '../PayslipModal';
import { useExpenses } from '../../contexts/ExpensesContext';
import { useStock } from '../../contexts/StockContext';
import { useFinancials } from '../../contexts/FinancialsContext';

interface ProfessionalPerformance {
    prof: Professional;
    totalSales: number;
    totalCommission: number;
    totalTip: number;
    fixedSalary: number;
    salaryDeductions: number;
    salaryPaidTo: { name: string; amount: number }[];
    totalVales: number;
    netToReceive: number;
    deixaramNoSalao: number;
    salesItems: ProcessedCartItem[];
    valesItems: Vale[];
    hasActivity: boolean;
}

interface EmployeeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    performanceData: ProfessionalPerformance | null;
    cycle: {
        startDate: Date;
        endDate: Date;
    };
}

const StatCard: React.FC<{ title: string; value: number; subValue?: string; colorClass?: string; isCurrency?: boolean }> = ({ title, value, subValue, colorClass = 'text-green-400', isCurrency = true }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>
            {isCurrency ? `R$ ${value.toFixed(2).replace('.', ',')}` : value}
        </p>
        {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string; colorClass?: string; isSubtle?: boolean; isTotal?: boolean; subtext?: string }> = ({ label, value, colorClass = 'text-gray-100', isSubtle = false, isTotal = false, subtext }) => (
    <div className={`flex justify-between items-center ${isTotal ? 'py-3 border-t border-gray-700' : 'py-2'} ${isSubtle ? 'text-sm' : ''}`}>
        <div>
             <span className={isSubtle ? 'text-gray-400' : (isTotal ? 'font-bold' : 'text-gray-300')}>{label}</span>
             {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
        <span className={`font-semibold ${isTotal ? 'text-xl' : 'text-base'} ${colorClass}`}>{value}</span>
    </div>
);

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ isOpen, onClose, performanceData, cycle }) => {
    if (!isOpen || !performanceData) return null;

    const { prof: employee, salesItems, valesItems, totalSales, totalCommission, totalTip, totalVales, fixedSalary, salaryDeductions, salaryPaidTo, netToReceive } = performanceData;

    const SummaryRow: React.FC<{ label: string, value: number, colorClass: string }> = ({ label, value, colorClass }) => (
        <div className="flex justify-between items-baseline">
            <span className="text-gray-400">{label}</span>
            <span className={`font-bold text-lg ${colorClass}`}>
                {value < 0 ? '-' : ''} R$ {Math.abs(value).toFixed(2).replace('.', ',')}
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full shadow-lg flex flex-col h-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">Detalhes do Ciclo</h2>
                        <p className="text-gray-400">{employee.name} | {cycle.startDate.toLocaleDateString('pt-BR')} a {cycle.endDate.toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"><XIcon className="w-5 h-5" /></button>
                </header>

                <main className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <section className="bg-gray-800 p-4 rounded-lg space-y-3">
                        <SummaryRow label="Total em Vendas" value={totalSales} colorClass="text-white" />
                        <SummaryRow label="Total em Comissão" value={totalCommission} colorClass="text-green-400" />
                        {totalTip > 0 && <SummaryRow label="Gorjetas" value={totalTip} colorClass="text-green-400" />}
                        {fixedSalary > 0 && <SummaryRow label="Salário Fixo" value={fixedSalary} colorClass="text-green-400" />}
                        <SummaryRow label="Total em Vales" value={-totalVales} colorClass="text-red-400" />
                        {salaryDeductions > 0 && <SummaryRow label="Salários Pagos" value={-salaryDeductions} colorClass="text-red-400" />}
                        <div className="border-t border-gray-700 pt-3 mt-3">
                            <SummaryRow label="Líquido a Receber" value={netToReceive} colorClass={netToReceive >= 0 ? 'text-green-400' : 'text-red-400'} />
                        </div>
                    </section>
                    
                     {salaryPaidTo.length > 0 && (
                        <section>
                            <h3 className="font-semibold text-lg mb-2 text-gray-300">Salários Pagos a Outros Funcionários</h3>
                            <div className="space-y-2">
                                {salaryPaidTo.map((payment, index) => (
                                    <div key={index} className="bg-gray-800 p-3 rounded-md flex justify-between">
                                        <span>{payment.name}</span>
                                        <span className="font-semibold text-red-400">- R$ {payment.amount.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="font-semibold text-lg mb-2 text-gray-300">Vendas Realizadas</h3>
                        <div className="space-y-2">
                            {salesItems.length > 0 ? salesItems.map(item => (
                                <div key={item.id} className="bg-gray-800 p-3 rounded-md">
                                    <div className="flex justify-between">
                                        <span>{item.item.name}</span>
                                        <span className="font-semibold">R$ {item.finalPrice.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-green-400">
                                        <span>Comissão ({item.commission}%)</span>
                                        <span>+ R$ {item.finalCommissionValue.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-sm text-gray-500 py-4">Nenhuma venda registrada neste ciclo.</p>
                            )}
                        </div>
                    </section>
                    
                    <section>
                        <h3 className="font-semibold text-lg mb-2 text-gray-300">Vales e Adiantamentos</h3>
                        <div className="space-y-2">
                            {valesItems.length > 0 ? valesItems.map(vale => (
                                <div key={vale.id} className="bg-gray-800 p-3 rounded-md">
                                    <div className="flex justify-between">
                                        <span>{vale.items.map(i => i.name).join(', ')}</span>
                                        <span className="font-semibold text-red-400">- R$ {vale.totalAmount.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-sm text-gray-500 py-4">Nenhum vale registrado neste ciclo.</p>
                            )}
                        </div>
                    </section>
                </main>
                
                <footer className="mt-6 flex-shrink-0 text-right">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};


const ManagementDashboard: React.FC = () => {
    const { professionals } = useProfessionals();
    const navigate = useNavigate();
    const { sales } = useSalesHistory();
    const { vales } = useVales();
    const [cycleOffset, setCycleOffset] = useState(0);
    const { currentCycle } = usePaymentCycle(cycleOffset);
    const { settings: financialSettings } = useFinancials();
    const [detailsModalData, setDetailsModalData] = useState<ProfessionalPerformance | null>(null);
    const [payslipModalData, setPayslipModalData] = useState<ProfessionalPerformance | null>(null);
    const { expenses } = useExpenses();
    const { stockItems } = useStock();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [cycleOffset]);

    const cycleTitle = useMemo(() => {
        if (cycleOffset === 0) return "Painel do Ciclo Atual";
        if (cycleOffset === -1) return "Painel do Ciclo Anterior";
        return `Painel (${Math.abs(cycleOffset)} Ciclos Atrás)`;
    }, [cycleOffset]);

    const cyclePerformanceData = useMemo(() => {
        const { startDate, endDate } = currentCycle;

        const getProratedMonthlyValue = (monthlyValue: number) => {
            // Prorates a monthly value based on the selected payment cycle duration.
            switch (financialSettings.cycleConfig.cycleType) {
                case 'days_5_20':
                    return monthlyValue / 2; // Bi-weekly
                case 'weekly':
                    return monthlyValue / 4; // Approx. 4 weeks in a month
                case 'day_5':
                case 'business_day':
                default:
                    return monthlyValue; // Monthly
            }
        };

        const salesInCycle = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
        const valesInCycle = vales.filter(vale => {
            const valeDate = new Date(vale.date);
            return valeDate >= startDate && valeDate <= endDate;
        });
        const expensesInCycle = expenses.filter(expense => {
            const expenseDate = new Date(expense.date + 'T00:00:00');
            return expenseDate >= startDate && expenseDate <= endDate;
        });

        const despesasPorCategoria = expensesInCycle.reduce((acc, expense) => {
            const category = expense.category;
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        const totalServicos = salesInCycle.flatMap(s => s.items).filter(i => i.type === 'service').reduce((sum, i) => sum + i.finalPrice, 0);
        const totalRevenda = salesInCycle.flatMap(s => s.items).filter(i => i.type === 'product').reduce((sum, i) => sum + i.finalPrice, 0);
        const totalPacotes = salesInCycle.flatMap(s => s.items).filter(i => i.type === 'package').reduce((sum, i) => sum + i.finalPrice, 0);
        const totalGrossSales = totalServicos + totalRevenda + totalPacotes;

        const totalCommissions = salesInCycle.flatMap(s => s.items).reduce((sum, item) => sum + item.finalCommissionValue, 0);
        
        let totalCardFees = 0;
        salesInCycle.forEach(sale => {
            let feePercentage = 0;
            if (sale.payment.method === 'Débito') {
                feePercentage = financialSettings.debitFee;
            } else if (sale.payment.method === 'Crédito') {
                const installments = sale.payment.installments || 1;
                const applicableTier = [...financialSettings.creditFeeTiers].sort((a, b) => a.installments - b.installments).find(tier => tier.installments >= installments);
                if (applicableTier) feePercentage = applicableTier.fee;
            }
            totalCardFees += sale.totals.total * (feePercentage / 100);
        });

        const totalExpensesInCycle = expensesInCycle.reduce((sum, expense) => sum + expense.amount, 0);
        const custoProdutosRevenda = salesInCycle.flatMap(s => s.items).filter(i => i.type === 'product').reduce((sum, i) => {
            const stockItem = stockItems.find(si => si.id === i.item.id);
            return sum + (stockItem?.cost || 0);
        }, 0);
        const lucroRevenda = totalRevenda - custoProdutosRevenda;
        
        const totalDinheiro = salesInCycle.filter(s => s.payment.method === 'Dinheiro').reduce((sum, s) => sum + s.totals.total, 0);
        const totalCartao = salesInCycle.filter(s => s.payment.method === 'Crédito' || s.payment.method === 'Débito').reduce((sum, s) => sum + s.totals.total, 0);
        const totalPix = salesInCycle.filter(s => s.payment.method === 'Pix').reduce((sum, s) => sum + s.totals.total, 0);

        const performanceMap: Map<string, ProfessionalPerformance> = new Map(professionals.map(prof => [prof.id, { prof, totalSales: 0, totalCommission: 0, totalTip: 0, fixedSalary: 0, salaryDeductions: 0, salaryPaidTo: [], totalVales: 0, netToReceive: 0, deixaramNoSalao: 0, salesItems: [], valesItems: [], hasActivity: false }]));

        salesInCycle.forEach(sale => {
            const saleSubtotalForTip = sale.items.reduce((sum, item) => sum + item.finalPrice, 0);
            if (sale.totals.tip && sale.totals.tip > 0 && saleSubtotalForTip > 0) {
                sale.items.forEach(item => {
                    const perf = performanceMap.get(item.professionalId);
                    if (perf) perf.totalTip += sale.totals.tip * (item.finalPrice / saleSubtotalForTip);
                });
            }
            sale.items.forEach(item => {
                const perf = performanceMap.get(item.professionalId);
                if (perf) { perf.totalSales += item.finalPrice; perf.totalCommission += item.finalCommissionValue; perf.salesItems.push(item); }
            });
        });

        valesInCycle.forEach(vale => {
            const perf = performanceMap.get(vale.employeeId);
            if (perf) { perf.totalVales += vale.totalAmount; perf.valesItems.push(vale); }
        });

        professionals.forEach(prof => {
            if (prof.employmentType === 'salaried' && prof.isSalaryActive && prof.fixedSalary) {
                const salaryForCycle = getProratedMonthlyValue(prof.fixedSalary);
                if (salaryForCycle > 0) {
                    const salariedPerf = performanceMap.get(prof.id);
                    if (salariedPerf) salariedPerf.fixedSalary += salaryForCycle;
                    if (prof.salarySource && prof.salarySource !== 'salon') {
                        const payerPerf = performanceMap.get(prof.salarySource);
                        if (payerPerf) { payerPerf.salaryDeductions += salaryForCycle; payerPerf.salaryPaidTo.push({ name: prof.name, amount: salaryForCycle }); }
                    }
                }
            }
        });

        const professionalsPerformance = Array.from(performanceMap.values()).map(perf => {
            perf.deixaramNoSalao = perf.totalSales - perf.totalCommission;
            perf.netToReceive = (perf.totalCommission + perf.fixedSalary + perf.totalTip) - (perf.totalVales + perf.salaryDeductions);
            perf.hasActivity = perf.totalSales > 0 || perf.totalVales > 0 || perf.fixedSalary > 0 || perf.salaryDeductions > 0 || perf.totalTip > 0;
            return perf;
        }).filter(p => p.hasActivity).sort((a,b) => b.totalSales - a.totalSales);
        
        const totalFixedSalariesInCycle = professionals.reduce((sum, prof) => {
            if (prof.employmentType === 'salaried' && prof.isSalaryActive && prof.salarySource === 'salon' && prof.fixedSalary) {
                return sum + getProratedMonthlyValue(prof.fixedSalary);
            }
            return sum;
        }, 0);
        
        const totalRentValueInCycle = professionals.reduce((sum, prof) => {
            if (prof.employmentType === 'rented' && prof.rentValue && prof.rentValue > 0) {
                return sum + getProratedMonthlyValue(prof.rentValue);
            }
            return sum;
        }, 0);

        const totalCosts = totalCommissions + totalFixedSalariesInCycle + totalExpensesInCycle + totalCardFees + custoProdutosRevenda + totalRentValueInCycle;
        const salonNetProfit = totalGrossSales - totalCosts;
        
        const totalAPagarEquipe = professionalsPerformance.reduce((sum, p) => sum + p.netToReceive, 0);
        const totalDeixadoPelaEquipe = professionalsPerformance.reduce((sum, p) => sum + p.deixaramNoSalao, 0);

        return {
            geral: { totalBruto: totalGrossSales, custosTotais: totalCosts, lucroLiquido: salonNetProfit },
            receitas: { servicos: totalServicos, revenda: totalRevenda, pacotes: totalPacotes, lucroRevenda: lucroRevenda },
            custos: { comissoes: totalCommissions, salarios: totalFixedSalariesInCycle, alugueis: totalRentValueInCycle, despesas: totalExpensesInCycle, taxasCartao: totalCardFees, custoRevenda: custoProdutosRevenda, despesasPorCategoria },
            pagamentos: { dinheiro: totalDinheiro, cartao: totalCartao, pix: totalPix },
            profissionais: { performance: professionalsPerformance, totalAPagar: totalAPagarEquipe, totalDeixado: totalDeixadoPelaEquipe }
        };

    }, [sales, vales, professionals, currentCycle, financialSettings, expenses, stockItems]);

    return (
        <>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Dashboard de Gestão</h2>
                        <p className="text-gray-400">Visão geral do desempenho do salão.</p>
                    </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-300">{cycleTitle}</h3>
                            <p className="text-xs text-gray-500">{currentCycle.startDate.toLocaleDateString('pt-BR')} - {currentCycle.endDate.toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCycleOffset(o => o - 1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Ciclo anterior"><ChevronLeftIcon className="w-5 h-5"/></button>
                            <button onClick={() => setCycleOffset(o => o + 1)} disabled={cycleOffset >= 0} className="p-2 rounded-full hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Próximo ciclo"><ChevronRightIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard title="Total Bruto Vendido" value={cyclePerformanceData.geral.totalBruto} />
                        <StatCard title="Custos Totais" value={cyclePerformanceData.geral.custosTotais} colorClass="text-red-400" />
                        <StatCard title="Lucro Líquido" value={cyclePerformanceData.geral.lucroLiquido} colorClass={cyclePerformanceData.geral.lucroLiquido >= 0 ? 'text-blue-400' : 'text-red-400'} />
                    </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg space-y-8">
                    <h3 className="text-xl font-bold text-gray-200 text-center">Relatório de Fechamento do Ciclo</h3>
                    
                    <section>
                        <h4 className="font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Receitas</h4>
                        <div className="space-y-2">
                           <InfoRow label="Serviços" value={`R$ ${cyclePerformanceData.receitas.servicos.toFixed(2).replace('.', ',')}`} />
                           <InfoRow label="Pacotes" value={`R$ ${cyclePerformanceData.receitas.pacotes.toFixed(2).replace('.', ',')}`} />
                           <InfoRow label="Revenda" value={`R$ ${cyclePerformanceData.receitas.revenda.toFixed(2).replace('.', ',')}`} subtext={`Lucro: R$ ${cyclePerformanceData.receitas.lucroRevenda.toFixed(2).replace('.', ',')}`} />
                           <InfoRow label="Total Bruto" value={`R$ ${cyclePerformanceData.geral.totalBruto.toFixed(2).replace('.', ',')}`} isTotal colorClass="text-green-400"/>
                        </div>
                    </section>
                    
                    <section>
                        <h4 className="font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Formas de Pagamento</h4>
                        <div className="space-y-2">
                           <InfoRow label="Dinheiro" value={`R$ ${cyclePerformanceData.pagamentos.dinheiro.toFixed(2).replace('.', ',')}`} />
                           <InfoRow label="Cartão (Débito/Crédito)" value={`R$ ${cyclePerformanceData.pagamentos.cartao.toFixed(2).replace('.', ',')}`} />
                           <InfoRow label="PIX" value={`R$ ${cyclePerformanceData.pagamentos.pix.toFixed(2).replace('.', ',')}`} />
                           <InfoRow label="Total (menos taxas)" value={`R$ ${(cyclePerformanceData.geral.totalBruto - cyclePerformanceData.custos.taxasCartao).toFixed(2).replace('.', ',')}`} isTotal colorClass="text-white" />
                        </div>
                    </section>
                    
                     <section>
                        <h4 className="font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Custos Operacionais</h4>
                        <div className="space-y-2">
                           <InfoRow label="Comissões" value={`- R$ ${cyclePerformanceData.custos.comissoes.toFixed(2).replace('.', ',')}`} colorClass="text-yellow-400" />
                           <InfoRow label="Salários Fixos (pelo salão)" value={`- R$ ${cyclePerformanceData.custos.salarios.toFixed(2).replace('.', ',')}`} colorClass="text-yellow-400" />
                            {cyclePerformanceData.custos.alugueis > 0 && (
                                <InfoRow label="Aluguel de Sala (profissionais)" value={`- R$ ${cyclePerformanceData.custos.alugueis.toFixed(2).replace('.', ',')}`} colorClass="text-yellow-400" />
                            )}
                           
                           {Object.entries(cyclePerformanceData.custos.despesasPorCategoria).map(([category, total]: [string, number]) => (
                                <InfoRow 
                                    key={category}
                                    label={category} 
                                    value={`- R$ ${total.toFixed(2).replace('.', ',')}`}
                                    colorClass="text-red-400"
                                    isSubtle
                                />
                            ))}

                           <InfoRow label="Custo de Revenda" value={`- R$ ${cyclePerformanceData.custos.custoRevenda.toFixed(2).replace('.', ',')}`} colorClass="text-red-400" />
                           <InfoRow label="Taxas de Cartão" value={`- R$ ${cyclePerformanceData.custos.taxasCartao.toFixed(2).replace('.', ',')}`} colorClass="text-orange-400" />
                           <InfoRow label="Total de Custos" value={`- R$ ${cyclePerformanceData.geral.custosTotais.toFixed(2).replace('.', ',')}`} isTotal colorClass="text-red-400" />
                        </div>
                    </section>
                    
                     <section>
                        <h4 className="font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Pagamentos e Desempenho da Equipe</h4>
                        <div className="space-y-3">
                            {cyclePerformanceData.profissionais.performance.length > 0 ? cyclePerformanceData.profissionais.performance.map(data => (
                                <div key={data.prof.id} className="p-3 bg-gray-800 rounded-lg">
                                    <p className="font-medium mb-2">{data.prof.name}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <span className="text-gray-400">A Pagar:</span>
                                        <span className={`font-semibold text-right ${data.netToReceive >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {data.netToReceive.toFixed(2).replace('.', ',')}</span>
                                        <span className="text-gray-400">Deixou no Salão:</span>
                                        <span className="font-semibold text-right text-blue-400">R$ {data.deixaramNoSalao.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-gray-700">
                                        <button onClick={() => setDetailsModalData(data)} className="text-xs font-semibold text-blue-400 hover:text-blue-300">Detalhes</button>
                                        <button onClick={() => setPayslipModalData(data)} className="text-xs font-semibold text-green-400 hover:text-green-300">Gerar Holerite</button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-500 py-4">Nenhuma atividade da equipe neste ciclo.</p>}
                        </div>
                         <div className="mt-4 space-y-2">
                           <InfoRow label="Total Deixado pela Equipe" value={`R$ ${cyclePerformanceData.profissionais.totalDeixado.toFixed(2).replace('.', ',')}`} isTotal colorClass="text-blue-400" />
                           <InfoRow label="Total a Pagar para Equipe" value={`R$ ${cyclePerformanceData.profissionais.totalAPagar.toFixed(2).replace('.', ',')}`} isTotal colorClass="text-yellow-400" />
                        </div>
                    </section>

                    <section className="bg-gray-800 p-6 rounded-lg mt-8">
                        <h4 className="text-xl font-bold text-center mb-4">Resumo Final do Salão</h4>
                        <div className="space-y-3">
                            <InfoRow label="Temos na conta (Cartão + PIX)" value={`R$ ${(cyclePerformanceData.pagamentos.cartao + cyclePerformanceData.pagamentos.pix).toFixed(2).replace('.', ',')}`} />
                            <InfoRow label="Temos em dinheiro" value={`R$ ${cyclePerformanceData.pagamentos.dinheiro.toFixed(2).replace('.', ',')}`} />
                            <InfoRow label="Temos no total" value={`R$ ${cyclePerformanceData.geral.totalBruto.toFixed(2).replace('.', ',')}`} colorClass="text-green-400"/>
                            <InfoRow label="Temos de pagar de equipe" value={`- R$ ${cyclePerformanceData.profissionais.totalAPagar.toFixed(2).replace('.', ',')}`} colorClass="text-red-400"/>
                            <InfoRow label="Sobrou de lucro" value={`R$ ${cyclePerformanceData.geral.lucroLiquido.toFixed(2).replace('.', ',')}`} isTotal colorClass={cyclePerformanceData.geral.lucroLiquido >= 0 ? 'text-green-400' : 'text-red-400'}/>
                        </div>
                    </section>
                </div>
            </div>
            <EmployeeDetailsModal 
                isOpen={!!detailsModalData}
                onClose={() => setDetailsModalData(null)}
                performanceData={detailsModalData}
                cycle={currentCycle}
            />
             <PayslipModal
                isOpen={!!payslipModalData}
                onClose={() => setPayslipModalData(null)}
                performanceData={payslipModalData}
                cycle={currentCycle}
            />
        </>
    );
};

export default ManagementDashboard;