import React, { useState } from 'react';
import { useDocuments } from '../../contexts/DocumentsContext';
import { SalonDocument } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import AddDocumentModal from './AddDocumentModal';

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    documentName: string;
}> = ({ isOpen, onClose, onConfirm, documentName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                <p className="text-gray-300 mb-6">
                    Tem certeza que deseja apagar o documento <span className="font-bold text-white">"{documentName}"</span>?
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 rounded-lg">Apagar</button>
                </div>
            </div>
        </div>
    );
};


const SalonDocuments: React.FC = () => {
    const { documents, addDocument, deleteDocument } = useDocuments();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<SalonDocument | null>(null);

    const handleSave = (data: { title: string; fileDataUrl: string; fileName: string; fileType: string; }) => {
        addDocument(data);
    };

    const handleDelete = () => {
        if (docToDelete) {
            deleteDocument(docToDelete.id);
            setDocToDelete(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Documentos do Salão</h2>
                        <p className="text-gray-400">Guarde documentos importantes como alvarás, contratos e planilhas.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Adicionar Documento</span>
                    </button>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {documents.length > 0 ? (
                            documents.map(doc => (
                                <div key={doc.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <DocumentTextIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold">{doc.title}</p>
                                            <p className="text-xs text-gray-400">
                                                Adicionado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <a
                                            href={doc.fileDataUrl}
                                            download={doc.fileName}
                                            className="p-2 text-gray-400 hover:text-white"
                                            title="Baixar documento"
                                        >
                                            <ArrowDownTrayIcon className="w-5 h-5"/>
                                        </a>
                                        <button onClick={() => setDocToDelete(doc)} className="p-2 text-gray-400 hover:text-red-400" title="Apagar documento">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <DocumentTextIcon className="w-12 h-12 mx-auto mb-4" />
                                <p>Nenhum documento guardado.</p>
                                <p className="text-sm">Clique em "Adicionar Documento" para começar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddDocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />

            {docToDelete && (
                 <DeleteConfirmationModal
                    isOpen={!!docToDelete}
                    onClose={() => setDocToDelete(null)}
                    onConfirm={handleDelete}
                    documentName={docToDelete.title}
                />
            )}
        </>
    );
};

export default SalonDocuments;
