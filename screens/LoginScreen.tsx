import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { useAuth } from '../contexts/AuthContext';
import WarningIcon from '../components/icons/WarningIcon';
import { useClients } from '../contexts/ClientsContext';

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { clientLogin, clientSignup, isFirebaseAvailable } = useAuth();
    const { addClient } = useClients();

    const initialTab = location.state?.initialTab || 'login';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Form states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupBirthdate, setSignupBirthdate] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const getFirebaseErrorMessage = (e: any) => {
        switch (e.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Email ou senha inválidos.';
            case 'auth/email-already-in-use':
                return 'Este email já está cadastrado.';
            case 'auth/weak-password':
                return 'A senha deve ter pelo menos 6 caracteres.';
            default:
                console.error(e);
                return 'Ocorreu um erro. Tente novamente.';
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFirebaseAvailable) return;
        setLoading(true);
        setError('');
        try {
            await clientLogin(loginEmail, loginPassword);
            navigate('/agendar');
        } catch (e) {
            setError(getFirebaseErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFirebaseAvailable) return;
        setLoading(true);
        setError('');
        try {
            const userCredential = await clientSignup(signupEmail, signupPassword);
            if (userCredential.user) {
                await addClient({ name: signupName, email: signupEmail, phone: signupPhone, birthdate: signupBirthdate });
            }
            navigate('/agendar');
        } catch (e) {
            setError(getFirebaseErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate('/')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Acessar Conta</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>
            
            <div className="px-4 border-b border-gray-700">
                <div className="flex space-x-6">
                    <button 
                        onClick={() => setActiveTab('login')}
                        className={`py-3 text-sm font-semibold ${activeTab === 'login' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                    >
                        Entrar
                    </button>
                    <button 
                        onClick={() => setActiveTab('signup')}
                        className={`py-3 text-sm font-semibold ${activeTab === 'signup' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                    >
                        Cadastrar
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
                {!isFirebaseAvailable && (
                    <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200 text-sm flex items-start gap-3">
                        <WarningIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-yellow-400" />
                        <p>O login e cadastro de clientes está desativado. O administrador precisa configurar as credenciais do Firebase para habilitar esta funcionalidade.</p>
                    </div>
                )}
                {activeTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <fieldset disabled={!isFirebaseAvailable || loading} className="space-y-6">
                            <div>
                                <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    id="login-email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                    placeholder="seuemail@exemplo.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="login-password"  className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                                <input
                                    type="password"
                                    id="login-password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                    placeholder="********"
                                />
                            </div>
                        </fieldset>
                        <Link to="/recuperar-senha" className={`text-sm text-gray-400 hover:text-white block text-right ${!isFirebaseAvailable ? 'pointer-events-none opacity-50' : ''}`}>Esqueceu sua senha?</Link>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                         <button
                            type="submit"
                            disabled={!isFirebaseAvailable || loading}
                            className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                        <fieldset disabled={!isFirebaseAvailable || loading} className="space-y-6">
                            <div>
                                <label htmlFor="signup-name" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    id="signup-name"
                                    value={signupName}
                                    onChange={(e) => setSignupName(e.target.value)}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                    placeholder="Maria Clara"
                                />
                            </div>
                             <div>
                                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    id="signup-email"
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                    placeholder="seuemail@exemplo.com"
                                />
                            </div>
                             <div>
                                <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-300 mb-2">Celular</label>
                                <input
                                    type="tel"
                                    id="signup-phone"
                                    value={signupPhone}
                                    onChange={(e) => setSignupPhone(e.target.value)}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                    placeholder="(11) 99999-8888"
                                />
                            </div>
                             <div>
                                <label htmlFor="signup-birthdate" className="block text-sm font-medium text-gray-300 mb-2">Data de Nascimento</label>
                                <input
                                    type="date"
                                    id="signup-birthdate"
                                    value={signupBirthdate}
                                    onChange={(e) => setSignupBirthdate(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="signup-password"  className="block text-sm font-medium text-gray-300 mb-2">Crie uma Senha</label>
                                <input
                                    type="password"
                                    id="signup-password"
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                    placeholder="Mínimo de 6 caracteres"
                                />
                            </div>
                        </fieldset>
                        <p className="text-xs text-gray-500">
                           Ao se cadastrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
                        </p>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                         <button
                            type="submit"
                            disabled={!isFirebaseAvailable || loading}
                            className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
