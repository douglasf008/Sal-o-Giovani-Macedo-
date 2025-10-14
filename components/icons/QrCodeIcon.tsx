
import React from 'react';

const QrCodeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75h.008v.008H6V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 7.5h.008v.008H6v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5-7.5h.008v.008h-.008V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v4.5a1.125 1.125 0 0 1-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5A1.125 1.125 0 0 1 8.25 13.5h4.5a1.125 1.125 0 0 1 1.125 1.125Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625-1.5 29.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.625 13.5 1.125 1.125" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.625 19.125v.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 18-.001.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.875 16.875.001.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m18 15.75-.001.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.125 14.625.001.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.125 19.125-.001.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m18 20.25.001-.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.875 21.375-.001-.001" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 22.5.001-.001" />
  </svg>
);

export default QrCodeIcon;
