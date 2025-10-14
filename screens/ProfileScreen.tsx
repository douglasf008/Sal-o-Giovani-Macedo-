import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import { useAuth } from '../contexts/AuthContext';
import GiftIcon from '../components/icons/GiftIcon';
import ProfileIcon from '../components/icons/ProfileIcon';
import { useSalonSettings } from '../salonSettings';
import MapPinIcon from '../components/icons/MapPinIcon';

const ProfileScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentClient, logout } = useAuth();
    const { settings } = useSalonSettings();
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const user = currentClient;

    const [fontScale, setFontScale] = useState(() => {
        const savedScale = localStorage.getItem('app-font-scale');
        return savedScale ? parseFloat(savedScale) : 1; // 1 = 100%
    });

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontScale * 16}px`;
        localStorage.setItem('app-font-scale', fontScale.toString());
    }, [fontScale]);

    useEffect(() => {
        if (location.state?.profileUpdated) {
            setShowSuccessMessage(true);
            const timer = setTimeout(() => {
                setShowSuccessMessage(false);
                // Clear state on navigation to avoid re-showing message
                navigate(location.pathname, { replace: true, state: {} });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [location.state, navigate, location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Error logging out:", error);
            alert("Erro ao sair. Tente novamente.");
        }
    };


    if (!user) {
        return (
            <div className="flex flex-col h-screen justify-center items-center bg-black text-white">
                <p>Usuário não encontrado.</p>
                <button onClick={() => navigate('/login')} className="mt-4 text-blue-400">Fazer Login</button>
            </div>
        );
    }

    const handleOpenMap = () => {
        if (settings.salonAddress) {
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.salonAddress)}`;
            window.open(mapUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const menuItems = [
        { label: 'Meus Dados', icon: <ProfileIcon className="w-5 h-5 text-gray-400" />, action: () => navigate('/perfil/editar') },
        { label: 'Meus Pacotes', icon: <GiftIcon className="w-5 h-5 text-gray-400" />, action: () => navigate('/pacotes') },
        { label: 'Endereço do Salão', icon: <MapPinIcon className="w-5 h-5 text-gray-400" />, action: handleOpenMap },
    ];

    const increaseFontSize = () => {
        setFontScale(s => Math.min(1.3, s + 0.1)); // Max 130%
    };

    const decreaseFontSize = () => {
        setFontScale(s => Math.max(0.8, s - 0.1)); // Min 80%
    };


    return (
        <div className="flex flex-col h-screen justify-between bg-black text-white">
            {showSuccessMessage && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
                    <p className="font-semibold">Perfil atualizado com sucesso!</p>
                </div>
            )}
            <div className="p-4 flex-grow overflow-y-auto pb-20">
                <header className="text-center mb-8">
                    <h1 className="text-xl font-bold">Meu Perfil</h1>
                </header>

                <div className="flex flex-col items-center space-y-2 mb-10">
                    <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full border-4 border-gray-700 object-cover" />
                    <h2 className="text-2xl font-semibold">{user.name}</h2>
                    <p className="text-gray-400">{user.email}</p>
                </div>

                <div className="space-y-3">
                    {menuItems.map(item => (
                        <button 
                            key={item.label} 
                            onClick={item.action}
                            className="w-full bg-gray-900 p-4 rounded-lg flex justify-between items-center hover:bg-gray-800 transition-colors"
                        >
                           <div className="flex items-center gap-3">
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                           </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    ))}
                    {/* Font Size Control */}
                    <div className="w-full bg-gray-900 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-medium">Tamanho da Fonte</span>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={decreaseFontSize}
                                className="text-2xl font-bold text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
                                aria-label="Diminuir fonte"
                                disabled={fontScale <= 0.8}
                            >
                                A-
                            </button>
                            <span className="text-base font-semibold w-12 text-center text-gray-300">{Math.round(fontScale * 100)}%</span>
                            <button
                                onClick={increaseFontSize}
                                className="text-2xl font-bold text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
                                aria-label="Aumentar fonte"
                                disabled={fontScale >= 1.3}
                            >
                                A+
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="mt-10">
                     <button
                        onClick={handleLogout}
                        className="w-full text-red-500 font-bold py-3 rounded-lg text-lg hover:bg-red-500/10 transition-colors duration-300"
                    >
                        Sair
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProfileScreen;