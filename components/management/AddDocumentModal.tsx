import React, { useState } from 'react';
import XIcon from '../icons/XIcon';
import PlusIcon from '../icons/PlusIcon';

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; fileDataUrl: string; fileName: string; fileType: string; }) => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSave = () => {
        if (!title.trim() || !file) {
            alert('Por favor, forneça um título e selecione um arquivo.');
            return;
        }

        setIsSaving(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                onSave({
                    title: title.trim(),
                    fileDataUrl: event.target.result,
                    fileName: file.name,
                    fileType: file.type,
                });
                setIsSaving(false);
                onClose();
            } else {
                setIsSaving(false);
                alert('Erro ao ler o arquivo.');
            }
        };
        reader.onerror = () => {
            setIsSaving(false);
            alert('Erro ao ler o arquivo.');
        };
        reader.readAsDataURL(file);
    };

    const isFormValid = title.trim() && file;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Adicionar Documento</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>

                <main className="space-y-4">
                    <div>
                        <label htmlFor="doc-title" className="block text-sm font-medium text-gray-300 mb-2">Título do Documento</label>
                        <input
                            type="text"
                            id="doc-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: Alvará de Funcionamento 2024"
                        />
                    </div>
                    <div>
                        <label htmlFor="doc-file" className="block text-sm font-medium text-gray-300 mb-2">Arquivo</label>
                        <input
                            type="file"
                            id="doc-file"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.ppt,.pptx,.doc,.docx"
                            className="w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-600 file:text-white
                                hover:file:bg-blue-500"
                        />
                        {file && <p className="text-xs text-gray-500 mt-2">Arquivo selecionado: {file.name}</p>}
                    </div>
                </main>

                <footer className="mt-8">
                    <button
                        onClick={handleSave}
                        disabled={!isFormValid || isSaving}
                        className="w-full bg-blue-600 font-bold py-3 rounded-lg text-lg hover:bg-blue-500 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Documento'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AddDocumentModal;
