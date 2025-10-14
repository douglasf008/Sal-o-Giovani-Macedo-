import React from 'react';

const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.537a5.25 5.25 0 0 1-3.722-.537l-3.722.537a5.25 5.25 0 0 1-3.536-2.193l-.001-.002A5.25 5.25 0 0 1 2.25 15V9.489c0-.99.616-1.815 1.5-2.097L6 6.611a5.25 5.25 0 0 1 3.722 0l3.722-.537a5.25 5.25 0 0 1 3.225.537l3.225 1.902ZM8.25 9h7.5M8.25 12h5.25M8.25 15h3.75" />
    </svg>
);

export default ChatBubbleLeftRightIcon;
