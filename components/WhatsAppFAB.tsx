import React, { useState, useRef, useEffect, useCallback } from 'react';
import WhatsAppIcon from './icons/WhatsAppIcon';
import { useSalonSettings } from '../salonSettings';

const WhatsAppFAB: React.FC = () => {
    const fabRef = useRef<HTMLAnchorElement>(null);
    const dragStartRef = useRef<{ clientX: number, clientY: number, left: number, top: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const { settings } = useSalonSettings();
    const sanitizedWhatsapp = settings.salonWhatsapp ? settings.salonWhatsapp.replace(/\D/g, '') : '';

    const [position, setPosition] = useState({ x: -1000, y: -1000 });
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (fabRef.current) {
            const fabRect = fabRef.current.getBoundingClientRect();
            const bottomNavHeight = 80; // Approximate height of the bottom nav + margin
            const chatbotFabHeight = 80; // Approximate height of chatbot FAB + margin
            setPosition({
                x: window.innerWidth - fabRect.width - 24,
                // Position it above where the ChatbotFAB would be, with some margin
                y: window.innerHeight - fabRect.height - bottomNavHeight - chatbotFabHeight, 
            });
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (fabRef.current) {
                const fabRect = fabRef.current.getBoundingClientRect();
                setPosition(currentPos => ({
                    x: Math.max(16, Math.min(currentPos.x, window.innerWidth - fabRect.width - 16)),
                    y: Math.max(16, Math.min(currentPos.y, window.innerHeight - fabRect.height - 16)),
                }));
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragStartRef.current) return;
        
        if ('touches' in e && e.cancelable) {
          e.preventDefault();
        }

        const point = 'touches' in e ? e.touches[0] : e;
        const dx = point.clientX - dragStartRef.current.clientX;
        const dy = point.clientY - dragStartRef.current.clientY;
        
        if (!hasDraggedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            hasDraggedRef.current = true;
            if (fabRef.current) fabRef.current.style.cursor = 'grabbing';
        }

        if (hasDraggedRef.current && fabRef.current) {
            const fabRect = fabRef.current.getBoundingClientRect();
            let newX = dragStartRef.current.left + dx;
            let newY = dragStartRef.current.top + dy;
            newX = Math.max(16, Math.min(newX, window.innerWidth - fabRect.width - 16));
            newY = Math.max(16, Math.min(newY, window.innerHeight - fabRect.height - 16));
            setPosition({ x: newX, y: newY });
        }
    }, []);
    
    const handleDragEnd = useCallback(() => {
        if (fabRef.current) fabRef.current.style.cursor = 'grab';
        dragStartRef.current = null;
        
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchend', handleDragEnd);
    }, [handleDragMove]);

    const handleDragStart = useCallback((e: React.MouseEvent<HTMLAnchorElement> | React.TouchEvent<HTMLAnchorElement>) => {
        hasDraggedRef.current = false;
        const point = 'touches' in e ? e.touches[0] : e;
        if (fabRef.current) {
            const rect = fabRef.current.getBoundingClientRect();
            dragStartRef.current = {
                clientX: point.clientX,
                clientY: point.clientY,
                left: rect.left,
                top: rect.top,
            };
            
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
        }
    }, [handleDragMove, handleDragEnd]);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (hasDraggedRef.current) {
            e.preventDefault();
        }
        // Reset for the next click, after the current click event has been processed.
        setTimeout(() => {
            hasDraggedRef.current = false;
        }, 0);
    };
    
    if (!sanitizedWhatsapp) {
        return null;
    }

    return (
        <a
            ref={fabRef}
            href={`https://wa.me/${sanitizedWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onClick={handleClick}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                touchAction: 'none',
                visibility: isInitialized ? 'visible' : 'hidden'
            }}
            className="bg-green-600 text-white p-4 rounded-full shadow-lg active:scale-95 active:cursor-grabbing transition-transform transition-opacity duration-200 z-40 cursor-grab opacity-75 hover:opacity-100"
            aria-label="Contatar salão via WhatsApp"
        >
            <WhatsAppIcon className="w-8 h-8 pointer-events-none" />
        </a>
    );
};

export default WhatsAppFAB;