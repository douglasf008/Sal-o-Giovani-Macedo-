import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalonSettings } from '../salonSettings';

const WelcomeScreen: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSalonSettings();

    return (
        <div className="relative h-screen flex flex-col bg-cover bg-center" style={{ backgroundImage: `url(${settings.coverImageUrl})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
            <div className="relative z-10 mt-auto p-8 pb-20 text-center text-white">
                <h1 className="text-4xl font-bold mb-2">Bem-vindo ao {settings.salonName}</h1>
                <p className="text-lg text-gray-300 mb-8">{settings.welcomeSubtitle}</p>
                
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate('/login', { state: { initialTab: 'login' } })}
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300"
                    >
                        Entrar
                    </button>
                    <button 
                        onClick={() => navigate('/login', { state: { initialTab: 'signup' } })}
                        className="w-full bg-gray-700/50 text-white font-bold py-3 rounded-lg text-lg backdrop-blur-sm hover:bg-gray-600/70 transition-colors duration-300"
                    >
                        Cadastrar
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-12">
                    Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
                </p>
                
                <button 
                    onClick={() => navigate('/admin/login')}
                    className="mt-4 text-xs text-gray-400 hover:text-white"
                >
                    Acessar Painel do Administrador
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen;