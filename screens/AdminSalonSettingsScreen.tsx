import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { useSalonSettings, SalonSettings, CampaignMedia } from '../salonSettings';
import ChangePrivacyPasswordModal from '../components/ChangePrivacyPasswordModal';
import TrashIcon from '../components/icons/TrashIcon';
import CameraIcon from '../components/icons/CameraIcon';
import { useAvatars } from '../contexts/AvatarsContext';
import { useAuth } from '../contexts/AuthContext';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import { FIREBASE_CONFIG_KEY } from '../firebaseConfig';

const AdminSalonSettingsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { settings, saveSettings } = useSalonSettings();
    const { avatars, addAvatar, deleteAvatar } = useAvatars();
    const { loggedInProfessional, isFirebaseAvailable, reinitializeFirebase } = useAuth();
    const [currentSettings, setCurrentSettings] = useState<SalonSettings>(settings);
    
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // State for promotional campaign UI
    const [scheduleType, setScheduleType] = useState<'period' | 'duration'>('period');
    const [durationInDays, setDurationInDays] = useState('15');
    const [mediaUrlInput, setMediaUrlInput] = useState('');
    const [newAvatarUrl, setNewAvatarUrl] = useState('');

    const [firebaseConfig, setFirebaseConfig] = useState({
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    });
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);


    useEffect(() => {
        try {
            const storedConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
            if (storedConfig) {
                setFirebaseConfig(JSON.parse(storedConfig));
            }
        } catch (error) {
            console.error("Failed to load firebase config from localStorage", error);
        }
    }, []);

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        } else if (!loggedInProfessional.permissions?.includes('Meu Salão')) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate]);

    const handleAddAvatarFromUrl = () => {
        if (newAvatarUrl.trim()) {
            addAvatar(newAvatarUrl.trim());
            setNewAvatarUrl('');
        }
    }

    const handleAddAvatarFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    addAvatar(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setCurrentSettings({ ...currentSettings, coverImageUrl: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const clearCoverImage = () => {
        setCurrentSettings({ ...currentSettings, coverImageUrl: settings.coverImageUrl });
        const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };
    
    const handleCampaignUpdate = (field: string, value: any) => {
        setCurrentSettings(prev => ({
            ...prev,
            promotionalCampaign: {
                ...(prev.promotionalCampaign!),
                [field]: value,
            },
        }));
    };

    const handleCampaignMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const newMedia: CampaignMedia = { type: 'image', url: reader.result };
                    handleCampaignUpdate('media', [...(currentSettings.promotionalCampaign?.media || []), newMedia]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const addMediaFromUrl = () => {
        if (!mediaUrlInput.trim()) return;
        const type = mediaUrlInput.includes('youtube.com') || mediaUrlInput.includes('youtu.be') ? 'video' : 'image';
        const newMedia: CampaignMedia = { type, url: mediaUrlInput.trim() };
        handleCampaignUpdate('media', [...(currentSettings.promotionalCampaign?.media || []), newMedia]);
        setMediaUrlInput('');
    };

    const removeMedia = (index: number) => {
        const updatedMedia = currentSettings.promotionalCampaign?.media.filter((_, i) => i !== index) || [];
        handleCampaignUpdate('media', updatedMedia);
    };


    const handleWorkingDayToggle = (dayIndex: number) => {
        const workingDays = [...currentSettings.workingDays];
        if (workingDays.includes(dayIndex)) {
            setCurrentSettings({ ...currentSettings, workingDays: workingDays.filter(d => d !== dayIndex) });
        } else {
            setCurrentSettings({ ...currentSettings, workingDays: [...workingDays, dayIndex].sort() });
        }
    };

    const handleFirebaseConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirebaseConfig({
            ...firebaseConfig,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveFirebaseConfig = async () => {
        setFeedbackMessage(null);
        try {
            localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(firebaseConfig));
            const success = await reinitializeFirebase();
            if (success) {
                setFeedbackMessage({ type: 'success', text: 'Configuração salva e conexão com Firebase estabelecida com sucesso!' });
            } else {
                setFeedbackMessage({ type: 'error', text: 'Configuração salva, mas a conexão com o Firebase falhou. Verifique as credenciais.' });
            }
        } catch (error) {
            console.error("Failed to save or reinitialize firebase", error);
            setFeedbackMessage({ type: 'error', text: 'Ocorreu um erro ao salvar a configuração.' });
        }
    };

    const handleSave = async () => {
        let settingsToSave = { ...currentSettings };
        if (settingsToSave.promotionalCampaign?.isActive && scheduleType === 'duration') {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + parseInt(durationInDays, 10));
            settingsToSave.promotionalCampaign.startDate = startDate.toISOString().split('T')[0];
            settingsToSave.promotionalCampaign.endDate = endDate.toISOString().split('T')[0];
        }
        saveSettings(settingsToSave);
        await handleSaveFirebaseConfig();
        alert('Configurações salvas!');
    };

    const handlePasswordChange = (newPassword: string) => {
        setCurrentSettings(prev => ({ ...prev, privacyPassword: newPassword }));
        setIsPasswordModalOpen(false);
    };
    
    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const campaign = currentSettings.promotionalCampaign;

    if (!loggedInProfessional || !loggedInProfessional.permissions?.includes('Meu Salão')) {
        return null;
    }

    const firebaseConfigFields = [
        { name: 'apiKey', label: 'API Key' },
        { name: 'authDomain', label: 'Auth Domain' },
        { name: 'projectId', label: 'Project ID' },
        { name: 'storageBucket', label: 'Storage Bucket' },
        { name: 'messagingSenderId', label: 'Messaging Sender ID' },
        { name: 'appId', label: 'App ID' },
    ];

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Meu Salão</h1>
                <div className="w-6 h-6"></div>
            </header>

            <div className="flex-grow overflow-y-auto px-4 pb-24 space-y-8 pt-4">

                {/* Firebase Config Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Configuração do Firebase (Login de Clientes)</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="font-medium">Status da Conexão</p>
                            {isFirebaseAvailable ? (
                                <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-300 text-sm font-semibold">Conectado</span>
                            ) : (
                                <span className="px-3 py-1 rounded-full bg-yellow-900/50 text-yellow-300 text-sm font-semibold">Não Configurado</span>
                            )}
                        </div>
                        {feedbackMessage && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${feedbackMessage.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                                {feedbackMessage.text}
                            </div>
                        )}
                        <p className="text-sm text-gray-400">
                            Preencha estas informações para habilitar o cadastro e login de clientes. Você pode encontrar estes dados no seu console do Firebase:
                            <br />
                            <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                Configurações do Projeto {'>'} Geral {'>'} Seus apps {'>'} App da Web.
                            </a>
                        </p>
                        <div className="space-y-3 pt-4 border-t border-gray-700">
                             {firebaseConfigFields.map(field => (
                                <div key={field.name}>
                                    <label htmlFor={`firebase-${field.name}`} className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                                    <input
                                        type="text"
                                        id={`firebase-${field.name}`}
                                        name={field.name}
                                        value={firebaseConfig[field.name as keyof typeof firebaseConfig] || ''}
                                        onChange={handleFirebaseConfigChange}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                                        placeholder={`Cole seu ${field.label} aqui`}
                                    />
                                </div>
                            ))}
                        </div>
                         <button
                            onClick={handleSaveFirebaseConfig}
                            className="w-full mt-2 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Salvar e Testar Conexão Firebase
                        </button>
                    </div>
                </section>


                {/* AI Features Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Funcionalidades de IA</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">Habilitar Assistente de Cor com IA</p>
                                <p className="text-sm text-gray-400">
                                    Permitir que clientes simulem cores de cabelo.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentSettings.isAiAssistantEnabled ?? true}
                                    onChange={(e) => setCurrentSettings({ ...currentSettings, isAiAssistantEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                            <div>
                                <p className="font-medium">Habilitar Chatbot do Cliente</p>
                                <p className="text-sm text-gray-400">
                                    Ativa o assistente virtual para responder perguntas.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentSettings.isChatbotEnabled ?? true}
                                    onChange={(e) => setCurrentSettings({ ...currentSettings, isChatbotEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                            <div>
                                <p className="font-medium">Habilitar Chatbot do Funcionário</p>
                                <p className="text-sm text-gray-400">
                                    Ativa o assistente de IA no painel administrativo.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentSettings.isAdminChatbotEnabled ?? true}
                                    onChange={(e) => setCurrentSettings({ ...currentSettings, isAdminChatbotEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                         {/* Chatbot Info Section */}
                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-md font-semibold mb-3 flex items-center gap-2 text-gray-300">
                                Informações Adicionais para o Chatbot
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                O conteúdo que você escrever aqui será usado pela IA do chatbot para responder perguntas dos clientes. Ótimo para promoções, avisos ou regras específicas do salão.
                            </p>
                            <textarea
                                value={currentSettings.chatbotAdditionalInfo || ''}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, chatbotAdditionalInfo: e.target.value })}
                                rows={6}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Ex: Promoção da semana: Hidratação com 15% de desconto às quartas-feiras!"
                            />
                        </div>
                    </div>
                </section>
                
                {/* Avatars Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Avatares de Perfil para Clientes</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                        <p className="text-sm text-gray-400">Gerencie os avatares disponíveis para os clientes escolherem em seus perfis.</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-72 overflow-y-auto pr-2">
                            {avatars.map((url, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover rounded-full" />
                                    <button 
                                        onClick={() => deleteAvatar(url)}
                                        className="absolute top-0 right-0 bg-red-600/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Apagar avatar"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-700 pt-4 space-y-3">
                            <h3 className="text-sm font-medium">Adicionar Novo Avatar</h3>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="url" 
                                    value={newAvatarUrl}
                                    onChange={(e) => setNewAvatarUrl(e.target.value)}
                                    placeholder="Cole a URL da imagem" 
                                    className="flex-grow bg-gray-700 rounded-lg px-3 py-2 text-sm" 
                                />
                                <button onClick={handleAddAvatarFromUrl} className="px-3 py-2 bg-blue-600 text-xs font-semibold rounded-lg">Adicionar URL</button>
                            </div>
                            <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleAddAvatarFromFile} />
                            <label htmlFor="avatarUpload" className="w-full text-center block bg-gray-700 py-2 rounded-lg cursor-pointer text-sm font-semibold">
                                ou Enviar Arquivo
                            </label>
                        </div>
                    </div>
                </section>

                {/* Campaign Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Campanha Promocional (Janela Flutuante)</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">Ativar campanha</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={campaign?.isActive}
                                    onChange={(e) => handleCampaignUpdate('isActive', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        {campaign?.isActive && (
                            <div className="border-t border-gray-700 pt-4 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                                    <input type="text" value={campaign.title} onChange={(e) => handleCampaignUpdate('title', e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                                    <textarea value={campaign.description} onChange={(e) => handleCampaignUpdate('description', e.target.value)} rows={3} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-2">Tipo de Mídia</h3>
                                    <div className="flex gap-4">
                                        {['image', 'carousel', 'video'].map(type => (
                                            <button key={type} onClick={() => handleCampaignUpdate('displayType', type)} className={`capitalize px-4 py-2 text-xs rounded-lg ${campaign.displayType === type ? 'bg-gray-200 text-black font-bold' : 'bg-gray-800'}`}>{type === 'image' ? 'Imagem' : type === 'carousel' ? 'Carrossel' : 'Vídeo'}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-2">Adicionar Mídia</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input type="text" value={mediaUrlInput} onChange={e => setMediaUrlInput(e.target.value)} placeholder="Cole uma URL de imagem ou vídeo" className="flex-grow bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                                        <button onClick={addMediaFromUrl} className="px-3 py-2 bg-blue-600 text-xs font-semibold rounded-lg">Adicionar URL</button>
                                    </div>
                                    <input type="file" id="campaignMediaUpload" className="hidden" accept="image/*" onChange={handleCampaignMediaUpload} />
                                    <label htmlFor="campaignMediaUpload" className="w-full text-center block bg-gray-700 py-2 rounded-lg cursor-pointer text-sm font-semibold">ou Enviar Arquivo</label>
                                    <div className="mt-3 space-y-2">
                                        {campaign.media.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                                                <span className="text-xs text-gray-400 truncate w-60">{m.url}</span>
                                                <button onClick={() => removeMedia(i)}><TrashIcon className="w-4 h-4 text-red-400"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-2">Período de Exibição</h3>
                                    <div className="flex gap-4 mb-3">
                                        <button onClick={() => setScheduleType('period')} className={`px-4 py-2 text-xs rounded-lg ${scheduleType === 'period' ? 'bg-gray-200 text-black font-bold' : 'bg-gray-800'}`}>Período Específico</button>
                                        <button onClick={() => setScheduleType('duration')} className={`px-4 py-2 text-xs rounded-lg ${scheduleType === 'duration' ? 'bg-gray-200 text-black font-bold' : 'bg-gray-800'}`}>Duração em Dias</button>
                                    </div>
                                    {scheduleType === 'period' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Início</label>
                                                <input type="date" value={campaign.startDate} onChange={e => handleCampaignUpdate('startDate', e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm" style={{ colorScheme: 'dark' }}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Fim</label>
                                                <input type="date" value={campaign.endDate} onChange={e => handleCampaignUpdate('endDate', e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm" style={{ colorScheme: 'dark' }}/>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Exibir por (dias)</label>
                                            <input type="number" value={durationInDays} onChange={e => setDurationInDays(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Welcome Screen Text */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Textos da Tela de Boas-vindas</h2>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="welcomeSubtitle" className="block text-sm font-medium text-gray-300 mb-2">Subtítulo</label>
                            <textarea
                                id="welcomeSubtitle"
                                value={currentSettings.welcomeSubtitle}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, welcomeSubtitle: e.target.value })}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Descreva seu salão..."
                            />
                        </div>
                    </div>
                </section>
                
                <section>
                    <h2 className="text-lg font-semibold mb-3">Tela de Agendamento</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-6">
                        <div>
                            <label htmlFor="bookingScreenMessage" className="block text-sm font-medium text-gray-300 mb-2">Mensagem de Alerta</label>
                            <textarea
                                id="bookingScreenMessage"
                                value={currentSettings.bookingScreenMessage}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, bookingScreenMessage: e.target.value })}
                                rows={4}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Deixe uma mensagem para os clientes na tela de agendamento..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Esta mensagem aparecerá na tela de agendamento do cliente. Útil para avisos importantes.</p>
                        </div>
                        <div>
                            <label htmlFor="bookingMessageDuration" className="block text-sm font-medium text-gray-300 mb-2">Duração da exibição da mensagem (segundos)</label>
                            <input
                                type="number"
                                id="bookingMessageDuration"
                                value={currentSettings.bookingScreenMessageDisplaySeconds}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, bookingScreenMessageDisplaySeconds: parseInt(e.target.value, 10) || 0 })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Tempo que a mensagem de alerta fica na tela. 0 para não fechar automaticamente.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">Informações do Salão</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                         <div>
                            <label htmlFor="salonName" className="block text-sm font-medium text-gray-300 mb-2">Nome do Salão</label>
                            <input
                                type="text"
                                id="salonName"
                                value={currentSettings.salonName}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, salonName: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Nome do seu salão"
                            />
                             <p className="text-xs text-gray-500 mt-1">Este nome aparecerá em vários locais do aplicativo.</p>
                        </div>
                         <div>
                            <label htmlFor="salonAddress" className="block text-sm font-medium text-gray-300 mb-2">Endereço do Salão</label>
                            <input
                                type="text"
                                id="salonAddress"
                                value={currentSettings.salonAddress}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, salonAddress: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="Rua, Número, Bairro, Cidade, Estado"
                            />
                             <p className="text-xs text-gray-500 mt-1">Este endereço será usado no link para o mapa.</p>
                        </div>
                         <div>
                            <label htmlFor="salonWhatsapp" className="block text-sm font-medium text-gray-300 mb-2">WhatsApp do Salão</label>
                            <input
                                type="text"
                                id="salonWhatsapp"
                                value={currentSettings.salonWhatsapp || ''}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, salonWhatsapp: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                placeholder="5511999999999"
                            />
                             <p className="text-xs text-gray-500 mt-1">Insira o número completo com código do país e DDD, sem espaços ou símbolos. Ex: 5511999999999</p>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                            <div>
                                <p className="font-medium">Habilitar botão flutuante do WhatsApp</p>
                                <p className="text-sm text-gray-400">
                                    Mostra um atalho para o WhatsApp nas telas do cliente.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentSettings.isWhatsappEnabled ?? true}
                                    onChange={(e) => setCurrentSettings({ ...currentSettings, isWhatsappEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    </div>
                </section>

                 {/* Payment Settings Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Pagamentos</h2>
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">Habilitar Pagamento Online</p>
                                <p className="text-sm text-gray-400">
                                    Permitir que clientes paguem adiantado pelo app.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentSettings.onlinePaymentsEnabled ?? true}
                                    onChange={(e) => setCurrentSettings({ ...currentSettings, onlinePaymentsEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    </div>
                </section>
                
                {/* Cover Image */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Foto de Capa do App</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="coverImageUrl" className="block text-sm font-medium text-gray-300 mb-2">URL da Imagem</label>
                            <input
                                type="text"
                                id="coverImageUrl"
                                value={currentSettings.coverImageUrl.startsWith('data:image') ? '' : currentSettings.coverImageUrl}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, coverImageUrl: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
                                placeholder={currentSettings.coverImageUrl.startsWith('data:image') ? 'Imagem local selecionada' : 'https://exemplo.com/imagem.jpg'}
                                disabled={currentSettings.coverImageUrl.startsWith('data:image')}
                            />
                        </div>

                        <div className="flex items-center justify-center">
                            <span className="text-sm text-gray-500">ou</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="imageUpload"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageUpload}
                            />
                            <label
                                htmlFor="imageUpload"
                                className="flex-grow w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 rounded-lg text-base hover:bg-gray-600 transition-colors cursor-pointer"
                            >
                                <CameraIcon className="w-5 h-5" />
                                <span>Enviar Arquivo</span>
                            </label>
                            {currentSettings.coverImageUrl.startsWith('data:image') && (
                                <button
                                    onClick={clearCoverImage}
                                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-red-800/80 text-white font-semibold py-3 px-4 rounded-lg text-base hover:bg-red-700/80 transition-colors"
                                    aria-label="Apagar imagem enviada"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                    <span>Apagar</span>
                                </button>
                            )}
                        </div>


                        {currentSettings.coverImageUrl && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-400 mb-2">Pré-visualização:</p>
                                <img src={currentSettings.coverImageUrl} alt="Pré-visualização da capa" className="w-full h-48 object-cover rounded-lg" />
                            </div>
                        )}
                    </div>
                </section>
                
                {/* Working Days */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Dias de Funcionamento</h2>
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                        {weekDays.map((day, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <p>{day}</p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentSettings.workingDays.includes(index)}
                                        onChange={() => handleWorkingDayToggle(index)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* Opening Hours */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Horário de Atendimento</h2>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-2">Abertura</label>
                            <input
                                type="time"
                                id="startTime"
                                value={currentSettings.startTime}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, startTime: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-2">Fechamento</label>
                            <input
                                type="time"
                                id="endTime"
                                value={currentSettings.endTime}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, endTime: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">Segurança</h2>
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">Senha de Privacidade</p>
                                <p className="text-sm text-gray-400">
                                    {currentSettings.privacyPassword ? 'Definida' : 'Não definida'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="px-4 py-2 bg-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                {currentSettings.privacyPassword ? 'Alterar' : 'Definir'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="fixed inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] max-w-sm">
                <button
                    onClick={handleSave}
                    className="w-full bg-gray-200 text-black font-bold py-3 rounded-2xl text-lg hover:bg-white transition-colors duration-300 shadow-lg"
                >
                    Salvar Configurações
                </button>
            </div>

            {isPasswordModalOpen && (
                <ChangePrivacyPasswordModal
                    onClose={() => setIsPasswordModalOpen(false)}
                    onSave={handlePasswordChange}
                    hasCurrentPassword={!!currentSettings.privacyPassword}
                    currentPasswordValue={currentSettings.privacyPassword || ''}
                />
            )}
        </div>
    );
};

export default AdminSalonSettingsScreen;