import React from 'react';

const ArrowTrendingDownIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 18 9-9 4.125 4.125L21.75 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 18v-6h-6" />
    </svg>
);

export default ArrowTrendingDownIcon;