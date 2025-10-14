import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Modality } from '@google/genai';

import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import CameraIcon from '../components/icons/CameraIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PencilIcon from '../components/icons/PencilIcon';

const HairAIAssistantScreen: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'image' | 'text'>('image'); // 'image' for inspiration photo, 'text' for description
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sourceFileInputRef = useRef<HTMLInputElement>(null);
    const styleFileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        imageSetter: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                imageSetter(reader.result as string);
                setGeneratedImage(null); // Clear previous generation
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError('Por favor, envie sua foto para continuar.');
            return;
        }
        if (mode === 'image' && !styleImage) {
            setError('Por favor, envie a foto de inspiração.');
            return;
        }
        if (mode === 'text' && !prompt.trim()) {
            setError('Por favor, descreva a cor ou estilo desejado.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const sourceImageBase64 = sourceImage.split(',')[1];
            const sourceMimeType = sourceImage.split(';')[0].split(':')[1];

            const parts = [{
                inlineData: {
                    data: sourceImageBase64,
                    mimeType: sourceMimeType,
                },
            }];

            if (mode === 'image' && styleImage) {
                const styleImageBase64 = styleImage.split(',')[1];
                const styleMimeType = styleImage.split(';')[0].split(':')[1];
                parts.push({
                    inlineData: {
                        data: styleImageBase64,
                        mimeType: styleMimeType,
                    },
                } as any);
                parts.push({
                    text: 'Analise o estilo e a cor do cabelo na segunda imagem. Aplique esse mesmo estilo e cor de cabelo na pessoa da primeira imagem. Mantenha o rosto da pessoa, o fundo e as roupas da primeira imagem o mais fiel possível ao original.',
                } as any);
            } else if (mode === 'text' && prompt) {
                parts.push({
                    text: prompt,
                } as any);
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            let foundImage = false;
            if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                        setGeneratedImage(imageUrl);
                        foundImage = true;
                        break; // Use the first image found
                    }
                }
            }

            if (!foundImage) {
                setError("A IA não conseguiu gerar uma imagem. Tente com outras fotos ou uma descrição diferente.");
            }

        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao gerar a imagem. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // UI component for the uploader box to avoid repetition
    const ImageUploader: React.FC<{
        title: string;
        image: string | null;
        icon: React.ReactNode;
        onUploadClick: () => void;
    }> = ({ title, image, icon, onUploadClick }) => (
        <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <button
                onClick={onUploadClick}
                className="w-full aspect-[3/4] bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-center hover:bg-gray-700 hover:border-gray-500 transition-colors overflow-hidden relative"
            >
                {image ? (
                    <>
                        <img src={image} alt={title} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="font-semibold text-white">Trocar Foto</span>
                        </div>
                    </>
                ) : (
                    <>
                        {icon}
                        <span className="font-semibold text-lg mt-4">
                            Clique para enviar
                        </span>
                    </>
                )}
            </button>
        </div>
    );
    
    const canGenerate = sourceImage && ((mode === 'image' && styleImage) || (mode === 'text' && prompt.trim()));


    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="flex items-center p-4 border-b border-gray-800">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto">Assistente de Cor IA</h1>
                <div className="w-6 h-6"></div>
            </header>

            <main className="flex-grow overflow-y-auto p-6 space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Visualize seu Novo Visual!</h2>
                    <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Envie sua foto e escolha como quer gerar sua simulação: com uma foto de inspiração ou descrevendo a cor.</p>
                </div>

                {/* Main source image uploader */}
                <div className="max-w-md mx-auto">
                     <ImageUploader
                        title="1. Sua Foto"
                        image={sourceImage}
                        icon={<CameraIcon className="w-12 h-12 text-gray-500"/>}
                        onUploadClick={() => sourceFileInputRef.current?.click()}
                    />
                     <input
                        type="file"
                        ref={sourceFileInputRef}
                        onChange={(e) => handleImageUpload(e, setSourceImage)}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
                
                {/* Mode selector and conditional input */}
                <div>
                    <h3 className="font-semibold text-lg mb-2 text-center">2. Escolha o método de inspiração</h3>
                    <div className="flex gap-2 bg-gray-800 p-1 rounded-lg max-w-md mx-auto">
                        <button
                            onClick={() => setMode('image')}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-2 rounded-md text-sm font-semibold transition-colors ${mode === 'image' ? 'bg-gray-200 text-black' : 'text-gray-400 hover:bg-gray-700'}`}
                        >
                            <SparklesIcon className="w-5 h-5"/>
                            Usar Foto de Inspiração
                        </button>
                        <button
                            onClick={() => setMode('text')}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-2 rounded-md text-sm font-semibold transition-colors ${mode === 'text' ? 'bg-gray-200 text-black' : 'text-gray-400 hover:bg-gray-700'}`}
                        >
                            <PencilIcon className="w-5 h-5"/>
                            Descrever a Cor
                        </button>
                    </div>

                    <div className="mt-4 max-w-md mx-auto">
                        {mode === 'image' ? (
                            <>
                                 <ImageUploader
                                    title="Foto de Inspiração"
                                    image={styleImage}
                                    icon={<SparklesIcon className="w-12 h-12 text-gray-500"/>}
                                    onUploadClick={() => styleFileInputRef.current?.click()}
                                />
                                <input
                                    type="file"
                                    ref={styleFileInputRef}
                                    onChange={(e) => handleImageUpload(e, setStyleImage)}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </>
                        ) : (
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Descreva a Cor/Estilo</h3>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    rows={4}
                                    className="w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-solid"
                                    placeholder="Ex: Cabelo loiro platinado com a raiz escura"
                                />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Generate Button */}
                <div className="max-w-md mx-auto">
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !canGenerate}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-blue-500 transition-colors duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            'Gerando...'
                        ) : (
                            <>
                                <SparklesIcon className="w-6 h-6"/>
                                Gerar Simulação com IA
                            </>
                        )}
                    </button>
                </div>
                
                {error && <p className="text-center text-red-400 max-w-md mx-auto">{error}</p>}
                
                {isLoading && (
                    <div className="text-center space-y-4 p-8 bg-gray-900 rounded-lg max-w-md mx-auto">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                        <p className="font-semibold text-blue-300">Aguarde, a mágica está acontecendo...</p>
                        <p className="text-sm text-gray-400">Isso pode levar alguns instantes.</p>
                    </div>
                )}

                {(!isLoading && (generatedImage || sourceImage)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                            <h3 className="font-semibold mb-2">Original</h3>
                            {sourceImage && <img src={sourceImage} alt="Original" className="rounded-lg w-full"/>}
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold mb-2">Resultado da IA</h3>
                            {generatedImage ? (
                                <img src={generatedImage} alt="Gerado pela IA" className="rounded-lg w-full"/>
                            ) : (
                                !isLoading && <div className="aspect-[3/4] bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">A simulação aparecerá aqui.</div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HairAIAssistantScreen;