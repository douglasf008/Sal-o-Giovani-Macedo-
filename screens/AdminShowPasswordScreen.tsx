
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EyeIcon from '../components/icons/EyeIcon';
import EyeSlashIcon from '../components/icons/EyeSlashIcon';
import { useProfessionals } from '../contexts/ProfessionalsContext';

const AdminShowPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { professionals } = useProfessionals();

    const employeeId = location.state?.employeeId;
    const employee = professionals.find(p => p.id === employeeId);

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!employee) {
            navigate('/admin/recuperar-senha', { replace: true });
        }
    }, [employee, navigate]);

    if (!employee) {
        return null; // or loading spinner while redirecting
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                 <h1 className="text-xl font-bold mx-auto">Sua Senha</h1>
            </header>
            
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                <div className="w-full max-w-sm space-y-6">
                    <h2 className="text-2xl font-bold">Olá, {employee.name}!</h2>
                    <p className="text-gray-400">Sua senha de acesso é:</p>

                    <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-center gap-4">
                        <p className={`font-mono text-2xl font-bold ${!showPassword ? 'blur-sm select-none' : ''}`}>
                            {employee.password}
                        </p>
                        <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-white" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                            {showPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500">Recomendamos que você altere sua senha no seu perfil após o login.</p>
                    
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300"
                    >
                        Ir para o Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminShowPasswordScreen;
