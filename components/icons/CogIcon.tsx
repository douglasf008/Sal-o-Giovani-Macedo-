
import React from 'react';

const CogIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.95.542.056 1.007.56 1.11 1.096.09.542-.23 1.144-.738 1.432a1.003 1.003 0 0 1-1.432-.738Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.066 3.94c.09-.542.56-1.007 1.11-.95.542.056 1.007.56 1.11 1.096.09.542-.23 1.144-.738 1.432a1.003 1.003 0 0 1-1.432-.738Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.5a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25v-9a2.25 2.25 0 0 1 2.25-2.25h15Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 11.19c.09-.542.56-1.007 1.11-.95.542.056 1.007.56 1.11 1.096.09.542-.23 1.144-.738 1.432a1.003 1.003 0 0 1-1.432-.738Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.066 11.19c.09-.542.56-1.007 1.11-.95.542.056 1.007.56 1.11 1.096.09.542-.23 1.144-.738 1.432a1.003 1.003 0 0 1-1.432-.738Z" />
  </svg>
);

export default CogIcon;
