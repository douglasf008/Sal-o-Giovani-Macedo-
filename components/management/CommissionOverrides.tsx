import React, { useState, useMemo } from 'react';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { useServices } from '../../contexts/ServicesContext';
import { usePackages } from '../../contexts/PackagesContext';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';

const CommissionOverrides: React.FC = () => {
    const { professionals, updateProfessional } = useProfessionals();
    const { services } = useServices();
    const { packageTemplates } = usePackages();

    const [itemType, setItemType] = useState<'service' | 'package'>('service');
    const [selectedProfId, setSelectedProfId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [percentage, setPercentage] = useState('');

    const allOverrides = useMemo(() => {
        const overrides: { 
            prof: typeof professionals[0], 
            item: (typeof services[0] | typeof packageTemplates[0]), 
            itemType: 'service' | 'package', 
            override: { itemId: string, itemType: 'service' | 'package', percentage: number } 
        }[] = [];

        for (const prof of professionals) {
            if (prof.commissionOverrides) {
                for (const override of prof.commissionOverrides) {
                    const itemId = override.itemId || (override as any).serviceId;
                    const type = override.itemType || 'service';

                    if (type === 'service') {
                        const service = services.find(s => s.id === itemId);
                        if (service) {
                            overrides.push({ prof, item: service, itemType: 'service', override: { ...override, itemId, itemType: 'service'} });
                        }
                    } else if (type === 'package') {
                        const pkg = packageTemplates.find(p => p.id === itemId);
                        if (pkg) {
                            overrides.push({ prof, item: pkg, itemType: 'package', override: { ...override, itemId, itemType: 'package'} });
                        }
                    }
                }
            }
        }
        return overrides.sort((a,b) => a.prof.name.localeCompare(b.prof.name));
    }, [professionals, services, packageTemplates]);

    const handleSave = () => {
        const selectedItemId = itemType === 'service' ? selectedServiceId : selectedPackageId;

        if (!selectedProfId || !selectedItemId || !percentage) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        const prof = professionals.find(p => p.id === selectedProfId);
        if (!prof) return;

        const newPercentage = parseFloat(percentage.replace(',', '.'));
        if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
            alert("Porcentagem inválida. Insira um valor entre 0 e 100.");
            return;
        }

        const newOverride = { itemId: selectedItemId, itemType, percentage: newPercentage };
        
        const existingOverrides = prof.commissionOverrides ? [...prof.commissionOverrides] : [];
        const overrideIndex = existingOverrides.findIndex(o => o.itemId === selectedItemId);

        if (overrideIndex > -1) {
            existingOverrides[overrideIndex] = newOverride;
        } else {
            existingOverrides.push(newOverride);
        }

        const updatedProf = { ...prof, commissionOverrides: existingOverrides };
        updateProfessional(updatedProf);
        
        setSelectedProfId('');
        setSelectedServiceId('');
        setSelectedPackageId('');
        setPercentage('');
        setItemType('service');
    };

    const handleRemove = (profId: string, itemId: string) => {
        const prof = professionals.find(p => p.id === profId);
        if (!prof || !prof.commissionOverrides) return;

        const updatedOverrides = prof.commissionOverrides.filter(o => o.itemId !== itemId);
        const updatedProf = { ...prof, commissionOverrides: updatedOverrides };
        updateProfessional(updatedProf);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Comissões Especiais por Serviço ou Pacote</h2>
                <p className="text-gray-400">Defina uma porcentagem de comissão diferente para um funcionário em um serviço ou na venda de um pacote.</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Item</label>
                        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                            <button onClick={() => setItemType('service')} className={`w-full py-1.5 rounded-md text-xs font-semibold ${itemType === 'service' ? 'bg-gray-200 text-black' : ''}`}>Serviço</button>
                            <button onClick={() => setItemType('package')} className={`w-full py-1.5 rounded-md text-xs font-semibold ${itemType === 'package' ? 'bg-gray-200 text-black' : ''}`}>Pacote</button>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="prof-select" className="block text-sm font-medium text-gray-300 mb-2">Funcionário</label>
                        <select id="prof-select" value={selectedProfId} onChange={e => setSelectedProfId(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2">
                            <option value="">Selecione...</option>
                            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-1">
                        <label htmlFor="item-select" className="block text-sm font-medium text-gray-300 mb-2">{itemType === 'service' ? 'Serviço' : 'Pacote'}</label>
                        <select id="item-select" value={itemType === 'service' ? selectedServiceId : selectedPackageId} onChange={e => itemType === 'service' ? setSelectedServiceId(e.target.value) : setSelectedPackageId(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2">
                            <option value="">Selecione...</option>
                            {itemType === 'service' 
                                ? services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                : packageTemplates.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                            }
                        </select>
                    </div>
                    <div className="md:col-span-1 grid grid-cols-2 gap-2">
                        <div className="col-span-1">
                           <label htmlFor="percentage-input" className="block text-sm font-medium text-gray-300 mb-2">Comissão</label>
                           <input type="number" id="percentage-input" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="%" className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2" />
                        </div>
                        <div className="col-span-1 self-end">
                            <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                                <PlusIcon className="w-5 h-5" />
                                <span>Salvar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-semibold mb-3">Regras Ativas</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {allOverrides.length > 0 ? allOverrides.map(({ prof, item, itemType, override }) => (
                            <div key={`${prof.id}-${item.id}`} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{prof.name} - <span className="font-normal">{item.name} <span className="text-xs text-gray-400">[{itemType === 'package' ? 'Pacote' : 'Serviço'}]</span></span></p>
                                    <p className="text-sm text-gray-400">Comissão original: {'commissionPercentage' in item ? (item.commissionPercentage ?? 'Padrão') : 'N/A'}%</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-bold text-lg text-green-400">{override.percentage}%</p>
                                    <button onClick={() => handleRemove(prof.id, item.id)} className="p-2 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-4">Nenhuma regra de comissão especial cadastrada.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommissionOverrides;