import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { useAuth } from '../contexts/AuthContext';
import { useProfessionals } from '../contexts/ProfessionalsContext';

const AdminLoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setLoggedInProfessional, logout } = useAuth();
    const { professionals } = useProfessionals();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Log out any existing firebase user first
            await logout();
            
            const professional = professionals.find(p => p.loginId === loginId && p.password === password);
            if (!professional) {
                throw new Error("Código de Acesso ou senha inválidos.");
            }
            setLoggedInProfessional(professional);
            navigate('/admin');
        } catch (e: any) {
            setError(e.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate('/')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Login do Administrador</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>
            
            <div className="flex-grow flex items-center justify-center p-6">
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
                    <div>
                        <label htmlFor="admin-login-id" className="block text-sm font-medium text-gray-300 mb-2">Código de Acesso</label>
                        <input
                            type="text"
                            id="admin-login-id"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: 001"
                        />
                    </div>
                    <div>
                        <label htmlFor="admin-password"  className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                        <input
                            type="password"
                            id="admin-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="********"
                        />
                        <Link to="/admin/recuperar-senha" className="text-sm text-gray-400 hover:text-white block text-right mt-2">Esqueceu sua senha?</Link>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:text-gray-400"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginScreen;
