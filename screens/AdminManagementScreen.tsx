import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import DashboardIcon from '../components/icons/DashboardIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import ArrowTrendingUpIcon from '../components/icons/ArrowTrendingUpIcon';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import CalculatorIcon from '../components/icons/CalculatorIcon';
import ChartIcon from '../components/icons/ChartIcon';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import PaletteIcon from '../components/icons/PaletteIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PencilIcon from '../components/icons/PencilIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import TagIcon from '../components/icons/TagIcon';


// Tab Components
import ManagementDashboard from '../components/management/ManagementDashboard';
import PaymentCycles from '../components/management/PaymentCycles';
import DailyPerformance from '../components/management/DailyPerformance';
import ValesManagement from '../components/management/ValesManagement';
import CardFeesManagement from '../components/management/CardFeesManagement';
import TreatmentCostCalculator from '../components/management/TreatmentCostCalculator';
import MonthlyYearlyComparison from '../components/management/MonthlyYearlyComparison';
import { useAuth } from '../contexts/AuthContext';
import SalonExpenses from '../components/management/SalonExpenses';
import ColoringCalculation from '../components/management/ColoringCalculation';
import GeneralRegistrations from '../components/management/GeneralRegistrations';
import AppManual from '../components/management/AppManual';
import SalonDocuments from '../components/management/SalonDocuments';
import ServicePricingCalculator from '../components/management/ServicePricingCalculator';


type Tab = 'dashboard' | 'registrations' | 'cycles' | 'daily' | 'yearly' | 'treatments' | 'vales' | 'cardFees' | 'expenses' | 'coloring' | 'manual' | 'documentos' | 'pricing';

const AdminManagementScreen: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const { loggedInProfessional } = useAuth();

    useEffect(() => {
        if (!loggedInProfessional) {
            navigate('/admin/login', { replace: true });
        } else if (!loggedInProfessional.permissions?.includes('Gestão Financeira')) {
            alert('Você não tem permissão para acessar esta página.');
            navigate('/admin', { replace: true });
        }
    }, [loggedInProfessional, navigate]);

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
        { id: 'registrations', label: 'Cadastros', icon: <PencilIcon className="w-5 h-5" /> },
        { id: 'cycles', label: 'Ciclos de Pagamento', icon: <CalendarIcon className="w-5 h-5" /> },
        { id: 'daily', label: 'Desempenho Diário', icon: <ArrowTrendingUpIcon className="w-5 h-5" /> },
        { id: 'yearly', label: 'Comparativo Anual', icon: <ChartIcon className="w-5 h-5" /> },
        { id: 'pricing', label: 'Precificação de Serviço', icon: <TagIcon className="w-5 h-5" /> },
        { id: 'treatments', label: 'Custo de Tratamentos', icon: <CalculatorIcon className="w-5 h-5" /> },
        { id: 'coloring', label: 'Cálculo de Coloração', icon: <PaletteIcon className="w-5 h-5" /> },
        { id: 'vales', label: 'Gestão de Vales', icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
        { id: 'cardFees', label: 'Taxas de Cartão', icon: <ReceiptPercentIcon className="w-5 h-5" /> },
        { id: 'expenses', label: 'Despesas do Salão', icon: <ShoppingBagIcon className="w-5 h-5" /> },
        { id: 'documentos', label: 'Documentos', icon: <DocumentTextIcon className="w-5 h-5" /> },
        { id: 'manual', label: 'Manual do App', icon: <BookOpenIcon className="w-5 h-5" /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <ManagementDashboard />;
            case 'registrations': return <GeneralRegistrations />;
            case 'cycles': return <PaymentCycles />;
            case 'daily': return <DailyPerformance />;
            case 'yearly': return <MonthlyYearlyComparison />;
            case 'pricing': return <ServicePricingCalculator />;
            case 'treatments': return <TreatmentCostCalculator />;
            case 'coloring': return <ColoringCalculation />;
            case 'vales': return <ValesManagement />;
            case 'cardFees': return <CardFeesManagement />;
            case 'expenses': return <SalonExpenses />;
            case 'documentos': return <SalonDocuments />;
            case 'manual': return <AppManual />;
            default: return <ManagementDashboard />;
        }
    };

    const SidebarButton: React.FC<{ tab: { id: Tab, label: string, icon: React.ReactNode } }> = ({ tab }) => (
        <button
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id ? 'bg-gray-800 text-white font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
        >
            {tab.icon}
            <span>{tab.label}</span>
        </button>
    );

    if (!loggedInProfessional || !loggedInProfessional.permissions?.includes('Gestão Financeira')) {
        return null;
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={() => navigate('/admin')} className="p-2 -ml-2 lg:hidden"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold lg:text-2xl">Gestão Financeira</h1>
            </header>
            
            <div className="flex-grow flex lg:flex-row overflow-hidden">
                {/* --- Sidebar for Desktop --- */}
                <aside className="hidden lg:flex flex-col w-64 bg-gray-900 p-4 flex-shrink-0 border-r border-gray-800">
                    <nav className="flex flex-col gap-2">
                        {tabs.map(tab => <SidebarButton key={tab.id} tab={tab} />)}
                    </nav>
                </aside>

                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* --- Top Tabs for Mobile --- */}
                    <div className="lg:hidden px-4 border-b border-gray-700">
                        <div className="flex space-x-4 overflow-x-auto">
                            {tabs.map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 text-sm font-semibold whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- Main Content --- */}
                    <main className="flex-grow overflow-y-auto p-4 md:p-8">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminManagementScreen;