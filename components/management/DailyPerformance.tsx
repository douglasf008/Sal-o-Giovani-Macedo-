import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';
import { useCashier } from '../../contexts/CashierContext';
import { useVales } from '../../contexts/ValesContext';
import ChartIcon from '../icons/ChartIcon';
import DocumentTextIcon from '../../components/icons/DocumentTextIcon';

const DailyPerformance: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { professionals } = useProfessionals();
    const { sales } = useSalesHistory();
    const { cashierHistory, cashierState } = useCashier();
    const { vales } = useVales();
    const [period, setPeriod] = useState(7);
    const [visibleLines, setVisibleLines] = useState<string[]>(['salon']); // 'salon' is the ID for the total
    const navigate = useNavigate();

    const liveSessionSummary = useMemo(() => {
        if (!cashierState.isOpen || !cashierState.openTimestamp || cashierState.date !== selectedDate) {
            return null;
        }

        const openTime = new Date(cashierState.openTimestamp);

        const salesInSession = sales.filter(s => new Date(s.date) >= openTime);

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

        const sangriasInSession = (cashierState.transactions || []).filter(t => t.type === 'sangria' && new Date(t.timestamp) >= openTime);
        const totalSangrias = sangriasInSession.reduce((sum, t) => sum + t.amount, 0);
        
        const totalSales = salesInSession.reduce((sum, s) => sum + s.totals.total, 0);

        return {
            id: 'live-session',
            date: cashierState.date,
            closeTime: new Date().toISOString(),
            initialCash: cashierState.initialCash,
            finalCash: 0, // N/A for live
            difference: 0, // N/A for live
            totalSales: totalSales,
            payments,
            totalVales,
            totalSangrias,
            closedBy: '(Em Aberto)',
        };
    }, [cashierState, sales, vales, selectedDate]);


    const sessionsForDate = useMemo(() => {
        const closedSessions = cashierHistory
            .filter(h => h.date === selectedDate)
            .sort((a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime());

        if (liveSessionSummary) {
            return [liveSessionSummary, ...closedSessions];
        }

        return closedSessions;
    }, [cashierHistory, selectedDate, liveSessionSummary]);

    const getDailyData = useCallback((date: Date) => {
        const dateString = date.toDateString();
        const salesForDate = sales.filter(s => new Date(s.date).toDateString() === dateString);

        const total = salesForDate.reduce((sum, s) => sum + s.totals.total, 0);

        const employeePerformance = professionals.map(prof => {
            const revenue = salesForDate
                .flatMap(s => s.items)
                .filter(item => item.professionalId === prof.id)
                .reduce((sum, item) => sum + item.finalPrice, 0);
            return { name: prof.name, id: prof.id, revenue };
        });

        return { date, total, employees: employeePerformance };
    }, [sales, professionals]);

    const chartData = useMemo(() => {
        const data = Array.from({ length: period }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return getDailyData(d);
        }).reverse();

        return data.map(dayData => {
            const chartPoint: { [key: string]: string | number } = {
                name: dayData.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                'Salão': parseFloat(dayData.total.toFixed(2)),
            };
            dayData.employees.forEach(emp => {
                chartPoint[emp.name] = parseFloat(emp.revenue.toFixed(2));
            });
            return chartPoint;
        });
    }, [period, getDailyData]);

    const dataForSelectedDate = useMemo(() => {
        const d = new Date(selectedDate + 'T00:00:00');
        return getDailyData(d);
    }, [selectedDate, getDailyData]);
    
    const handleViewSales = () => {
        navigate('/admin/gestao/vendas-do-dia', { state: { date: selectedDate } });
    };

    const periodOptions = [7, 15, 30];
    const lineOptions = useMemo(() => [{ id: 'salon', name: 'Salão' }, ...professionals], [professionals]);
    const COLORS = ['#10B981', '#3B82F6', '#F97316', '#EC4899', '#8B5CF6', '#F59E0B', '#14B8A6'];

    const toggleLine = (id: string) => {
        setVisibleLines(prev =>
            prev.includes(id) ? prev.filter(lineId => lineId !== id) : [...prev, id]
        );
    };

    const SummaryRow: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color = 'text-gray-100' }) => (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">{label}</span>
            <span className={`font-semibold ${color}`}>{value}</span>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">Desempenho Diário</h2>
                    {dataForSelectedDate.total > 0 && (
                        <button
                            onClick={handleViewSales}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            <DocumentTextIcon className="w-5 h-5" />
                            <span>Ver Vendas do Dia</span>
                        </button>
                    )}
                </div>
                <div className="max-w-xs">
                    <label htmlFor="date-filter" className="block text-sm font-medium text-gray-400 mb-2">Filtrar por data</label>
                    <input
                        type="date"
                        id="date-filter"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-900 p-6 rounded-lg">
                     <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <ChartIcon className="w-5 h-5" />
                        Caixas do Dia
                    </h3>
                     {sessionsForDate.length > 0 ? (
                        <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-2">
                            {sessionsForDate.map(session => {
                                const isLive = session.id === 'live-session';
                                const differenceColor = isLive ? 'text-gray-100' : session.difference === 0 ? 'text-gray-100' : session.difference > 0 ? 'text-green-400' : 'text-red-400';
                                return (
                                    <div key={session.id} className={`p-4 rounded-lg space-y-2 ${isLive ? 'bg-blue-900/50 border border-blue-700' : 'bg-gray-800'}`}>
                                        <div className="flex justify-between items-baseline border-b border-gray-700 pb-2">
                                            <p className="font-bold">
                                                {isLive ? 'Caixa Atual (Em Aberto)' : `Fechado às ${new Date(session.closeTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                            </p>
                                            {!isLive && <p className="text-xs text-gray-400">por {session.closedBy}</p>}
                                        </div>
                                        <SummaryRow label="Rendimento (Bruto)" value={`R$ ${session.totalSales.toFixed(2).replace('.', ',')}`} color="text-green-400" />
                                        <SummaryRow label="Troco Inicial" value={`R$ ${session.initialCash.toFixed(2).replace('.', ',')}`} />
                                        {isLive ? (
                                             <SummaryRow label="Dinheiro em Caixa (Estimado)" value={`R$ ${(session.initialCash + session.payments.cash - session.totalSangrias).toFixed(2).replace('.', ',')}`} />
                                        ) : (
                                            <>
                                                <SummaryRow label="Dinheiro Contado" value={`R$ ${session.finalCash.toFixed(2).replace('.', ',')}`} />
                                                <SummaryRow label="Diferença" value={`R$ ${session.difference.toFixed(2).replace('.', ',')}`} color={differenceColor} />
                                            </>
                                        )}
                                    </div>
                                );
                             })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-gray-500">
                            <p>Nenhum caixa aberto ou fechado nesta data.</p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 bg-gray-900 p-6 rounded-lg">
                     <h3 className="text-lg font-semibold text-gray-300 mb-4">Rendimento por Funcionário (Dia Completo)</h3>
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                        {dataForSelectedDate.employees.filter(e => e.revenue > 0).sort((a,b) => b.revenue - a.revenue).map(emp => (
                            <div key={emp.name} className="flex justify-between items-center text-sm">
                                <p className="text-gray-300">{emp.name}</p>
                                <p className="font-semibold text-gray-100">R$ {emp.revenue.toFixed(2).replace('.', ',')}</p>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Comparativo de Rendimento (Últimos dias)</h3>
                
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Período</h4>
                        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                            {periodOptions.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${period === p ? 'bg-gray-200 text-black' : 'text-gray-300'}`}
                                >
                                    {p} dias
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Mostrar no gráfico</h4>
                        <div className="flex flex-wrap items-center gap-2">
                             {lineOptions.map((opt, index) => (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleLine(opt.id)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                                        visibleLines.includes(opt.id) ? 'text-white' : 'text-gray-400 bg-gray-800'
                                    }`}
                                    style={{ 
                                        backgroundColor: visibleLines.includes(opt.id) ? COLORS[index % COLORS.length] : undefined
                                    }}
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R$${value}`} width={70} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                                labelStyle={{ color: '#F9FAFB' }}
                                formatter={(value: number, name: string) => [`R$ ${value.toFixed(2).replace('.', ',')}`, name]}
                            />
                            <Legend />
                            {lineOptions.map((opt, index) => {
                                if (visibleLines.includes(opt.id)) {
                                    return (
                                        <Line
                                            key={opt.id}
                                            type="monotone"
                                            dataKey={opt.name}
                                            name={opt.name}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    );
                                }
                                return null;
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DailyPerformance;