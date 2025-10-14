import React, { useState, useEffect, useMemo } from 'react';
import PlusIcon from '../icons/PlusIcon';
import { useVales, Vale } from '../../contexts/ValesContext';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { Professional } from '../../types';
import XIcon from '../icons/XIcon';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';

const ValeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: Omit<Vale, 'id' | 'status' | 'date'>, idToUpdate?: number) => void;
    professionals: Professional[];
    valeToEdit?: Vale | null;
}> = ({ isOpen, onClose, onConfirm, professionals, valeToEdit }) => {
    const isEditing = !!valeToEdit;
    const [employeeId, setEmployeeId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isInstallment, setIsInstallment] = useState(false);
    const [totalInstallments, setTotalInstallments] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (valeToEdit) {
                setEmployeeId(valeToEdit.employeeId);
                setAmount(String(valeToEdit.totalAmount));
                setDescription(valeToEdit.items[0]?.name || '');
                setIsInstallment(!!valeToEdit.installments);
                setTotalInstallments(valeToEdit.installments ? String(valeToEdit.installments.total) : '');
            } else {
                setEmployeeId(professionals[0]?.id || '');
                setAmount('');
                setDescription('');
                setIsInstallment(false);
                setTotalInstallments('');
            }
        }
    }, [valeToEdit, professionals, isOpen]);


    if (!isOpen) return null;

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount.replace(',', '.'));
        if (!employeeId || isNaN(numericAmount) || numericAmount <= 0 || !description.trim()) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        const numericTotalInstallments = parseInt(totalInstallments, 10);
        if (isInstallment && (isNaN(numericTotalInstallments) || numericTotalInstallments <= 1)) {
            alert('O número de parcelas deve ser maior que 1.');
            return;
        }

        const employee = professionals.find(p => p.id === employeeId);
        if (!employee) {
            alert('Funcionário não encontrado.');
            return;
        }

        const valeData: Omit<Vale, 'id' | 'status' | 'date'> = {
            employeeId,
            employeeName: employee.name,
            totalAmount: numericAmount,
            items: [{ name: description, quantity: 1, price: numericAmount }],
        };

        if (isInstallment) {
            valeData.installments = {
                total: numericTotalInstallments,
                paid: valeToEdit?.installments?.paid || 0,
            };
        }

        onConfirm(valeData, valeToEdit?.id);
    };
    
    const installmentValue = isInstallment && parseFloat(amount) > 0 && parseInt(totalInstallments) > 1 
        ? (parseFloat(amount) / parseInt(totalInstallments)).toFixed(2) 
        : null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Vale' : 'Registrar Novo Vale'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="vale-employee" className="block text-sm font-medium text-gray-300 mb-2">Funcionário</label>
                        <select
                            id="vale-employee"
                            value={employeeId}
                            onChange={e => setEmployeeId(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                        >
                            {professionals.map(prof => <option key={prof.id} value={prof.id}>{prof.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="vale-amount" className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
                        <input type="number" id="vale-amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="Ex: 50,00" />
                    </div>
                    <div>
                        <label htmlFor="vale-description" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                        <input type="text" id="vale-description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="Ex: Adiantamento de salário" />
                    </div>
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                        <div className="flex items-center">
                             <input
                                type="checkbox"
                                id="is-installment-checkbox"
                                checked={isInstallment}
                                onChange={(e) => setIsInstallment(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="is-installment-checkbox" className="ml-2 block text-sm text-gray-300">Parcelar este vale?</label>
                        </div>
                        {isInstallment && (
                            <div>
                                <label htmlFor="vale-installments" className="block text-sm font-medium text-gray-300 mb-2">Número de parcelas</label>
                                <input type="number" id="vale-installments" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="Ex: 3" min="2" />
                                {installmentValue && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Valor da parcela: <span className="font-bold text-white">{totalInstallments}x de R$ {installmentValue.replace('.', ',')}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 font-semibold rounded-lg hover:bg-blue-500">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const QuitConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    vale: Vale | null;
}> = ({ isOpen, onClose, onConfirm, vale }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4">Confirmar Quitação</h2>
                <p className="text-gray-300 mb-6">
                    Tem certeza que deseja quitar o vale de <span className="font-bold">R$ {vale?.totalAmount.toFixed(2).replace('.',',')}</span> para <span className="font-bold">{vale?.employeeName}</span>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors">
                        Quitar Vale
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteValeConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    vale: Vale | null;
}> = ({ isOpen, onClose, onConfirm, vale }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                <p className="text-gray-300 mb-6">
                    Tem certeza que deseja apagar o vale de <span className="font-bold">R$ {vale?.totalAmount.toFixed(2).replace('.',',')}</span> para <span className="font-bold">{vale?.employeeName}</span>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                        Apagar
                    </button>
                </div>
            </div>
        </div>
    );
};


const ValesManagement: React.FC = () => {
    const [innerTab, setInnerTab] = useState<'active' | 'paid'>('active');
    const { vales, addVale, updateVale, deleteVale, updateValeStatus } = useVales();
    const { professionals } = useProfessionals();

    const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [valeToProcess, setValeToProcess] = useState<Vale | null>(null);
    const [isValeModalOpen, setIsValeModalOpen] = useState(false);
    const [valeToEdit, setValeToEdit] = useState<Vale | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    
    const filteredVales = vales.filter(vale => 
        vale.status === (innerTab === 'active' ? 'Ativo' : 'Quitado')
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleQuitClick = (vale: Vale) => {
        setValeToProcess(vale);
        setIsQuitConfirmOpen(true);
    };

    const handleConfirmQuit = () => {
        if (valeToProcess) {
            updateValeStatus(valeToProcess.id, 'Quitado');
        }
        setIsQuitConfirmOpen(false);
        setValeToProcess(null);
    };

    const handleDeleteClick = (vale: Vale) => {
        setValeToProcess(vale);
        setIsDeleteConfirmOpen(true);
        setActiveMenuId(null);
    };

    const handleConfirmDelete = () => {
        if (valeToProcess) {
            deleteVale(valeToProcess.id);
        }
        setIsDeleteConfirmOpen(false);
        setValeToProcess(null);
    };
    
    const handleEditClick = (vale: Vale) => {
        setValeToEdit(vale);
        setIsValeModalOpen(true);
        setActiveMenuId(null);
    };
    
    const handleOpenAddModal = () => {
        setValeToEdit(null);
        setIsValeModalOpen(true);
    };

    const handleSaveVale = (data: Omit<Vale, 'id' | 'status' | 'date'>, idToUpdate?: number) => {
        if (idToUpdate && valeToEdit) {
            updateVale({ ...valeToEdit, ...data });
        } else {
            addVale({ ...data, date: new Date().toISOString() });
        }
        setIsValeModalOpen(false);
    };

    const getItemDescription = (vale: Vale) => {
        if (vale.items.length === 1) {
            return vale.items[0].name;
        }
        return `${vale.items.length} itens`;
    }

    return (
        <div className="space-y-6" onClick={() => activeMenuId !== null && setActiveMenuId(null)}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Gestão de Vales (Adiantamentos)</h2>
                    <p className="text-gray-400">Controle os adiantamentos e consumo interno dos funcionários.</p>
                </div>
                <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Registrar Novo Vale</span>
                </button>
            </div>

            <div className="bg-gray-900 rounded-lg">
                <div className="px-4 md:px-6 border-b border-gray-700">
                    <div className="flex space-x-6">
                        <button onClick={() => setInnerTab('active')} className={`py-3 text-sm font-semibold ${innerTab === 'active' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                            Vales Ativos
                        </button>
                        <button onClick={() => setInnerTab('paid')} className={`py-3 text-sm font-semibold ${innerTab === 'paid' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                            Histórico
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-0">
                    <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-gray-800 text-xs text-gray-400 uppercase font-semibold">
                        <div className="col-span-1">Funcionário</div>
                        <div className="col-span-1">Data</div>
                        <div className="col-span-1">Descrição</div>
                        <div className="col-span-1 text-right">Valor</div>
                        <div className="col-span-1 text-center">Ações</div>
                    </div>

                    <div className="space-y-4 md:space-y-0">
                        {filteredVales.length > 0 ? filteredVales.map(vale => (
                            <div key={vale.id} className="bg-gray-800 p-4 rounded-lg md:bg-transparent md:p-0 md:rounded-none md:grid md:grid-cols-5 md:gap-4 md:items-center md:px-6 md:py-4 md:border-b md:border-gray-800 hover:md:bg-gray-800/50 relative">
                                
                                <div className="flex justify-between items-center md:block">
                                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Funcionário</span>
                                    <span className="font-medium">{vale.employeeName}</span>
                                </div>
                                
                                <div className="flex justify-between items-center md:block border-t border-gray-700 pt-3 mt-3 md:border-0 md:p-0 md:m-0">
                                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Data</span>
                                    <span className="text-gray-300 text-sm">{new Date(vale.date).toLocaleDateString('pt-BR')}</span>
                                </div>

                                <div className="flex justify-between items-center md:block border-t border-gray-700 pt-3 mt-3 md:border-0 md:p-0 md:m-0">
                                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Descrição</span>
                                    <span className="text-gray-300 text-sm truncate" title={vale.items.map(i => i.name).join(', ')}>
                                        {getItemDescription(vale)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center md:block border-t border-gray-700 pt-3 mt-3 md:border-0 md:p-0 md:m-0 md:text-right">
                                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Valor</span>
                                    <div>
                                        <p className="font-semibold text-lg md:text-base">R$ {vale.totalAmount.toFixed(2).replace('.', ',')}</p>
                                        {vale.installments && (
                                            <p className="text-xs text-gray-400">(em {vale.installments.total}x)</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-gray-700 pt-4 mt-4 md:border-0 md:p-0 md:m-0 md:text-center">
                                    {vale.status === 'Ativo' ? (
                                        <div className="flex items-center justify-end md:justify-center gap-2">
                                            <button 
                                                onClick={() => handleQuitClick(vale)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-900/60 text-green-300 text-xs font-semibold rounded-lg hover:bg-green-800/80 transition-colors"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Quitar
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(vale.id === activeMenuId ? null : vale.id); }} className="p-2 rounded-full hover:bg-gray-700" aria-label="Mais opções">
                                                <EllipsisVerticalIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="inline-block px-3 py-1.5 text-xs rounded-full bg-gray-700 text-gray-300">
                                            Quitado
                                        </span>
                                    )}
                                </div>

                                {activeMenuId === vale.id && (
                                    <div className="absolute right-6 top-12 z-10 bg-gray-700 rounded-md shadow-lg py-1 w-28" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleEditClick(vale)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-600 flex items-center gap-2">
                                            <PencilIcon className="w-4 h-4"/> Editar
                                        </button>
                                        <button onClick={() => handleDeleteClick(vale)} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2">
                                            <TrashIcon className="w-4 h-4"/> Apagar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-12">Nenhum vale encontrado nesta categoria.</p>
                        )}
                    </div>
                </div>
            </div>

            <QuitConfirmationModal 
                isOpen={isQuitConfirmOpen}
                onClose={() => setIsQuitConfirmOpen(false)}
                onConfirm={handleConfirmQuit}
                vale={valeToProcess}
            />
            <DeleteValeConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                vale={valeToProcess}
            />
            <ValeModal
                isOpen={isValeModalOpen}
                onClose={() => {
                    setIsValeModalOpen(false);
                    setValeToEdit(null);
                }}
                onConfirm={handleSaveVale}
                professionals={professionals}
                valeToEdit={valeToEdit}
            />
        </div>
    );
};

export default ValesManagement;