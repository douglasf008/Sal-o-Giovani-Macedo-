import React, { useState, useEffect } from 'react';
import XIcon from './icons/XIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { PromotionalCampaign } from '../salonSettings';

interface PromotionalModalProps {
    campaign: PromotionalCampaign;
    onClose: () => void;
}

const PromotionalModal: React.FC<PromotionalModalProps> = ({ campaign, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const hasMultipleMedia = campaign.media.length > 1;

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? campaign.media.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === campaign.media.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    useEffect(() => {
        if (campaign.displayType !== 'carousel' || !hasMultipleMedia) return;
        
        const timer = setTimeout(() => {
            goToNext();
        }, 5000);

        return () => clearTimeout(timer);
    }, [currentIndex, campaign, hasMultipleMedia]);

    const renderMedia = () => {
        const mediaItem = campaign.media[currentIndex];
        if (!mediaItem) return null;

        switch (campaign.displayType) {
            case 'image':
                return <img src={campaign.media[0].url} alt={campaign.title} className="w-full h-64 object-cover" />;
            case 'video':
                const videoUrl = mediaItem.url;
                let embedUrl = videoUrl;

                if (videoUrl.includes('youtube.com/watch?v=')) {
                    const videoId = videoUrl.split('v=')[1]?.split('&')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (videoUrl.includes('youtu.be/')) {
                    const videoId = videoUrl.split('/').pop();
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
                
                return (
                    <div className="aspect-video">
                        <iframe
                            className="w-full h-full"
                            src={embedUrl}
                            title={campaign.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                );
            case 'carousel':
                return (
                    <div className="relative w-full h-64 group">
                        <img src={mediaItem.url} alt={`${campaign.title} - Slide ${currentIndex + 1}`} className="w-full h-full object-cover" />
                        {hasMultipleMedia && (
                            <>
                                <button onClick={goToPrevious} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <button onClick={goToNext} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {campaign.media.map((_, index) => (
                                        <div key={index} className={`w-2 h-2 rounded-full transition-all ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}></div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg max-w-md w-full shadow-lg text-white relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/80 transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
                {renderMedia()}
                {(campaign.title || campaign.description) && (
                    <div className="p-6">
                        {campaign.title && <h2 className="text-2xl font-bold mb-2">{campaign.title}</h2>}
                        {campaign.description && <p className="text-gray-300">{campaign.description}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromotionalModal;
