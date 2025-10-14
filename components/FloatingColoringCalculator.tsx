import React, { useState, useEffect } from 'react';
import XIcon from './icons/XIcon';
import ColoringCalculation from './management/ColoringCalculation';

interface FloatingColoringCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

const FloatingColoringCalculator: React.FC<FloatingColoringCalculatorProps> = ({ isOpen, onClose }) => {
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 350, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = React.useRef({ x: 0, y: 0 });
    const calculatorRef = React.useRef<HTMLDivElement>(null);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024); // Tailwind's 'lg' breakpoint

    // Check screen size on mount and resize
    useEffect(() => {
        const handleResize = () => {
            const desktop = window.innerWidth >= 1024;
            setIsDesktop(desktop);
            if (!desktop) {
                // Reset position for mobile view to avoid weird offsets if resized back
                setPosition({ x: window.innerWidth / 2 - 350, y: 50 });
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDesktop || !calculatorRef.current) return;
        
        const target = e.target as HTMLElement;
        // Prevent dragging when interacting with form elements
        if (target.closest('button, input, select, textarea')) {
            return;
        }

        setIsDragging(true);
        const rect = calculatorRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging && isDesktop) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isDesktop]);

    if (!isOpen) return null;

    const desktopStyles = isDesktop ? { left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' } : {};
    const desktopClasses = "lg:rounded-2xl lg:shadow-2xl lg:w-[700px] lg:max-h-[90vh] lg:h-auto";
    const mobileClasses = "inset-0 w-full h-full";

    return (
        <div
            ref={calculatorRef}
            className={`fixed bg-gray-900/90 backdrop-blur-sm z-50 select-none flex flex-col ${desktopClasses} ${isDesktop ? 'lg:inset-auto' : mobileClasses}`}
            style={desktopStyles}
            role="dialog"
            aria-modal="true"
            aria-labelledby="coloring-calculator-title"
        >
            <div
                onMouseDown={handleMouseDown}
                className={`flex justify-between items-center p-3 border-b border-gray-700 flex-shrink-0 ${isDesktop ? 'cursor-move' : ''}`}
            >
                <h2 id="coloring-calculator-title" className="font-bold text-lg">Calculadora de Coloração</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Fechar calculadora">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 overflow-y-auto flex-grow">
                <ColoringCalculation />
            </div>
        </div>
    );
};

export default FloatingColoringCalculator;