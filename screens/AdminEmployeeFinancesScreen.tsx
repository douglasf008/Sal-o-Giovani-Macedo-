import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';
import { useVales } from '../../contexts/ValesContext';
import { usePaymentCycle } from '../../hooks/usePaymentCycle';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../components/icons/ChevronRightIcon';
import ArrowTrendingUpIcon from '../../components/icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../../components/icons/ArrowTrendingDownIcon';
import CurrencyDollarIcon from '../../components/icons/CurrencyDollarIcon';
import ReceiptPercentIcon from '../../components/icons/ReceiptPercentIcon';
import { ProcessedCartItem, Professional } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useFinancials } from '../../contexts/FinancialsContext';
import PayslipModal from '../../components/PayslipModal';
import DocumentTextIcon from '../../components/icons/DocumentTextIcon';

const AdminEmployeeFinancesScreen: React.FC = () => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const [cycleOffset, setCycleOffset] = useState(0);
    const [activeTab, setActiveTab] = useState<'sales' | 'vales'>('sales');
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

    const { professionals } = useProfessionals();
    const { sales } = useSalesHistory();
    const { vales } = useVales();
    const { currentCycle } = usePaymentCycle(cycleOffset);
    const { loggedInProfessional } = useAuth();
    const { settings: financialSettings } = useFinancials();

    useEffect(() => {
        if (!employeeId) return; // Wait for employeeId to be available

        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
            return;
        }
        
        const canView = loggedInProfessional.permissions?.includes('Funcionários') || loggedInProfessional.id === employeeId;

        if (!canView) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate, employeeId]);

    const employee = useMemo(() => professionals.find(p => p.id === employeeId), [professionals, employeeId]);

    const performanceData = useMemo(() => {
        if (!employee) return null;

        const salesInCycle = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const isAfterStart = saleDate >= currentCycle.startDate;
            const isBeforeEnd = saleDate <= currentCycle.endDate;
            const involvesEmployee = sale.items.some(item => item.professionalId === employee.id);
            return isAfterStart && isBeforeEnd && involvesEmployee;
        });
        
        const valesInCycle = vales.filter(vale => {
            const valeDate = new Date(vale.date);
            const isAfterStart = valeDate >= currentCycle.startDate;
            const isBeforeEnd = valeDate <= currentCycle.endDate;
            const isForEmployee = vale.employeeId === employee.id;
            return isAfterStart && isBeforeEnd && isForEmployee;
        });

        const salesItems = salesInCycle.flatMap(s => s.items.filter(item => item.professionalId === employee.id));
        
        const totalSales = salesItems.reduce((sum, item) => sum + item.finalPrice, 0);
        const totalCommission = salesItems.reduce((sum, item) => sum + item.finalCommissionValue, 0);
        const totalVales = valesInCycle.reduce((sum, vale) => sum + vale.totalAmount, 0);

        const getProratedMonthlyValue = (monthlyValue: number) => {
            switch (financialSettings.cycleConfig.cycleType) {
                case 'days_5_20':
                    return monthlyValue / 2;
                case 'weekly':
                    return monthlyValue / 4;
                case 'day_5':
                case 'business_day':
                default:
                    return monthlyValue;
            }
        };

        const fixedSalary = (() => {
            if (employee.employmentType !== 'salaried' || !employee.isSalaryActive || !employee.fixedSalary) {
                return 0;
            }
            return getProratedMonthlyValue(employee.fixedSalary);
        })();

        const salaryPaidToDetails = professionals.filter(p => p.salarySource === employee.id && p.isSalaryActive && p.fixedSalary && p.fixedSalary > 0);
        const salaryDeductions = salaryPaidToDetails.reduce((sum, p) => sum + getProratedMonthlyValue(p.fixedSalary!), 0);

        const totalTip = salesInCycle.reduce((tipSum, sale) => {
            if (!sale.totals.tip || sale.totals.tip <= 0) return tipSum;

            const employeeItemsInSale = sale.items.filter(item => item.professionalId === employee.id);
            if (employeeItemsInSale.length === 0) return tipSum;

            const employeeValueInSale = employeeItemsInSale.reduce((sum, item) => sum + item.finalPrice, 0);
            const totalSaleValue = sale.items.reduce((sum, item) => sum + item.finalPrice, 0);

            if (totalSaleValue > 0) {
                const employeeShare = employeeValueInSale / totalSaleValue;
                tipSum += sale.totals.tip * employeeShare;
            }
            return tipSum;
        }, 0);

        const netToReceive = (totalCommission + fixedSalary + totalTip) - (totalVales + salaryDeductions);

        const itemToSaleMap = new Map<ProcessedCartItem, (typeof sales)[0]>();
        salesInCycle.forEach(sale => {
            sale.items.forEach(item => {
                if (item.professionalId === employee.id) {
                    itemToSaleMap.set(item, sale);
                }
            });
        });

        const sortedSalesItems = [...salesItems].sort((a, b) => {
            const saleA = itemToSaleMap.get(a);
            const saleB = itemToSaleMap.get(b);
            if (!saleA || !saleB) return 0;
            return new Date(saleA.date).getTime() - new Date(saleB.date).getTime();
        });

        return {
            prof: employee,
            totalSales,
            totalCommission,
            totalTip,
            fixedSalary,
            salaryDeductions,
            salaryPaidTo: salaryPaidToDetails.map(p => ({ name: p.name, amount: getProratedMonthlyValue(p.fixedSalary!) })),
            totalVales,
            netToReceive,
            salesItems: sortedSalesItems,
            valesItems: valesInCycle.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            itemToSaleMap,
        };

    }, [employee, currentCycle, sales, vales, financialSettings.cycleConfig, professionals]);

    const canView = loggedInProfessional && (loggedInProfessional.permissions?.includes('Funcionários') || loggedInProfessional.id === employeeId);

    if (!employee || !canView) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <p>Funcionário não encontrado ou acesso não permitido.</p>
                <button onClick={() => navigate('/admin/funcionarios')} className="mt-4 text-blue-400">Voltar para Funcionários</button>
            </div>
        );
    }
    
    if (!performanceData) {
        return null; // or loading
    }

    const getSaleDetails = (item: ProcessedCartItem) => {
        const saleRecord = performanceData?.itemToSaleMap.get(item);
        return {
            clientName: saleRecord ? saleRecord.clientNames.join(', ') : 'Cliente',
            date: saleRecord ? new Date(saleRecord.date).toLocaleDateString('pt-BR') : '-'
        };
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                <div className="text-center mx-auto">
                    <h1 className="text-xl font-bold">Finanças</h1>
                    <p className="text-sm text-gray-400">{employee.name}</p>
                </div>
                <div className="w-6"></div>
            </header>

            <main className="flex-grow overflow-y-auto p-6 space-y-8">
                {/* Cycle Navigation and Summary */}
                <section className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-300">Resumo do Ciclo</h3>
                            <p className="text-sm text-gray-500">
                                {currentCycle.startDate.toLocaleDateString('pt-BR')} - {currentCycle.endDate.toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCycleOffset(o => o - 1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Ciclo anterior">
                                <ChevronLeftIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => setCycleOffset(o => o + 1)} disabled={cycleOffset >= 0} className="p-2 rounded-full hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Próximo ciclo">
                                <ChevronRightIcon className="w-5 h-5"/>
                            </button>
                             <button
                                onClick={() => setIsPayslipModalOpen(true)}
                                className="ml-4 flex items-center gap-2 px-3 py-2 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                <DocumentTextIcon className="w-5 h-5" />
                                Gerar Holerite
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-green-400 mb-2"/>
                            <p className="text-sm text-gray-400">Vendas (Bruto)</p>
                            <p className="text-2xl font-bold">R$ {performanceData?.totalSales.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <ReceiptPercentIcon className="w-6 h-6 text-blue-400 mb-2"/>
                            <p className="text-sm text-gray-400">Comissão Total</p>
                            <p className="text-2xl font-bold">R$ {performanceData?.totalCommission.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <ArrowTrendingDownIcon className="w-6 h-6 text-red-400 mb-2"/>
                            <p className="text-sm text-gray-400">Descontos</p>
                            <p className="text-2xl font-bold">R$ {performanceData?.totalVales.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <CurrencyDollarIcon className="w-6 h-6 text-yellow-400 mb-2"/>
                            <p className="text-sm text-gray-400">Líquido a Receber</p>
                            <p className="text-2xl font-bold">R$ {performanceData?.netToReceive.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </section>

                {/* Details Section */}
                <section>
                    <div className="border-b border-gray-700">
                        <div className="flex space-x-6">
                            <button onClick={() => setActiveTab('sales')} className={`py-3 text-sm font-semibold ${activeTab === 'sales' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                                Vendas ({performanceData?.salesItems.length})
                            </button>
                            <button onClick={() => setActiveTab('vales')} className={`py-3 text-sm font-semibold ${activeTab === 'vales' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                                Vales e Descontos ({performanceData?.valesItems.length})
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {activeTab === 'sales' && (
                            performanceData?.salesItems.length > 0 ? performanceData.salesItems.map(item => {
                                const { clientName, date } = getSaleDetails(item);
                                return (
                                <div key={item.id} className="bg-gray-900 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{item.item.name}</p>
                                            <p className="text-sm text-gray-400">Cliente: {clientName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-lg">R$ {item.finalPrice.toFixed(2).replace('.', ',')}</p>
                                            <p className="text-xs text-gray-500">{date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm text-green-400 mt-2 pt-2 border-t border-gray-800">
                                        <span>Comissão: + R$ {item.finalCommissionValue.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            )}) : <p className="text-center text-gray-500 py-8">Nenhuma venda registrada neste ciclo.</p>
                        )}

                        {activeTab === 'vales' && (
                             performanceData?.valesItems.length > 0 ? performanceData.valesItems.map(vale => (
                                <div key={vale.id} className="bg-gray-900 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{vale.items.map(i => i.name).join(', ')}</p>
                                            <p className="text-sm text-gray-400">Status: {vale.status}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-semibold text-lg text-red-400">- R$ {vale.totalAmount.toFixed(2).replace('.', ',')}</p>
                                            <p className="text-xs text-gray-500">{new Date(vale.date).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-500 py-8">Nenhum vale ou desconto neste ciclo.</p>
                        )}
                    </div>
                </section>
            </main>
            {performanceData && (
                <PayslipModal
                    isOpen={isPayslipModalOpen}
                    onClose={() => setIsPayslipModalOpen(false)}
                    performanceData={performanceData}
                    cycle={currentCycle}
                />
            )}
        </div>
    );
};

export default AdminEmployeeFinancesScreen;