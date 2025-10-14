import React from 'react';
import { CashierSettings } from '../hooks/useCashierSettings';
import XIcon from './icons/XIcon';

interface CashierHeaderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: CashierSettings;
    onSettingsChange: (settings: CashierSettings) => void;
}

const FONT_OPTIONS = [
    { value: 'System Default', label: 'Padrão do Sistema' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: 'Playfair Display, serif', label: 'Playfair Display' },
    { value: 'Roboto Mono, monospace', label: 'Roboto Mono' },
    { value: 'Lobster, cursive', label: 'Lobster' },
];

const CashierHeaderSettingsModal: React.FC<CashierHeaderSettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
}) => {
    if (!isOpen) return null;

    const handleSettingChange = <K extends keyof CashierSettings>(key: K, value: CashierSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Personalizar Cabeçalho</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>
                
                <main className="space-y-6">
                    <div>
                        <label htmlFor="title-font" className="block text-sm font-medium text-gray-300 mb-2">Fonte do Título</label>
                        <select
                            id="title-font"
                            value={settings.titleFont}
                            onChange={(e) => handleSettingChange('titleFont', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            {FONT_OPTIONS.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="title-scale" className="block text-sm font-medium text-gray-300 mb-2">Tamanho do Título ({Math.round(settings.titleScale * 100)}%)</label>
                        <input
                            type="range"
                            id="title-scale"
                            min="0.8"
                            max="2"
                            step="0.1"
                            value={settings.titleScale}
                            onChange={(e) => handleSettingChange('titleScale', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label htmlFor="icon-scale" className="block text-sm font-medium text-gray-300 mb-2">Tamanho dos Ícones ({Math.round(settings.iconScale * 100)}%)</label>
                        <input
                            type="range"
                            id="icon-scale"
                            min="0.8"
                            max="2"
                            step="0.1"
                            value={settings.iconScale}
                            onChange={(e) => handleSettingChange('iconScale', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-300 mb-2">Posição do Título</span>
                         <div className="flex gap-4 bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => handleSettingChange('headerLayout', 'default')}
                                className={`w-full text-center rounded-md py-2 text-sm font-semibold transition-colors ${settings.headerLayout === 'default' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}
                            >
                                Padrão
                            </button>
                            <button
                                onClick={() => handleSettingChange('headerLayout', 'side-by-side')}
                                className={`w-full text-center rounded-md py-2 text-sm font-semibold transition-colors ${settings.headerLayout === 'side-by-side' ? 'bg-gray-200 text-black' : 'text-gray-300'}`}
                            >
                                Lado a lado
                            </button>
                        </div>
                    </div>
                </main>
                
                <footer className="mt-8">
                    <button onClick={onClose} className="w-full bg-gray-700 text-white font-bold py-2.5 rounded-lg text-lg hover:bg-gray-600 transition-colors">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CashierHeaderSettingsModal;
