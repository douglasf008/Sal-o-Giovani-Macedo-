import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import CameraIcon from '../components/icons/CameraIcon';
import { useClients } from '../contexts/ClientsContext';
import { Client } from '../types';
import AdminChangeAvatarModal from '../components/AdminChangeAvatarModal';
import { useAuth } from '../contexts/AuthContext';

const EditProfileScreen: React.FC = () => {
    const navigate = useNavigate();
    const { updateClient } = useClients();
    const { currentClient } = useAuth();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    useEffect(() => {
        if (currentClient) {
            setName(currentClient.name);
            setEmail(currentClient.email);
            setPhone(currentClient.phone);
            setAvatarUrl(currentClient.avatarUrl);
            setBirthdate(currentClient.birthdate || '');
        }
    }, [currentClient]);
    
    if (!currentClient) {
        return (
            <div className="flex flex-col h-screen justify-center items-center bg-black text-white">
                <p>Usuário não encontrado.</p>
                <button onClick={() => navigate('/login')} className="mt-4 text-blue-400">Fazer Login</button>
            </div>
        );
    }

    const handleSave = async () => {
        if (!name.trim()) {
            alert('O nome é obrigatório.');
            return;
        }
        const updatedUser: Client = {
            ...currentClient,
            name,
            email,
            phone,
            avatarUrl,
            birthdate,
        };
        try {
            await updateClient(updatedUser);
            navigate('/perfil', { state: { profileUpdated: true } });
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Erro ao atualizar o perfil. Tente novamente.");
        }
    };

    const handleAvatarSave = (newAvatarUrl: string) => {
        setAvatarUrl(newAvatarUrl);
        setIsAvatarModalOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Meus Dados</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 space-y-8">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <img src={avatarUrl} alt={name} className="w-28 h-28 rounded-full border-4 border-gray-700 object-cover" />
                        <button 
                            onClick={() => setIsAvatarModalOpen(true)}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-gray-200 text-black rounded-full flex items-center justify-center border-2 border-black hover:bg-white"
                            aria-label="Alterar foto do perfil"
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                        <input
                            type="text"
                            id="fullName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">Celular</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="birthdate" className="block text-sm font-medium text-gray-300 mb-2">Data de Nascimento</label>
                        <input
                            type="date"
                            id="birthdate"
                            value={birthdate}
                            onChange={(e) => setBirthdate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm">
                <button
                    onClick={handleSave}
                    className="w-full bg-gray-200 text-black font-bold py-3 rounded-2xl text-lg hover:bg-white transition-colors duration-300 shadow-lg"
                >
                    Salvar Alterações
                </button>
            </div>
            {currentClient && (
                <AdminChangeAvatarModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onSave={handleAvatarSave}
                    client={currentClient}
                    showUploadOption={false}
                />
            )}
        </div>
    );
};

export default EditProfileScreen;