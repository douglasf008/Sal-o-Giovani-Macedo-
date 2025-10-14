import React, { useState } from 'react';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';

const ManagementSettings: React.FC = () => {
    const [valeLimit, setValeLimit] = useState('300.00');

    const handleSave = () => {
        // In a real app, this would save to a backend/context
        alert('Configurações salvas com sucesso! (simulado)');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <div>
                <h2 className="text-2xl font-bold mb-4">Configurações Gerais de Gestão</h2>
            </div>
            
             {/* Vales (Advances) */}
            <section className="bg-gray-900 p-6 rounded-lg">
                 <div className="flex items-start gap-4">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400 mt-1 flex-shrink-0"/>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Gestão de Vales (Adiantamentos)</h3>
                        <p className="text-sm text-gray-400 mb-6">Defina limites para adiantamentos de funcionários.</p>
                        
                        <div>
                            <label htmlFor="vale-limit" className="block text-sm font-medium text-gray-300 mb-2">Limite Máximo para Parcelamento Automático (R$)</label>
                            <input
                                type="number"
                                id="vale-limit"
                                value={valeLimit}
                                onChange={(e) => setValeLimit(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Ex: 300.00"
                            />
                            <p className="text-xs text-gray-500 mt-2">Se o total de vales de um funcionário ultrapassar este valor no ciclo, o sistema sugerirá o parcelamento no pagamento.</p>
                        </div>
                    </div>
                </div>
            </section>

             <div className="flex justify-end mt-8">
                <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-base hover:bg-blue-500 transition-colors"
                >
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
};

export default ManagementSettings;