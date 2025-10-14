
import React from 'react';

const ScissorsIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm0 0-1.112 4.26a3.375 3.375 0 0 0 6.056 2.073l1.112-4.26m-4.944 0a3.375 3.375 0 0 1 6.056 2.073l1.112 4.26m-7.168-6.333a3 3 0 1 0-5.196-3 3 3 0 0 0 5.196 3Zm0 0 .023.087m-4.435 4.142 4.412-2.398" />
  </svg>
);

export default ScissorsIcon;
