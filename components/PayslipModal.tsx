import React from 'react';
import { Professional, ProcessedCartItem } from '../types';
import { Vale } from '../contexts/ValesContext';
import XIcon from './icons/XIcon';
import PrinterIcon from './icons/PrinterIcon';

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
    salesItems: ProcessedCartItem[];
    valesItems: Vale[];
}

interface PayslipModalProps {
    isOpen: boolean;
    onClose: () => void;
    performanceData: ProfessionalPerformance | null;
    cycle: {
        startDate: Date;
        endDate: Date;
    };
}

const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, performanceData, cycle }) => {

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen || !performanceData) return null;

    const { prof, totalCommission, totalTip, fixedSalary, totalVales, salaryDeductions, netToReceive } = performanceData;

    const totalEarnings = totalCommission + fixedSalary + totalTip;
    const totalDeductions = totalVales + salaryDeductions;

    const printStyles = `
        @media print {
            body * {
                visibility: hidden;
            }
            #payslip-content, #payslip-content * {
                visibility: visible;
            }
            #payslip-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: #000 !important;
                background: #fff !important;
                font-family: Arial, sans-serif;
                font-size: 12px;
                padding: 40px;
            }
            .print-hidden {
                display: none !important;
            }
            .payslip-header h1 { font-size: 24px; font-weight: bold; }
            .payslip-header p { font-size: 16px; }
            .payslip-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 11px; margin-bottom: 1.5rem; }
            .payslip-text-right { text-align: right; }
            .payslip-section-title {
                font-weight: bold;
                font-size: 14px;
                border-bottom: 1px solid #666;
                padding-bottom: 5px;
                margin-bottom: 10px;
                margin-top: 20px;
                color: #000 !important;
            }
            .payslip-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px dotted #ccc;
            }
            .payslip-summary {
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 2px solid #333;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 1rem;
                text-align: center;
            }
            .payslip-summary-item p:first-child { font-size: 11px; color: #555; }
            .payslip-summary-item p:last-child { font-size: 14px; font-weight: bold; }
            .payslip-final-total {
                background-color: #eee;
                padding: 8px;
                border-radius: 8px;
            }
            .payslip-signature {
                 margin-top: 4rem;
                 text-align: center;
                 font-size: 11px;
            }
            .payslip-signature p:first-child {
                border-bottom: 1px solid #555;
                display: inline-block;
                padding: 0 50px 2px;
                margin-bottom: 5px;
            }
        }
    `;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <style>{printStyles}</style>
            <div className="bg-gray-900 rounded-lg max-w-2xl w-full shadow-lg flex flex-col h-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0 print-hidden">
                    <h2 className="text-xl font-bold">Holerite de Pagamento</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"><XIcon className="w-5 h-5" /></button>
                </header>

                <main id="payslip-content" className="flex-grow overflow-y-auto p-6 text-white">
                    <div className="payslip-header text-center border-b border-gray-700 pb-4 mb-6">
                        <h1 className="text-2xl font-bold">Salão Giovani Macedo</h1>
                        <p className="text-lg">Recibo de Pagamento</p>
                    </div>
                    
                    <div className="payslip-grid-2 text-sm mb-6">
                        <div>
                            <p className="text-gray-400">FUNCIONÁRIO</p>
                            <p className="font-semibold">{prof.name}</p>
                        </div>
                        <div className="payslip-text-right">
                            <p className="text-gray-400">PERÍODO DE APURAÇÃO</p>
                            <p className="font-semibold">{cycle.startDate.toLocaleDateString('pt-BR')} - {cycle.endDate.toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="payslip-grid-2 gap-8">
                        {/* Earnings */}
                        <div>
                            <h3 className="payslip-section-title text-green-400 border-b border-green-800 pb-2 mb-2">PROVENTOS</h3>
                            <div className="space-y-2">
                                <div className="payslip-row">
                                    <span>Comissões sobre vendas</span>
                                    <span className="font-mono">R$ {totalCommission.toFixed(2).replace('.', ',')}</span>
                                </div>
                                {totalTip > 0 && (
                                    <div className="payslip-row">
                                        <span>Gorjetas</span>
                                        <span className="font-mono">R$ {totalTip.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                                {fixedSalary > 0 && (
                                     <div className="payslip-row">
                                        <span>Salário Fixo</span>
                                        <span className="font-mono">R$ {fixedSalary.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deductions */}
                        <div>
                             <h3 className="payslip-section-title text-red-400 border-b border-red-800 pb-2 mb-2">DESCONTOS</h3>
                             <div className="space-y-2">
                                 {totalVales > 0 && (
                                     <div className="payslip-row">
                                        <span>Vales / Adiantamentos</span>
                                        <span className="font-mono">R$ {totalVales.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                 )}
                                 {salaryDeductions > 0 && (
                                     <div className="payslip-row">
                                        <span>Salários Pagos (dedução)</span>
                                        <span className="font-mono">R$ {salaryDeductions.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                 )}
                                  {totalDeductions === 0 && (
                                     <div className="payslip-row text-gray-500">
                                        <span>Nenhum desconto no período</span>
                                        <span className="font-mono">R$ 0,00</span>
                                    </div>
                                  )}
                             </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="payslip-summary mt-8 pt-4 border-t-2 border-gray-600">
                        <div className="payslip-summary-item">
                            <p className="text-sm text-gray-400">Total de Proventos</p>
                            <p className="font-bold text-lg text-green-400">R$ {totalEarnings.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="payslip-summary-item">
                            <p className="text-sm text-gray-400">Total de Descontos</p>
                            <p className="font-bold text-lg text-red-400">R$ {totalDeductions.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="payslip-summary-item payslip-final-total bg-gray-800 p-2 rounded-lg">
                            <p className="text-sm text-gray-300">Líquido a Receber</p>
                            <p className={`font-extrabold text-xl ${netToReceive >= 0 ? 'text-green-300' : 'text-red-300'}`}>R$ {netToReceive.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                    
                    <div className="payslip-signature mt-12 text-center text-xs text-gray-500">
                        <p>_________________________________________</p>
                        <p>{prof.name}</p>
                    </div>
                </main>

                 <footer className="flex justify-end items-center gap-4 p-4 border-t border-gray-700 flex-shrink-0 print-hidden">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Fechar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 active:bg-blue-700 transition-colors"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        <span>Imprimir</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PayslipModal;