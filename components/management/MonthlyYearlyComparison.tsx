import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const getCalendarMonthDates = (month: number, year: number): { startDate: Date; endDate: Date } => {
    // For a monthly comparison view, using the calendar month is the most intuitive and correct approach.
    // The previous logic attempted to use payment cycles but was flawed, especially for historical data.
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
};

const MonthlyYearlyComparison: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [dataType, setDataType] = useState<'gross' | 'net'>('gross');
    const { sales } = useSalesHistory();
    const currentYear = new Date().getFullYear();

    const comparisonData = useMemo(() => {
        const yearsToCompare = [currentYear - 2, currentYear - 1, currentYear];
        
        const chartDataObject: { name: string, [key: string]: string | number } = {
            name: MONTHS[selectedMonth],
        };

        yearsToCompare.forEach(year => {
            const { startDate, endDate } = getCalendarMonthDates(selectedMonth, year);
            
            const salesInPeriod = sales.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            });
            
            const totalGrossSales = salesInPeriod.reduce((sum, sale) => sum + sale.totals.total, 0);

            if (dataType === 'gross') {
                chartDataObject[String(year)] = parseFloat(totalGrossSales.toFixed(2));
            } else { // 'net'
                 const totalCommissions = salesInPeriod.reduce((commissionSum, sale) => {
                    const saleCommission = sale.items.reduce((itemSum, item) => itemSum + item.finalCommissionValue, 0);
                    return commissionSum + saleCommission;
                }, 0);
                const totalNetSales = totalGrossSales - totalCommissions;
                chartDataObject[String(year)] = parseFloat(totalNetSales.toFixed(2));
            }
        });

        return [chartDataObject];
    }, [selectedMonth, dataType, sales, currentYear]);

    const years = [currentYear - 2, currentYear - 1, currentYear];
    const COLORS = ['#3B82F6', '#10B981', '#F97316'];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Comparativo Mensal Ano a Ano</h2>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                     <div className="w-full md:max-w-xs">
                        <label htmlFor="month-select" className="block text-sm font-medium text-gray-400 mb-2">Selecione o Mês</label>
                        <select
                            id="month-select"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            {MONTHS.map((month, index) => (
                                <option key={month} value={index}>{month}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Visualizar</h4>
                        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => setDataType('gross')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${dataType === 'gross' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}
                            >
                                Total Bruto
                            </button>
                            <button
                                onClick={() => setDataType('net')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${dataType === 'net' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}
                            >
                                Total Líquido
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">
                    Faturamento {dataType === 'gross' ? 'Bruto' : 'Líquido'} de {MONTHS[selectedMonth]}
                </h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={comparisonData}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                            <XAxis type="category" dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R$${(Number(value)/1000).toFixed(0)}k`} />
                            <Tooltip
                                cursor={{ fill: 'rgba(75, 85, 99, 0.3)' }}
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                                labelStyle={{ color: '#F9FAFB' }}
                                formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, `Faturamento ${dataType === 'gross' ? 'Bruto' : 'Líquido'}`]}
                            />
                            <Legend />
                            {years.map((year, index) => (
                                <Bar key={year} dataKey={String(year)} name={String(year)} fill={COLORS[index % COLORS.length]} barSize={50} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default MonthlyYearlyComparison;