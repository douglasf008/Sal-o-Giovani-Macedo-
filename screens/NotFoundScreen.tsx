
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <h1 className="text-4xl font-bold mb-4">404 - Página não encontrada</h1>
            <p className="text-lg text-gray-400 mb-8">A página que você está procurando não existe.</p>
            <Link to="/" className="px-6 py-2 bg-gray-200 text-black font-bold rounded-lg hover:bg-white transition-colors">
                Voltar para o início
            </Link>
        </div>
    );
};

export default NotFoundScreen;
