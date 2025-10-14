import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { useAuth } from '../contexts/AuthContext';
import WarningIcon from '../components/icons/WarningIcon';

const ForgotPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { isFirebaseAvailable } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFirebaseAvailable) return;
        // Simulate sending a password reset email
        console.log(`Password reset requested for: ${email}`);
        setIsSubmitted(true);
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate('/login')} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Recuperar Senha</h1>
                <div className="w-6 h-6"></div> {/* Spacer */}
            </header>
            
            <div className="flex-grow flex flex-col items-center justify-center p-6">
                {isSubmitted ? (
                    <div className="text-center max-w-sm">
                        <h2 className="text-2xl font-bold mb-4">Verifique seu Email</h2>
                        <p className="text-gray-300 mb-8">
                            Se uma conta com o email <span className="font-bold text-white">{email}</span> existir, enviamos um link para você redefinir sua senha.
                        </p>
                        <Link to="/login" className="w-full bg-gray-200 text-black font-bold py-3 px-6 rounded-lg text-lg hover:bg-white transition-colors duration-300">
                            Voltar para o Login
                        </Link>
                    </div>
                ) : (
                    <div className="w-full max-w-sm">
                        {!isFirebaseAvailable && (
                            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200 text-sm flex items-start gap-3">
                                <WarningIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-yellow-400" />
                                <p>A recuperação de senha está desativada. O administrador precisa configurar o Firebase.</p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <fieldset disabled={!isFirebaseAvailable}>
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email Cadastrado
                                    </label>
                                    <input
                                        type="email"
                                        id="reset-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                        placeholder="seuemail@exemplo.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Insira o email associado à sua conta para enviarmos um link de recuperação.
                                    </p>
                                </div>
                            </fieldset>
                            <button
                                type="submit"
                                disabled={!isFirebaseAvailable}
                                className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed"
                            >
                                Recuperar Senha
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordScreen;