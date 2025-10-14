import React, { useEffect, ReactNode, useState, useMemo } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import BookingScreen from './screens/BookingScreen';
import BookingSummaryScreen from './screens/BookingSummaryScreen';
import AdminDashboard from './screens/AdminDashboard';
import AdminServicesEmployeesScreen from './screens/AdminServicesEmployeesScreen';
import AdminEmployeesScreen from './screens/AdminEmployeesScreen';
import AdminStockScreen from './screens/AdminStockScreen';
import NotFoundScreen from './screens/NotFoundScreen';
import ProfileScreen from './screens/ProfileScreen';
import AppointmentsListScreen from './screens/AppointmentsListScreen';
import AdminAddEmployeeScreen from './screens/AdminAddEmployeeScreen';
import AdminClientsScreen from './screens/AdminClientsScreen';
import AdminClientDetailScreen from './screens/AdminClientDetailScreen';
import AdminSalonSettingsScreen from './screens/AdminSalonSettingsScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import { AppointmentsProvider } from './contexts/AppointmentsContext';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import { StockProvider } from './contexts/StockContext';
import { ClientsProvider, useClients } from './contexts/ClientsContext';
import { ServicesProvider } from './contexts/ServicesContext';
import { ProfessionalsProvider, useProfessionals } from './contexts/ProfessionalsContext';
import { RolesProvider } from './contexts/RolesContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EditProfileScreen from './screens/EditProfileScreen';
import AdminEditEmployeeScreen from './screens/AdminEditEmployeeScreen';
import { AvatarsProvider } from './contexts/AvatarsContext';
import AdminManagementScreen from './screens/AdminManagementScreen';
import AdminCashierScreen from './screens/AdminCashierScreen';
import { ValesProvider } from './contexts/ValesContext';
import { CashierProvider } from './contexts/CashierContext';
import { FinancialsProvider } from './contexts/FinancialsContext';
import { SalesHistoryProvider } from './contexts/SalesHistoryContext';
import { PaymentProvider } from './contexts/PaymentContext';
import AdminEmployeeProfileScreen from './screens/AdminEmployeeProfileScreen';
import AdminEmployeeFinancesScreen from './screens/AdminEmployeeFinancesScreen';
import AdminEmployeeCashierScreen from './screens/AdminEmployeeCashierScreen';
import AdminForgotPasswordScreen from './screens/AdminForgotPasswordScreen';
import AdminRecoveryQuestionsScreen from './screens/AdminRecoveryQuestionsScreen';
import AdminShowPasswordScreen from './screens/AdminShowPasswordScreen';
import { ExpensesProvider } from './contexts/ExpensesContext';
import { PackagesProvider } from './contexts/PackagesContext';
import ClientPackagesScreen from './screens/ClientPackagesScreen';
import { SalonSettingsContext, useSalonSettings, defaultSettings, SETTINGS_KEY, SalonSettings, SalonSettingsContextType } from './salonSettings';
import DailySalesDetailScreen from './screens/DailySalesDetailScreen';
import AdminEmployeePersonalDashboard from './screens/AdminEmployeePersonalDashboard';
import AdminEmployeePersonalCashierScreen from './screens/AdminEmployeePersonalCashierScreen';
import AdminEmployeePersonalStockScreen from './screens/AdminEmployeePersonalStockScreen';
import { DiscountsProvider } from './contexts/DiscountsContext';
import { DocumentsProvider } from './contexts/DocumentsContext';
import HairAIAssistantScreen from './screens/HairAIAssistantScreen';
import ChatbotModal from './components/ChatbotModal';
import ChatbotFAB from './components/ChatbotFAB';
import AdminChatbotFAB from './components/AdminChatbotFAB';
import AdminChatbotModal from './components/AdminChatbotModal';
import WhatsAppFAB from './components/WhatsAppFAB';
import BottomNav from './components/BottomNav';
import CalendarIcon from './components/icons/CalendarIcon';
import ListIcon from './components/icons/ListIcon';
import ProfileIcon from './components/icons/ProfileIcon';

const SalonSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SalonSettings>(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                const mergedSettings = {
                    ...defaultSettings,
                    ...parsed,
                    promotionalCampaign: {
                        ...defaultSettings.promotionalCampaign,
                        ...(parsed.promotionalCampaign || {})
                    }
                };
                // Ensure salonName exists, if migrating from old settings
                if (!('salonName' in mergedSettings)) {
                    mergedSettings.salonName = defaultSettings.salonName;
                }
                 // Handle legacy welcomeTitle
                if ('welcomeTitle' in parsed && !('salonName' in parsed)) {
                     mergedSettings.salonName = parsed.welcomeTitle.replace('Bem-vindo ao ', '');
                }

                return mergedSettings;
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
        }
        return defaultSettings;
    });

    const saveSettings = (newSettings: SalonSettings) => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    };

    return (
        <SalonSettingsContext.Provider value={{ settings, saveSettings }}>
            {children}
        </SalonSettingsContext.Provider>
    );
};

// This component resolves the user's role (client or professional) after authentication.
// It sits inside all relevant providers to access their data.
const UserRoleResolver: React.FC = () => {
    const { currentUser, currentClient, loggedInProfessional, setCurrentClient, setLoggedInProfessional } = useAuth();
    const { clients } = useClients();
    const { professionals } = useProfessionals();

    useEffect(() => {
      if (!currentUser) {
        // If a Firebase user logs out, we only manage the `currentClient` state here.
        // The `loggedInProfessional` is managed by its own separate, non-Firebase login system
        // and should not be cleared by this resolver.
        if (currentClient) setCurrentClient(null);
        return;
      }
      
      // If user is already identified (either as client or admin), no need to re-check.
      if (currentClient || loggedInProfessional) return;

      // Find if the Firebase user is a professional
      const professional = professionals.find(p => p.email?.toLowerCase() === currentUser.email?.toLowerCase());
      if (professional) {
          setLoggedInProfessional(professional);
          setCurrentClient(null);
          return;
      }
      
      // Find if the Firebase user is a client
      const client = clients.find(c => c.email?.toLowerCase() === currentUser.email?.toLowerCase());
      if (client) {
          setCurrentClient(client);
          setLoggedInProfessional(null);
      }
      // If not found in either, they will remain null.

    }, [currentUser, clients, professionals, currentClient, loggedInProfessional, setCurrentClient, setLoggedInProfessional]);

    return null; // This component does not render anything.
};

const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>
    <ClientsProvider>
      <ProfessionalsProvider>
        <UserRoleResolver />
        <SalonSettingsProvider>
          <AvatarsProvider>
            <StockProvider>
              <ServicesProvider>
                <AppointmentsProvider>
                  <RolesProvider>
                    <ValesProvider>
                      <CashierProvider>
                        <FinancialsProvider>
                          <SalesHistoryProvider>
                            <PaymentProvider>
                              <ExpensesProvider>
                                <PackagesProvider>
                                  <DiscountsProvider>
                                    <DocumentsProvider>
                                      {children}
                                    </DocumentsProvider>
                                  </DiscountsProvider>
                                </PackagesProvider>
                              </ExpensesProvider>
                            </PaymentProvider>
                          </SalesHistoryProvider>
                        </FinancialsProvider>
                      </CashierProvider>
                    </ValesProvider>
                  </RolesProvider>
                </AppointmentsProvider>
              </ServicesProvider>
            </StockProvider>
          </AvatarsProvider>
        </SalonSettingsProvider>
      </ProfessionalsProvider>
    </ClientsProvider>
  </AuthProvider>
);

const AppContent: React.FC = () => {
  const { settings } = useSalonSettings();
  const { loggedInProfessional } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isAdminChatbotOpen, setIsAdminChatbotOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = settings.salonName;
  }, [settings.salonName]);
  
  const clientNavItems = useMemo(() => {
    const items: {
        path?: string;
        onClick?: () => void;
        label: string;
        icon: React.ReactNode;
    }[] = [
        { path: '/agendar', label: 'Agendar', icon: <CalendarIcon className="w-7 h-7" /> },
        { path: '/agendamentos', label: 'Agendamentos', icon: <ListIcon className="w-7 h-7" /> },
    ];
    
    items.push({ path: '/perfil', label: 'Perfil', icon: <ProfileIcon className="w-7 h-7" /> });

    return items;
  }, []);


  const clientRegexPaths = [
    /^\/agendar/,
    /^\/resumo/,
    /^\/perfil$/,
    /^\/pacotes/,
    /^\/agendamentos(\/.*)?$/,
  ];
  
  const showClientUI = clientRegexPaths.some(regex => regex.test(location.pathname));
  const showAdminUI = location.pathname.startsWith('/admin') && loggedInProfessional;

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="max-w-7xl mx-auto bg-black min-h-screen">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordScreen />} />
          <Route path="/agendar" element={<BookingScreen />} />
          <Route path="/agendar/assistente-ia" element={<HairAIAssistantScreen />} />
          <Route path="/resumo" element={<BookingSummaryScreen />} />
          <Route path="/perfil" element={<ProfileScreen />} />
          <Route path="/perfil/editar" element={<EditProfileScreen />} />
          <Route path="/pacotes" element={<ClientPackagesScreen />} />
          <Route path="/agendamentos" element={<AppointmentsListScreen />} />
          <Route path="/agendamentos/:appointmentId" element={<AppointmentDetailScreen />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginScreen />} />
          <Route path="/admin/recuperar-senha" element={<AdminForgotPasswordScreen />} />
          <Route path="/admin/recuperar-senha/perguntas" element={<AdminRecoveryQuestionsScreen />} />
          <Route path="/admin/recuperar-senha/resultado" element={<AdminShowPasswordScreen />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/servicos" element={<AdminServicesEmployeesScreen />} />
          <Route path="/admin/funcionarios" element={<AdminEmployeesScreen />} />
          <Route path="/admin/perfil/:employeeId" element={<AdminEmployeeProfileScreen />} />
          <Route path="/admin/perfil/:employeeId/financas" element={<AdminEmployeeFinancesScreen />} />
          <Route path="/admin/perfil/:employeeId/caixa-do-dia" element={<AdminEmployeeCashierScreen />} />
          <Route path="/admin/perfil/:employeeId/gestao-pessoal" element={<AdminEmployeePersonalDashboard />} />
          <Route path="/admin/perfil/:employeeId/meu-caixa" element={<AdminEmployeePersonalCashierScreen />} />
          <Route path="/admin/perfil/:employeeId/meu-estoque" element={<AdminEmployeePersonalStockScreen />} />
          <Route path="/admin/adicionar-funcionario" element={<AdminAddEmployeeScreen />} />
          <Route path="/admin/editar-funcionario/:employeeId" element={<AdminEditEmployeeScreen />} />
          <Route path="/admin/clientes" element={<AdminClientsScreen />} />
          <Route path="/admin/clientes/:clientId" element={<AdminClientDetailScreen />} />
          <Route path="/admin/estoque" element={<AdminStockScreen />} />
          <Route path="/admin/gestao" element={<AdminManagementScreen />} />
          <Route path="/admin/gestao/vendas-do-dia" element={<DailySalesDetailScreen />} />
          <Route path="/admin/caixa" element={<AdminCashierScreen />} />
          <Route path="/admin/meu-salao" element={<AdminSalonSettingsScreen />} />

          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
        
        {showClientUI && <BottomNav items={clientNavItems} />}
        {settings.isWhatsappEnabled && showClientUI && <WhatsAppFAB />}
        {settings.isChatbotEnabled && showClientUI && <ChatbotFAB onOpen={() => setIsChatbotOpen(true)} />}
        <ChatbotModal isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

        {settings.isAdminChatbotEnabled && showAdminUI && <AdminChatbotFAB onOpen={() => setIsAdminChatbotOpen(true)} />}
        {settings.isAdminChatbotEnabled && showAdminUI && <AdminChatbotModal isOpen={isAdminChatbotOpen} onClose={() => setIsAdminChatbotOpen(false)} />}
      </div>
    </div>
  );
}

const App: React.FC = () => {
  useEffect(() => {
    const savedScale = localStorage.getItem('app-font-scale');
    if (savedScale) {
      // Set font size based on user preference on app load
      document.documentElement.style.fontSize = `${parseFloat(savedScale) * 16}px`;
    }
  }, []);

  return (
    <AppProviders>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProviders>
  );
};

export default App;