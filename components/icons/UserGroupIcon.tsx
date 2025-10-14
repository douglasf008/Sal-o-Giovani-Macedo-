import React from 'react';

const UserGroupIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.289 2.72a3 3 0 0 1-4.682-2.72 9.094 9.094 0 0 1 3.741-.479m-4.5-3.04a2.25 2.25 0 0 0-4.5 0v3.04a2.25 2.25 0 0 0 4.5 0v-3.04Zm13.5 0a2.25 2.25 0 0 0-4.5 0v3.04a2.25 2.25 0 0 0 4.5 0v-3.04Zm-7.5 0a2.25 2.25 0 0 0-4.5 0v3.04a2.25 2.25 0 0 0 4.5 0v-3.04Z" />
    </svg>
);

export default UserGroupIcon;