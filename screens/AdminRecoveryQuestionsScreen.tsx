
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { useProfessionals } from '../contexts/ProfessionalsContext';

const AdminRecoveryQuestionsScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { professionals } = useProfessionals();

    const employeeId = location.state?.employeeId;
    const employee = professionals.find(p => p.id === employeeId);

    const [cpf, setCpf] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!employee) {
            navigate('/admin/recuperar-senha', { replace: true });
        }
    }, [employee, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!employee) return;

        let correctAnswers = 0;
        if (cpf.trim() && employee.cpf && cpf.trim() === employee.cpf) {
            correctAnswers++;
        }
        if (phone.trim() && employee.phone && phone.trim() === employee.phone) {
            correctAnswers++;
        }
        if (email.trim() && employee.email && email.trim().toLowerCase() === employee.email.toLowerCase()) {
            correctAnswers++;
        }

        if (correctAnswers >= 2) {
            navigate('/admin/recuperar-senha/resultado', { state: { employeeId: employee.id } });
        } else {
            setError('As informações não correspondem. Tente novamente ou contate o suporte.');
        }
    };

    if (!employee) {
        return null; // or loading spinner while redirecting
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Verificação de Segurança</h1>
                <div className="w-6 h-6"></div>
            </header>
            
            <div className="flex-grow flex items-center justify-center p-6">
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
                    <p className="text-center text-gray-400">Para confirmar sua identidade, por favor, preencha pelo menos duas das três informações abaixo.</p>
                    <div>
                        <label htmlFor="cpf-input" className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
                        <input
                            type="text"
                            id="cpf-input"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="___.___.___-__"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone-input" className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                        <input
                            type="tel"
                            id="phone-input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="(__) _____-____"
                        />
                    </div>
                    <div>
                        <label htmlFor="email-input" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            id="email-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg text-lg hover:bg-white transition-colors duration-300"
                    >
                        Verificar Informações
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminRecoveryQuestionsScreen;
