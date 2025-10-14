
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../contexts/ClientsContext';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import CakeIcon from '../components/icons/CakeIcon';
import { useRetouchAlerts } from '../hooks/useRetouchAlerts';
import ArrowPathIcon from '../components/icons/ArrowPathIcon';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types';

const getDaysUntilNextBirthday = (birthdateStr?: string): number | null => {
  if (!birthdateStr) return null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Handles YYYY-MM-DD format correctly across timezones
    const [year, month, day] = birthdateStr.split('-').map(Number);
    if (!year || !month || !day) return null;

    const birthDateThisYear = new Date(today.getFullYear(), month - 1, day);
    birthDateThisYear.setHours(0, 0, 0, 0);

    let nextBirthday = birthDateThisYear;
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (e) {
    console.error("Error parsing birthdate", e);
    return null;
  }
};

const AdminClientsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { clients } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const { getUniqueClientAlerts } = useRetouchAlerts();
    const { loggedInProfessional } = useAuth();

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        } else if (!loggedInProfessional.permissions?.includes('Clientes')) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate]);

    const retouchAlerts = getUniqueClientAlerts(15);
    const clientsWithRetouchAlerts = useMemo(() => new Map(retouchAlerts.map(alert => [alert.client.id, alert])), [retouchAlerts]);

    const { priorityClients, otherClients } = useMemo(() => {
        const priority: (Client & { score: number })[] = [];
        const others: Client[] = [];
        const priorityIds = new Set<string>();

        clients.forEach(client => {
            const daysUntilBirthday = getDaysUntilNextBirthday(client.birthdate);
            const retouchAlert = clientsWithRetouchAlerts.get(client.id);

            let score = Infinity;
            let hasAlert = false;

            if (retouchAlert) {
                // Give higher priority to overdue alerts by making their score much lower
                score = Math.min(score, retouchAlert.daysUntilDue <= 0 ? retouchAlert.daysUntilDue - 100 : retouchAlert.daysUntilDue);
                hasAlert = true;
            }
            if (daysUntilBirthday !== null && daysUntilBirthday >= 0 && daysUntilBirthday <= 15) {
                score = Math.min(score, daysUntilBirthday);
                hasAlert = true;
            }

            if (hasAlert) {
                priority.push({ ...client, score });
                priorityIds.add(client.id);
            }
        });
        
        clients.forEach(client => {
            if (!priorityIds.has(client.id)) {
                others.push(client);
            }
        });

        priority.sort((a, b) => {
            if (a.score !== b.score) {
                return a.score - b.score;
            }
            return a.name.localeCompare(b.name);
        });

        others.sort((a, b) => a.name.localeCompare(b.name));

        return { priorityClients: priority, otherClients: others };
    }, [clients, clientsWithRetouchAlerts]);

    const filteredPriorityClients = priorityClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredOtherClients = otherClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!loggedInProfessional || !loggedInProfessional.permissions?.includes('Clientes')) {
        return null;
    }

    const ClientCard: React.FC<{ client: Client }> = ({ client }) => {
        const daysUntilBirthday = getDaysUntilNextBirthday(client.birthdate);
        const isBirthdaySoon = daysUntilBirthday !== null && daysUntilBirthday >= 0 && daysUntilBirthday <= 15;
        const retouchAlert = clientsWithRetouchAlerts.get(client.id);

        return (
            <div 
                onClick={() => navigate(`/admin/clientes/${client.id}`)}
                className="bg-gray-900 p-4 rounded-lg flex items-center cursor-pointer hover:bg-gray-800 transition-colors"
            >
                <img src={client.avatarUrl} alt={client.name} className="w-12 h-12 rounded-full mr-4" />
                <div className="flex-grow">
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-gray-400">{client.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {retouchAlert && (
                        <div 
                            className="flex items-center gap-2 text-blue-300 bg-blue-900/60 px-3 py-1 rounded-full"
                            title={`Retoque de ${retouchAlert.service.name} ${retouchAlert.daysUntilDue <= 0 ? 'atrasado' : `em ${retouchAlert.daysUntilDue} dia(s)`}`}
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            <span className="text-xs font-bold">Retoque</span>
                        </div>
                    )}
                    {isBirthdaySoon && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-900/50 px-3 py-1 rounded-full">
                            <CakeIcon className="w-4 h-4" />
                            <span className="text-xs font-bold">
                                {daysUntilBirthday === 0 ? 'Hoje!' : `${daysUntilBirthday} dia(s)`}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 border-b border-gray-800">
                <button onClick={() => navigate('/admin')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Clientes</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>

            <div className="p-4">
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
            </div>

            <div className="flex-grow overflow-y-auto px-4 pb-4">
                 {filteredPriorityClients.length > 0 && (
                     <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase text-yellow-400 mb-2 px-2">Avisos e Oportunidades</h2>
                        <div className="space-y-3">
                           {filteredPriorityClients.map(client => (
                               <ClientCard key={client.id} client={client} />
                           ))}
                        </div>
                    </div>
                )}
                
                {filteredOtherClients.length > 0 && (
                    <div>
                         {filteredPriorityClients.length > 0 && <h2 className="text-sm font-bold uppercase text-gray-400 mb-2 px-2">Outros Clientes</h2>}
                        <div className="space-y-3">
                           {filteredOtherClients.map(client => (
                               <ClientCard key={client.id} client={client} />
                           ))}
                        </div>
                    </div>
                )}
                
                {filteredPriorityClients.length === 0 && filteredOtherClients.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p>Nenhum cliente encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminClientsScreen;
