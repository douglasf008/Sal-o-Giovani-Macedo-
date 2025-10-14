
import React from 'react';

interface DeleteServiceConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    serviceName: string;
    dependentAppointmentsCount: number;
}

const DeleteServiceConfirmationModal: React.FC<DeleteServiceConfirmationModalProps> = ({ isOpen, onClose, onConfirm, serviceName, dependentAppointmentsCount }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4">Confirmar Exclusão de Serviço</h2>
                <p className="text-gray-300 mb-2">
                    Tem certeza que deseja apagar o serviço <span className="font-bold text-white">{serviceName}</span>?
                </p>
                <p className="text-gray-300 mb-6">
                    Esta ação não pode ser desfeita.
                    {dependentAppointmentsCount > 0 && (
                        <span className="font-bold text-red-400"> {dependentAppointmentsCount} agendamento(s) associado(s) também serão apagados.</span>
                    )}
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

export default DeleteServiceConfirmationModal;
