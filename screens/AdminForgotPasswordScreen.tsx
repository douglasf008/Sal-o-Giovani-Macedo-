
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { useProfessionals } from '../contexts/ProfessionalsContext';

const AdminForgotPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loginId, setLoginId] = useState('');
    const [error, setError] = useState('');
    const { professionals } = useProfessionals();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const professional = professionals.find(p => p.loginId === loginId);

        if (professional) {
            navigate('/admin/recuperar-senha/perguntas', { state: { employeeId: professional.id } });
        } else {
            setError('Código de Acesso não encontrado.');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate('/admin/login')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Recuperar Senha</h1>
                <div className="w-6 h-6"></div>
            </header>
            
            <div className="flex-grow flex items-center justify-center p-6">
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
                    <div>
                        <label htmlFor="login-id-input" className="block text-sm font-medium text-gray-300 mb-2">
                            Seu Código de Acesso
                        </label>
                        <input
                            type="text"
                            id="login-id-input"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Ex: 001"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Insira seu código de acesso para iniciar a recuperação.
                        </p>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300"
                    >
                        Continuar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminForgotPasswordScreen;
