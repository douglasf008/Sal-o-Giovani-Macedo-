
import React, { useState, useEffect } from 'react';
import { useSalonSettings } from '../../salonSettings';

const DefaultCommissionManagement: React.FC = () => {
    const { settings, saveSettings } = useSalonSettings();
    const [commission, setCommission] = useState(String(settings.defaultCommissionPercentage));
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setCommission(String(settings.defaultCommissionPercentage));
        setHasChanges(false);
    }, [settings.defaultCommissionPercentage]);

    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommission(e.target.value);
        setHasChanges(String(settings.defaultCommissionPercentage) !== e.target.value);
    };
    
    const handleSave = () => {
        const value = parseInt(commission, 10);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            saveSettings({ ...settings, defaultCommissionPercentage: value });
            alert('Comissão padrão salva com sucesso!');
            setHasChanges(false);
        } else {
            alert('Por favor, insira um valor de comissão válido (0-100).');
        }
    };

    const handleDiscard = () => {
        setCommission(String(settings.defaultCommissionPercentage));
        setHasChanges(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Comissão Padrão</h2>
                <p className="text-gray-400">Defina a porcentagem de comissão padrão para novos serviços.</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
                <div className="max-w-md">
                    <label htmlFor="defaultCommission" className="block text-sm font-medium text-gray-300 mb-2">Porcentagem padrão para serviços (%)</label>
                    <input
                        type="number"
                        id="defaultCommission"
                        value={commission}
                        onChange={handleCommissionChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="45"
                        min="0"
                        max="100"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Este valor será usado como padrão ao criar novos serviços no painel.
                    </p>
                </div>
                 {hasChanges && (
                    <div className="flex justify-end items-center gap-4 mt-6 border-t border-gray-700 pt-4">
                        <button
                            onClick={handleDiscard}
                            className="text-gray-400 font-bold py-2 px-6 rounded-lg text-base hover:text-white transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg text-base hover:bg-blue-500 transition-colors"
                        >
                            Salvar Comissão
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DefaultCommissionManagement;
