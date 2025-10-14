
import { useMemo } from 'react';
import { useFinancials } from '../contexts/FinancialsContext';

// Helper function to find the Nth business day of a month
const getNthBusinessDay = (year: number, month: number, n: number): Date => {
    let count = 0;
    // Start from day 1 to avoid issues with month transitions if we start at 0
    let date = new Date(year, month, 1);
    while (count < n) {
        // Only check valid days of the current month
        if (date.getMonth() === month) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
                count++;
            }
            if (count < n) {
                date.setDate(date.getDate() + 1);
            }
        } else {
            // If 'n' is larger than available business days, break and return the last valid day
            date.setDate(date.getDate() - 1);
            break;
        }
    }
    return date;
};


export const usePaymentCycle = (offset: number = 0) => {
    const { settings } = useFinancials();
    const { cycleConfig } = settings;

    const currentCycle = useMemo(() => {
        const { cycleType, dayOne, dayTwo, businessDay, weeklyDay } = cycleConfig;
        
        const dateToCalculateFrom = new Date();
        dateToCalculateFrom.setHours(0, 0, 0, 0);

        // Adjust the date based on the offset for calculation
        if (offset !== 0) {
            switch (cycleType) {
                case 'weekly':
                    dateToCalculateFrom.setDate(dateToCalculateFrom.getDate() + offset * 7);
                    break;
                case 'day_5':
                case 'business_day':
                    dateToCalculateFrom.setMonth(dateToCalculateFrom.getMonth() + offset);
                    break;
                case 'days_5_20':
                    const d1_offset = parseInt(dayOne, 10);
                    const d2_offset = parseInt(dayTwo, 10);
                    const firstDay_offset = Math.min(d1_offset, d2_offset);
                    const secondDay_offset = Math.max(d1_offset, d2_offset);
                    
                    let monthOffset = 0;
                    let periodInMonth = 0; // 0 for first half, 1 for second half

                    if (dateToCalculateFrom.getDate() >= secondDay_offset) {
                        periodInMonth = 1;
                    } else if (dateToCalculateFrom.getDate() >= firstDay_offset) {
                        periodInMonth = 0;
                    } else {
                        periodInMonth = 1;
                        monthOffset = -1;
                    }
                    
                    const totalPeriodIndex = (dateToCalculateFrom.getFullYear() * 12 + (dateToCalculateFrom.getMonth() + monthOffset)) * 2 + periodInMonth;
                    const targetPeriodIndex = totalPeriodIndex + offset;
                    
                    const targetYear = Math.floor(targetPeriodIndex / 24);
                    const targetMonth = Math.floor((targetPeriodIndex % 24) / 2);
                    const targetPeriodInMonth = targetPeriodIndex % 2;

                    dateToCalculateFrom.setFullYear(targetYear, targetMonth, 1);
                    if (targetPeriodInMonth === 0) {
                        dateToCalculateFrom.setDate(firstDay_offset);
                    } else {
                        dateToCalculateFrom.setDate(secondDay_offset);
                    }
                    break;
            }
        }
        
        const year = dateToCalculateFrom.getFullYear();
        const month = dateToCalculateFrom.getMonth();
        const day = dateToCalculateFrom.getDate();

        let startDate = new Date(dateToCalculateFrom);
        let endDate = new Date(dateToCalculateFrom);
        
        switch (cycleType) {
            case 'days_5_20':
                const d1 = parseInt(dayOne, 10);
                const d2 = parseInt(dayTwo, 10);
                const firstDayOfMonth = Math.min(d1, d2);
                const secondDayOfMonth = Math.max(d1, d2);
                
                if (day >= firstDayOfMonth && day < secondDayOfMonth) {
                    startDate = new Date(year, month, firstDayOfMonth);
                    endDate = new Date(year, month, secondDayOfMonth - 1);
                } else if (day >= secondDayOfMonth) {
                    startDate = new Date(year, month, secondDayOfMonth);
                    endDate = new Date(year, month + 1, firstDayOfMonth - 1);
                } else { // day < firstDayOfMonth
                    startDate = new Date(year, month - 1, secondDayOfMonth);
                    endDate = new Date(year, month, firstDayOfMonth - 1);
                }
                break;
            
            case 'day_5':
                 const closeDay = parseInt(dayOne, 10);
                 if (day >= closeDay) {
                    startDate = new Date(year, month, closeDay);
                    endDate = new Date(year, month + 1, closeDay - 1);
                } else {
                    startDate = new Date(year, month - 1, closeDay);
                    endDate = new Date(year, month, closeDay - 1);
                }
                break;

            case 'weekly':
                const weeklyCloseDayNum = parseInt(weeklyDay, 10);
                const todayDayNum = dateToCalculateFrom.getDay();
                
                const diff = weeklyCloseDayNum - todayDayNum;
                const daysUntilNextClose = diff >= 0 ? diff : diff + 7;

                endDate = new Date(dateToCalculateFrom);
                endDate.setDate(dateToCalculateFrom.getDate() + daysUntilNextClose);
                
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 6);
                
                break;
            
            case 'business_day':
                const nthBusinessDay = parseInt(businessDay, 10);
                const closeDateThisMonth = getNthBusinessDay(year, month, nthBusinessDay);
                
                if (dateToCalculateFrom > closeDateThisMonth) {
                    startDate = new Date(closeDateThisMonth);
                    startDate.setDate(startDate.getDate() + 1);
                    endDate = getNthBusinessDay(year, month + 1, nthBusinessDay);
                } else {
                    const closeDateLastMonth = getNthBusinessDay(year, month - 1, nthBusinessDay);
                    startDate = new Date(closeDateLastMonth);
                    startDate.setDate(startDate.getDate() + 1);
                    endDate = closeDateThisMonth;
                }
                break;

            default:
                break;
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }, [cycleConfig, offset]);

    return { currentCycle };
};
