import React, { useState, useRef } from 'react';
import { Client } from '../types';
import XIcon from './icons/XIcon';
import CameraIcon from './icons/CameraIcon';
import { useAvatars } from '../contexts/AvatarsContext';

interface AdminChangeAvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newAvatarUrl: string) => void;
    client: Client;
    showUploadOption?: boolean;
}

const AdminChangeAvatarModal: React.FC<AdminChangeAvatarModalProps> = ({ isOpen, onClose, onSave, client, showUploadOption = true }) => {
    const { avatars } = useAvatars();
    const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'url'>('gallery');
    const [avatarPreview, setAvatarPreview] = useState<string>(client.avatarUrl);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrlInput(newUrl);
        // Basic check to see if it's an image URL for preview
        const img = new Image();
        img.onload = () => setAvatarPreview(newUrl);
        img.onerror = () => setAvatarPreview(client.avatarUrl); // Reset if not a valid image
        img.src = newUrl;
    };

    const handleSaveClick = () => {
        onSave(avatarPreview);
    };
    
    const handleGallerySelect = (url: string) => {
        onSave(url);
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg text-white" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Alterar Foto de Perfil</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon /></button>
                </header>

                <main className="space-y-4">
                    <div className="flex justify-center">
                         <img src={avatarPreview} alt={client.name} className="w-32 h-32 rounded-full border-4 border-gray-700 object-cover" />
                    </div>

                    <div className="flex border-b border-gray-700">
                        <button 
                            onClick={() => setActiveTab('gallery')}
                            className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'gallery' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                        >
                            Galeria
                        </button>
                        {showUploadOption && (
                            <button 
                                onClick={() => setActiveTab('upload')}
                                className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'upload' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                            >
                                Enviar Arquivo
                            </button>
                        )}
                        <button 
                            onClick={() => setActiveTab('url')}
                            className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'url' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                        >
                            Usar URL
                        </button>
                    </div>

                    {activeTab === 'gallery' && (
                        <div className="grid grid-cols-4 gap-4 py-4 max-h-64 overflow-y-auto">
                            {avatars.map((url, index) => (
                                <button key={index} onClick={() => handleGallerySelect(url)} className="aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-white focus:border-white focus:outline-none transition">
                                    <img src={url} alt={`Avatar ${index+1}`} className="w-full h-full object-cover"/>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'upload' && showUploadOption && (
                        <div>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <button
                                onClick={triggerFileInput}
                                className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 rounded-lg text-base hover:bg-gray-600 transition-colors"
                            >
                                <CameraIcon className="w-5 h-5" />
                                <span>Selecionar Imagem</span>
                            </button>
                        </div>
                    )}
                    
                    {activeTab === 'url' && (
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-2">URL da Imagem</label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={urlInput}
                                onChange={handleUrlChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="https://exemplo.com/foto.png"
                            />
                        </div>
                    )}
                </main>

                {activeTab !== 'gallery' && (
                    <footer className="mt-8">
                        <button
                            onClick={handleSaveClick}
                            className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300"
                        >
                            Salvar Alteração
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default AdminChangeAvatarModal;