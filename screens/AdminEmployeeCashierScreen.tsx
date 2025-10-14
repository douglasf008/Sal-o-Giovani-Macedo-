

import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';
import { ProcessedCartItem } from '../../types';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import ArrowTrendingUpIcon from '../../components/icons/ArrowTrendingUpIcon';
import ReceiptPercentIcon from '../../components/icons/ReceiptPercentIcon';
import UsersIcon from '../../components/icons/UsersIcon';
import ScissorsIcon from '../../components/icons/ScissorsIcon';
import { useAuth } from '../../contexts/AuthContext';

const AdminEmployeeCashierScreen: React.FC = () => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();

    const { professionals } = useProfessionals();
    const { sales } = useSalesHistory();
    const { loggedInProfessional } = useAuth();

    useEffect(() => {
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

    const dailyData = useMemo(() => {
        if (!employee) return null;

        const todayString = new Date().toDateString();
        const salesToday = sales.filter(sale => new Date(sale.date).toDateString() === todayString);

        const employeeItems: { item: ProcessedCartItem; sale: typeof sales[0] }[] = [];
        salesToday.forEach(sale => {
            sale.items.forEach(item => {
                if (item.professionalId === employee.id) {
                    employeeItems.push({ item, sale });
                }
            });
        });

        const totalSales = employeeItems.reduce((sum, { item }) => sum + item.finalPrice, 0);
        const totalCommission = employeeItems.reduce((sum, { item }) => sum + item.finalCommissionValue, 0);
        
        const uniqueClients = new Set<string>();
        employeeItems.forEach(({ sale }) => {
            sale.clientNames.forEach(name => uniqueClients.add(name));
        });

        return {
            totalSales,
            totalCommission,
            itemCount: employeeItems.length,
            clientCount: uniqueClients.size,
            items: employeeItems.sort((a, b) => new Date(b.sale.date).getTime() - new Date(a.sale.date).getTime()),
        };

    }, [employee, sales]);

    const canView = loggedInProfessional && (loggedInProfessional.permissions?.includes('Funcionários') || loggedInProfessional.id === employeeId);

    if (!employee || !canView) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <p>Funcionário não encontrado ou acesso não permitido.</p>
                <button onClick={() => navigate('/admin/funcionarios')} className="mt-4 text-blue-400">Voltar para Funcionários</button>
            </div>
        );
    }
    
    if (!dailyData) {
        return null; // or loading
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                <div className="text-center mx-auto">
                    <h1 className="text-xl font-bold">Caixa do Dia</h1>
                    <p className="text-sm text-gray-400">{employee.name}</p>
                </div>
                <div className="w-6"></div>
            </header>

            <main className="flex-grow overflow-y-auto p-6 space-y-8">
                {/* Summary Section */}
                <section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-900 p-4 rounded-lg">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-green-400 mb-2"/>
                            <p className="text-sm text-gray-400">Vendas (Bruto)</p>
                            <p className="text-2xl font-bold">R$ {dailyData.totalSales.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg">
                            <ReceiptPercentIcon className="w-6 h-6 text-blue-400 mb-2"/>
                            <p className="text-sm text-gray-400">Comissão Estimada</p>
                            <p className="text-2xl font-bold">R$ {dailyData.totalCommission.toFixed(2).replace('.', ',')}</p>
                        </div>
                         <div className="bg-gray-900 p-4 rounded-lg">
                            <UsersIcon className="w-6 h-6 text-yellow-400 mb-2"/>
                            <p className="text-sm text-gray-400">Clientes Atendidos</p>
                            <p className="text-2xl font-bold">{dailyData.clientCount}</p>
                        </div>
                         <div className="bg-gray-900 p-4 rounded-lg">
                            <ScissorsIcon className="w-6 h-6 text-purple-400 mb-2"/>
                            <p className="text-sm text-gray-400">Serviços/Produtos</p>
                            <p className="text-2xl font-bold">{dailyData.itemCount}</p>
                        </div>
                    </div>
                </section>
                
                {/* Sales List */}
                <section>
                    <h3 className="text-xl font-semibold mb-4">Vendas de Hoje</h3>
                     <div className="space-y-3">
                        {dailyData.items.length > 0 ? (
                            dailyData.items.map(({ item, sale }, index) => (
                                <div key={`${item.id}-${index}`} className="bg-gray-900 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{item.item.name}</p>
                                            <p className="text-sm text-gray-400">Cliente: {sale.clientNames.join(', ')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-lg">R$ {item.finalPrice.toFixed(2).replace('.', ',')}</p>
                                            <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm text-green-400 mt-2 pt-2 border-t border-gray-800">
                                        <span>Comissão: + R$ {item.finalCommissionValue.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-900 rounded-lg">
                                <p className="text-gray-500">Nenhuma venda registrada hoje.</p>
                            </div>
                        )}
                     </div>
                </section>
            </main>
        </div>
    );
};

export default AdminEmployeeCashierScreen;