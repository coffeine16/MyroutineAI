import React from 'react';

// Enhanced Toggle Switch Component
const ToggleSwitch = ({ checked, onChange }) => (
  <label className="relative inline-block w-10 h-6">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
      checked ? 'bg-emerald-500 shadow-emerald-500/50 shadow-lg' : 'bg-zinc-600'
    }`}>
      <span className={`absolute h-4 w-4 rounded-full bg-white transition-all duration-300 top-1 shadow-lg ${
        checked ? 'translate-x-5 shadow-emerald-200/50' : 'translate-x-1'
      }`} />
    </span>
  </label>
);

export default ToggleSwitch;