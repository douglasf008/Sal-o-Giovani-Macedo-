
import React from 'react';

const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.308M15 19.128v-3.86a2.25 2.25 0 0 1 2.25-2.25h1.5A2.25 2.25 0 0 1 21 15.25v3.86M15 19.128a2.25 2.25 0 0 1-2.25-2.25v-3.86a2.25 2.25 0 0 1 2.25-2.25h1.5A2.25 2.25 0 0 1 18.75 15.25v3.86m-3.75-6.466a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0m4.5 0v3.86m-4.5-3.86a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0m0 0v3.86m0-3.86a2.25 2.25 0 0 0-4.5 0m4.5 0a2.25 2.25 0 0 1-4.5 0" />
    </svg>
);

export default UsersIcon;
