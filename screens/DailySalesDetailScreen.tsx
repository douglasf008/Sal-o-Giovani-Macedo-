import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { SaleRecord } from '../types';

const DailySalesDetailScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { sales } = useSalesHistory();

    const selectedDate = location.state?.date; // Expects 'YYYY-MM-DD'

    if (!selectedDate) {
        // Handle case where no date is provided
        return (
            <div className="flex flex-col h-screen bg-black text-white p-4">
                <header className="flex items-center p-4 flex-shrink-0">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                    <h1 className="text-xl font-bold mx-auto">Erro</h1>
                    <div className="w-6"></div>
                </header>
                <main className="flex-grow flex items-center justify-center">
                    <p className="text-gray-400">Nenhuma data selecionada.</p>
                </main>
            </div>
        );
    }
    
    const salesForDate = sales
        .filter(sale => sale.date.startsWith(selectedDate))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <div className="text-center mx-auto">
                    <h1 className="text-xl font-bold">Vendas do Dia</h1>
                    <p className="text-sm text-gray-400">{formattedDate}</p>
                </div>
                <div className="w-6"></div>
            </header>
            
            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                {salesForDate.length > 0 ? (
                    salesForDate.map((sale: SaleRecord) => (
                        <div key={sale.id} className="bg-gray-900 p-4 rounded-lg">
                            <div className="flex justify-between items-start border-b border-gray-700 pb-3 mb-3">
                                <div>
                                    <p className="font-semibold">{sale.clientNames.join(', ')}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-green-400">R$ {sale.totals.total.toFixed(2).replace('.', ',')}</p>
                                    <p className="text-xs text-gray-400">{sale.payment.method}{sale.payment.installments && ` (${sale.payment.installments}x)`}</p>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm">
                                {sale.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-gray-300">
                                        <span>{item.item.name}</span>
                                        <span>R$ {item.finalPrice.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Nenhuma venda registrada para esta data.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DailySalesDetailScreen;