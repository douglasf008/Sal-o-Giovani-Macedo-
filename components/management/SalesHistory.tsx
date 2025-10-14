import React, { useState, useMemo } from 'react';
import { useSalesHistory } from '../../contexts/SalesHistoryContext';
import { useClients } from '../../contexts/ClientsContext';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { SaleRecord, ProcessedCartItem, Professional } from '../../types';
import XIcon from '../icons/XIcon';

const SaleDetailModal: React.FC<{ sale: SaleRecord; onClose: () => void; professionals: Professional[] }> = ({ sale, onClose, professionals }) => {
    return (
       <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
           <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full shadow-lg flex flex-col h-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <header className="flex justify-between items-center mb-4 flex-shrink-0">
                   <div>
                       <h2 className="text-xl font-bold">Detalhes da Venda</h2>
                       <p className="text-sm text-gray-400">ID: ...{sale.id.slice(-6)}</p>
                   </div>
                   <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"><XIcon className="w-5 h-5" /></button>
               </header>

               <main className="flex-grow overflow-y-auto pr-2 space-y-4 text-sm">
                   <div className="bg-gray-800 p-3 rounded-lg">
                       <p><span className="text-gray-400">Data:</span> {new Date(sale.date).toLocaleString('pt-BR')}</p>
                       <p><span className="text-gray-400">Cliente(s):</span> {sale.clientNames.join(', ')}</p>
                       <p><span className="text-gray-400">Pagamento:</span> {sale.payment.method}{sale.payment.installments && sale.payment.installments > 1 && ` (${sale.payment.installments}x)`}</p>
                   </div>

                   <div>
                       <h3 className="font-semibold mb-2">Itens</h3>
                       <div className="space-y-2">
                           {sale.items.map((item: ProcessedCartItem, index: number) => (
                               <div key={item.id + '-' + index} className="bg-gray-800 p-3 rounded-md">
                                   <div className="flex justify-between font-semibold">
                                       <p>{item.item.name}</p>
                                       <p>R$ {item.finalPrice.toFixed(2).replace('.', ',')}</p>
                                   </div>
                                   <p className="text-xs text-gray-400">Profissional: {item.professionalId ? professionals.find(p => p.id === item.professionalId)?.name : 'N/A'}</p>
                                   {item.manualDiscount > 0 && <p className="text-xs text-yellow-400">Desconto: - R$ {item.manualDiscount.toFixed(2).replace('.', ',')}</p>}
                               </div>
                           ))}
                       </div>
                   </div>
                    <div className="bg-gray-800 p-3 rounded-lg mt-4 text-right space-y-1">
                       <p><span className="text-gray-400">Subtotal:</span> R$ {sale.totals.subtotal.toFixed(2).replace('.', ',')}</p>
                       {sale.totals.discount > 0 && <p><span className="text-gray-400">Desconto:</span> - R$ {sale.totals.discount.toFixed(2).replace('.', ',')}</p>}
                       {sale.totals.tip > 0 && <p><span className="text-gray-400">Gorjeta:</span> + R$ {sale.totals.tip.toFixed(2).replace('.', ',')}</p>}
                       <p className="font-bold text-lg"><span className="text-gray-300">Total:</span> R$ {sale.totals.total.toFixed(2).replace('.', ',')}</p>
                   </div>
               </main>
           </div>
       </div>
   );
}


const SalesHistory: React.FC = () => {
    const { sales } = useSalesHistory();
    const { clients } = useClients();
    const { professionals } = useProfessionals();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedProfId, setSelectedProfId] = useState('');
    const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);

    const filteredSales = useMemo(() => {
        let filtered = [...sales];

        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            filtered = filtered.filter(sale => new Date(sale.date) >= start);
        }
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59');
            filtered = filtered.filter(sale => new Date(sale.date) <= end);
        }
        if (selectedClientId) {
            filtered = filtered.filter(sale => sale.clientIds.includes(selectedClientId));
        }
        if (selectedProfId) {
            filtered = filtered.filter(sale => sale.items.some(item => item.professionalId === selectedProfId));
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, startDate, endDate, selectedClientId, selectedProfId]);

    const totalFilteredSales = useMemo(() => {
        return filteredSales.reduce((sum, sale) => sum + sale.totals.total, 0);
    }, [filteredSales]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Histórico de Vendas</h2>
                <p className="text-gray-400">Consulte todas as vendas registradas no sistema.</p>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">Data Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-800 p-2 rounded-md mt-1" style={{ colorScheme: 'dark' }}/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Data Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-800 p-2 rounded-md mt-1" style={{ colorScheme: 'dark' }}/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Cliente</label>
                        <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full bg-gray-800 p-2 rounded-md mt-1">
                            <option value="">Todos</option>
                            {clients.sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Profissional</label>
                        <select value={selectedProfId} onChange={e => setSelectedProfId(e.target.value)} className="w-full bg-gray-800 p-2 rounded-md mt-1">
                            <option value="">Todos</option>
                            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-semibold">Resultados ({filteredSales.length})</h3>
                     <p className="font-bold text-lg text-green-400">Total: R$ {totalFilteredSales.toFixed(2).replace('.',',')}</p>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {filteredSales.map(sale => (
                        <div key={sale.id} onClick={() => setSelectedSale(sale)} className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{sale.clientNames.join(', ')}</p>
                                    <p className="text-xs text-gray-400">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">R$ {sale.totals.total.toFixed(2).replace('.',',')}</p>
                                    <p className="text-xs text-gray-400">{sale.payment.method}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredSales.length === 0 && <p className="text-center text-gray-500 py-10">Nenhuma venda encontrada com os filtros selecionados.</p>}
                </div>
            </div>
            {selectedSale && <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} professionals={professionals} />}
        </div>
    );
};

export default SalesHistory;