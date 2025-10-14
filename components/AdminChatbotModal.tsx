import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';

import XIcon from './icons/XIcon';
import SparklesIcon from './icons/SparklesIcon';

import { useAuth } from '../contexts/AuthContext';
import { useSalonSettings } from '../salonSettings';
import { useServices } from '../contexts/ServicesContext';
import { useProfessionals } from '../contexts/ProfessionalsContext';
import { useClients } from '../contexts/ClientsContext';
import { useStock } from '../contexts/StockContext';
import { useAppointments } from '../contexts/AppointmentsContext';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useExpenses } from '../contexts/ExpensesContext';

interface AdminChatbotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AdminChatbotModal: React.FC<AdminChatbotModalProps> = ({ isOpen, onClose }) => {
    const { loggedInProfessional } = useAuth();
    const { settings } = useSalonSettings();
    const { services } = useServices();
    const { professionals } = useProfessionals();
    const { clients } = useClients();
    const { stockItems } = useStock();
    const { appointments } = useAppointments();
    const { sales } = useSalesHistory();
    const { expenses } = useExpenses();

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

    const buildSystemInstruction = useCallback(() => {
        if (!loggedInProfessional) return "";

        const permissions = loggedInProfessional.permissions || [];
        let context = `Você é o "Gênio", um assistente de IA para funcionários do salão "${settings.salonName}". Responda apenas com base nas informações a seguir, que correspondem às permissões de acesso do funcionário. Seja conciso e prestativo. Se a pergunta for sobre algo fora do seu conhecimento, informe educadamente que você não tem acesso a essa informação e sugira verificar o manual do app na seção de Gestão Financeira.\n\n`;

        if (permissions.includes('Agenda de Serviços')) {
            const todayAppointments = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString());
            context += "**INFORMAÇÕES DA AGENDA:**\n";
            context += `Hoje, ${new Date().toLocaleDateString('pt-BR')}, há ${todayAppointments.length} agendamentos no total.\n`;
            const servicesInfo = services.slice(0, 10).map(s => `- ${s.name}: R$ ${s.price.toFixed(2)}`).join('\n');
            context += `Alguns serviços disponíveis para agendamento:\n${servicesInfo}\n\n`;
        }
        
        if (permissions.includes('Clientes')) {
             context += "**INFORMAÇÕES DE CLIENTES:**\n";
             context += `O salão tem ${clients.length} clientes cadastrados. Você pode buscar por nome na tela de clientes para ver o histórico e anotações.\n\n`;
        }
        
        if (permissions.includes('Funcionários')) {
            context += "**INFORMAÇÕES DE FUNCIONÁRIOS:**\n";
            const profInfo = professionals.map(p => `- ${p.name} (Contrato: ${p.employmentType})`).join('\n');
            context += `A equipe é composta por ${professionals.length} funcionários:\n${profInfo}\n\n`;
        }

        if (permissions.includes('Estoque')) {
            context += "**INFORMAÇÕES DE ESTOQUE:**\n";
            const lowStock = stockItems.filter(i => i.quantity < i.lowStockThreshold);
            context += `Total de tipos de itens no estoque: ${stockItems.length}.\n`;
            context += `Itens com estoque baixo: ${lowStock.length}.\n`;
            if (lowStock.length > 0) {
                context += "Itens críticos que precisam de reposição:\n";
                context += lowStock.slice(0, 5).map(i => `- ${i.name} (${i.quantity} restantes)`).join('\n');
            }
            context += "\n\n";
        }
        
        if (permissions.includes('Gestão Financeira')) {
            const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
            const todayTotal = todaySales.reduce((sum, s) => sum + s.totals.total, 0);
            context += "**INFORMAÇÕES DE GESTÃO FINANCEIRA:**\n";
            context += `O faturamento bruto de hoje é R$ ${todayTotal.toFixed(2)}.\n`;
            context += `Total de despesas registradas no sistema: ${expenses.length}.\n`;
            context += "A seção 'Gestão Financeira' contém relatórios detalhados sobre ciclos de pagamento, desempenho diário, vales, despesas e mais.\n\n";
        }

        if (permissions.includes('Meu Salão')) {
            context += "**INFORMAÇÕES DO SALÃO:**\n";
            const workingDays = settings.workingDays.map(d => ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d]).join(', ');
            context += `- Endereço: ${settings.salonAddress}\n`;
            context += `- Horário: ${settings.startTime} às ${settings.endTime}\n`;
            context += `- Dias de Funcionamento: ${workingDays}\n`;
            context += `- WhatsApp: ${settings.salonWhatsapp}\n\n`;
        }

        return context;
    }, [loggedInProfessional, settings, services, professionals, clients, stockItems, appointments, sales, expenses]);

    const initializeChat = useCallback(() => {
        if (!chatRef.current && loggedInProfessional) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const systemInstruction = buildSystemInstruction();
            
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction,
                },
            });

             setMessages([{ role: 'model', text: `Olá, ${loggedInProfessional.name.split(' ')[0]}! Sou o Gênio, seu assistente no salão. Em que posso ajudar hoje?` }]);
        }
    }, [loggedInProfessional, buildSystemInstruction]);

    useEffect(() => {
        if (isOpen) {
            initializeChat();
        } else {
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
                        <h2 className="text-xl font-bold">Assistente do Funcionário</h2>
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
                            placeholder="O que você gostaria de saber?"
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

export default AdminChatbotModal;