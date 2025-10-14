
import React, { useState } from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface CalendarProps {
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
    disabledDays?: number[];
    disablePastDates?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, disabledDays = [], disablePastDates = true }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dayOfWeek = date.getDay();
        const isPast = disablePastDates && date < today;
        const isDisabled = disabledDays.includes(dayOfWeek) || isPast;
        const isSelected = selectedDate?.toDateString() === date.toDateString();
        const isToday = new Date().toDateString() === date.toDateString();

        let dayClass = "w-10 h-10 flex items-center justify-center rounded-full transition-colors";
        
        if (isDisabled) {
            dayClass += " bg-red-900/40 text-gray-600 cursor-not-allowed";
        } else {
            dayClass += " cursor-pointer hover:bg-gray-700";
            if (isSelected) {
                dayClass += " bg-gray-200 text-black font-bold";
            } else if (isToday) {
                dayClass += " border border-gray-500";
            }
        }


        days.push(
            <div key={i} className={dayClass} onClick={() => !isDisabled && onDateSelect(date)}>
                {i}
            </div>
        );
    }
    
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <div className="p-4 bg-black rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h2 className="font-bold text-lg capitalize">{monthName} {year}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-800"><ChevronRightIcon /></button>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-sm text-gray-400 mb-2">
                {weekDays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center">
                {days}
            </div>
        </div>
    );
};

export default Calendar;
