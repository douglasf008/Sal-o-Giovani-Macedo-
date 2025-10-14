
import React from 'react';

const CakeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.25a2.25 2.25 0 0 1-2.25-2.25V12a2.25 2.25 0 0 0-4.5 0v1.028a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V12a2.25 2.25 0 0 0-4.5 0v.75M21 15.25H3M3.75 15.25A2.25 2.25 0 0 1 6 13h12a2.25 2.25 0 0 1 2.25 2.25m-15-6.75a.75.75 0 0 0 0 1.5.75.75 0 0 0 0-1.5Zm0 0V3.75c0-1.036.84-1.875 1.875-1.875h.375c1.036 0 1.875.84 1.875 1.875v3.75m0-1.5h-.375m10.125-3H16.5c-1.036 0-1.875.84-1.875 1.875v3.75c0 .414.336.75.75.75h.375a.75.75 0 0 0 0-1.5.75.75 0 0 0 0-1.5Zm-5.625-3.375c0-1.036.84-1.875 1.875-1.875h.375c1.036 0 1.875.84 1.875 1.875v3.75m0-1.5h-.375" />
  </svg>
);

export default CakeIcon;
