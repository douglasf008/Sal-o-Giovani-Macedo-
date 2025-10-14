import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';

import { useSalonSettings } from '../salonSettings';
import { useServices } from '../contexts/ServicesContext';
import { usePackages } from '../contexts/PackagesContext';

import XIcon from './icons/XIcon';
import SparklesIcon from './icons/SparklesIcon';

interface ChatbotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose }) => {
    const { settings } = useSalonSettings();
    const { services } = useServices();
    const { packageTemplates } = usePackages();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const initializeChat = useCallback(() => {
        if (!chatRef.current) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const servicesInfo = services.map(s => `- ${s.name}: R$ ${s.price.toFixed(2)}. Duração: ${s.duration || 'não especificada'} min.`).join('\n');
            const packagesInfo = packageTemplates.map(p => `- Pacote "${p.name}": ${p.sessionCount} sessões de ${services.find(s => s.id === p.serviceId)?.name || ''} por R$ ${p.price.toFixed(2)}.`).join('\n');
            const workingDays = settings.workingDays.map(d => ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d]).join(', ');
            
            const additionalInfo = settings.chatbotAdditionalInfo ? `
                **Informações Adicionais (fornecidas pelo salão):**
                ${settings.chatbotAdditionalInfo}
            ` : '';

            const systemInstruction = `
                Você é um assistente virtual amigável e prestativo para o salão de beleza "${settings.salonName}".
                Sua função é responder às perguntas dos clientes com base ESTritamente nas informações fornecidas abaixo.
                Se a informação não estiver aqui, diga educadamente que você não tem essa informação e sugira que o cliente entre em contato com o salão pelo WhatsApp.

                **Informações do Salão:**
                - Nome: ${settings.salonName}
                - Endereço: ${settings.salonAddress}
                - WhatsApp: ${settings.salonWhatsapp}
                - Horário de Funcionamento: Das ${settings.startTime} às ${settings.endTime}.
                - Dias de Funcionamento: ${workingDays}.

                **Lista de Serviços:**
                ${servicesInfo}

                **Lista de Pacotes:**
                ${packagesInfo}
                ${additionalInfo}

                Seja conciso e direto em suas respostas.
            `;
            
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction,
                },
            });

             setMessages([{ role: 'model', text: `Olá! Sou o assistente virtual do ${settings.salonName}. Como posso ajudar? Você pode perguntar sobre nossos serviços, pacotes e horários.` }]);
        }
    }, [settings, services, packageTemplates]);

    useEffect(() => {
        if (isOpen) {
            initializeChat();
        } else {
            // Optional: reset chat when closed to clear history for next user
            chatRef.current = null;
            setMessages([]);
        }
    }, [isOpen, initializeChat]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { role: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await chatRef.current.sendMessage({ message: userMessage.text });
            const modelMessage: Message = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            console.error(err);
            setError("Desculpe, não consegui processar sua pergunta. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full h-full max-h-[700px] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold">Assistente Virtual</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-700 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <main className="flex-grow overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-gray-700 text-white rounded-bl-lg'}`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-gray-700 text-white rounded-bl-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                     {error && (
                         <div className="flex justify-start">
                            <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-red-900/50 text-red-300 rounded-bl-lg">
                               <p>{error}</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t border-gray-700 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte sobre serviços, pacotes..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Enviar
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default ChatbotModal;