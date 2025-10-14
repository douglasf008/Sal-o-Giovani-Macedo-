import React from 'react';

const ReceiptPercentIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 13.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 13.5h5.25M3 13.5h5.25M3 13.5h5.25m-5.25 0h5.25m6.375-3.375A1.5 1.5 0 0 1 16.5 9h1.5a1.5 1.5 0 0 1 1.5 1.5v3.375m-3.375 0h1.5a1.5 1.5 0 0 1 1.5 1.5v3.375a1.5 1.5 0 0 1-1.5 1.5h-1.5a1.5 1.5 0 0 1-1.5-1.5v-3.375a1.5 1.5 0 0 1 1.5-1.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 8.25Z" />
    </svg>
);

export default ReceiptPercentIcon;
