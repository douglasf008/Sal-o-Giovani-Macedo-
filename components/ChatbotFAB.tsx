import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';

interface ChatbotFABProps {
    onOpen: () => void;
}

const ChatbotFAB: React.FC<ChatbotFABProps> = ({ onOpen }) => {
    const fabRef = useRef<HTMLButtonElement>(null);
    const dragStartRef = useRef<{ clientX: number, clientY: number, left: number, top: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const [position, setPosition] = useState({ x: -1000, y: -1000 });
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (fabRef.current) {
            const fabRect = fabRef.current.getBoundingClientRect();
            const bottomNavHeight = 80; 
            setPosition({
                x: window.innerWidth - fabRect.width - 24,
                y: window.innerHeight - fabRect.height - bottomNavHeight - 24, // 24px margin
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
        if (!hasDraggedRef.current) {
            onOpen();
        }
        
        if (fabRef.current) fabRef.current.style.cursor = 'grab';
        dragStartRef.current = null;
        
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchend', handleDragEnd);
    }, [onOpen, handleDragMove]);

    const handleDragStart = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
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


    return (
        <button
            ref={fabRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                touchAction: 'none',
                visibility: isInitialized ? 'visible' : 'hidden'
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg active:scale-95 active:cursor-grabbing transition-transform transition-opacity duration-200 z-40 cursor-grab opacity-75 hover:opacity-100"
            aria-label="Abrir assistente virtual"
        >
            <ChatBubbleLeftRightIcon className="w-8 h-8 pointer-events-none" />
        </button>
    );
};

export default ChatbotFAB;