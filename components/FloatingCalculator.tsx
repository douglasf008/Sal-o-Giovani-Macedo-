import React, { useState, useEffect, useRef } from 'react';
import XIcon from './icons/XIcon';

interface FloatingCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

const CalculatorButton: React.FC<{ onClick: () => void; className?: string; children: React.ReactNode }> = ({ onClick, className = '', children }) => (
    <button
        onClick={onClick}
        className={`bg-gray-700 hover:bg-gray-600 rounded-lg text-2xl font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 ${className}`}
    >
        {children}
    </button>
);

const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({ isOpen, onClose }) => {
    const [displayValue, setDisplayValue] = useState('0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 170, y: window.innerHeight / 2 - 260 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const calculatorRef = useRef<HTMLDivElement>(null);

    const inputDigit = (digit: string) => {
        if (waitingForSecondOperand) {
            setDisplayValue(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
        }
    };
    
    const inputDecimal = () => {
        if (waitingForSecondOperand) {
            setDisplayValue('0.');
            setWaitingForSecondOperand(false);
            return;
        }
        if (!displayValue.includes('.')) {
            setDisplayValue(displayValue + '.');
        }
    };
    
    const clearAll = () => {
        setDisplayValue('0');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(displayValue);

        if (operator && firstOperand !== null && !waitingForSecondOperand) {
            const result = calculate(firstOperand, inputValue, operator);
            const resultString = String(parseFloat(result.toPrecision(15)));
            setDisplayValue(resultString);
            setFirstOperand(result);
        } else {
            setFirstOperand(inputValue);
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator);
    };

    const handleEquals = () => {
        if (operator && firstOperand !== null) {
            const inputValue = parseFloat(displayValue);
            const result = calculate(firstOperand, inputValue, operator);
            const resultString = String(parseFloat(result.toPrecision(15)));
            
            setDisplayValue(resultString);
            setFirstOperand(null);
            setOperator(null);
            setWaitingForSecondOperand(true);
        }
    }
    
    const toggleSign = () => {
        const currentValue = parseFloat(displayValue);
        if (currentValue !== 0) {
            setDisplayValue(String(currentValue * -1));
        }
    }

    const calculate = (first: number, second: number, op: string): number => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '*': return first * second;
            case '/': return second === 0 ? NaN : first / second; // Handle division by zero
            default: return second;
        }
    };


    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!calculatorRef.current) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
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
        if (isDragging) {
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
    }, [isDragging]);


    if (!isOpen) return null;
    
    const displayOutput = displayValue === 'NaN' ? 'Erro' : displayValue.replace('.', ',');

    return (
        <div
            ref={calculatorRef}
            className="fixed bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl z-50 select-none w-[340px]"
            style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calculator-title"
        >
            <div
                onMouseDown={handleMouseDown}
                className="flex justify-between items-center p-3 border-b border-gray-700 cursor-move"
            >
                <h2 id="calculator-title" className="font-bold text-lg">Calculadora</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Fechar calculadora">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4">
                <div className="bg-black/50 rounded-lg p-4 text-right text-5xl font-light mb-4 break-words flex items-center justify-end" style={{ minHeight: '72px' }}>
                    <span className="truncate">{displayOutput}</span>
                </div>
                <div className="grid grid-cols-4 grid-rows-5 gap-2" style={{ height: '380px' }}>
                    <CalculatorButton onClick={clearAll} className="bg-gray-600 hover:bg-gray-500">C</CalculatorButton>
                    <CalculatorButton onClick={toggleSign} className="bg-gray-600 hover:bg-gray-500">+/-</CalculatorButton>
                    <CalculatorButton onClick={() => {}} className="bg-gray-600 hover:bg-gray-500">%</CalculatorButton>
                    <CalculatorButton onClick={() => performOperation('/')} className="bg-orange-500 hover:bg-orange-400">÷</CalculatorButton>

                    <CalculatorButton onClick={() => inputDigit('7')}>7</CalculatorButton>
                    <CalculatorButton onClick={() => inputDigit('8')}>8</CalculatorButton>
                    <CalculatorButton onClick={() => inputDigit('9')}>9</CalculatorButton>
                    <CalculatorButton onClick={() => performOperation('*')} className="bg-orange-500 hover:bg-orange-400">×</CalculatorButton>

                    <CalculatorButton onClick={() => inputDigit('4')}>4</CalculatorButton>
                    <CalculatorButton onClick={() => inputDigit('5')}>5</CalculatorButton>
                    <CalculatorButton onClick={() => inputDigit('6')}>6</CalculatorButton>
                    <CalculatorButton onClick={() => performOperation('-')} className="bg-orange-500 hover:bg-orange-400">−</CalculatorButton>

                    <CalculatorButton onClick={() => inputDigit('1')}>1</CalculatorButton>
                    <CalculatorButton onClick={() => inputDigit('2')}>2</CalculatorButton>
                    <CalculatorButton onClick={() => inputDigit('3')}>3</CalculatorButton>
                    <CalculatorButton onClick={() => performOperation('+')} className="bg-orange-500 hover:bg-orange-400">+</CalculatorButton>

                    <CalculatorButton onClick={() => inputDigit('0')} className="col-span-2">0</CalculatorButton>
                    <CalculatorButton onClick={inputDecimal}>,</CalculatorButton>
                    <CalculatorButton onClick={handleEquals} className="bg-orange-500 hover:bg-orange-400">=</CalculatorButton>
                </div>
            </div>
        </div>
    );
};

export default FloatingCalculator;