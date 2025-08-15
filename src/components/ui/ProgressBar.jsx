import React from 'react';

const ProgressBar = ({ percentage, showAnimation = false }) => (
  <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
    <div className={`bg-emerald-500 h-3 rounded-full transition-all duration-1000 ${showAnimation ? 'animate-pulse shadow-lg shadow-emerald-500/50' : ''}`} style={{ width: `${percentage}%` }} />
  </div>
);
export default ProgressBar;