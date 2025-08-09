import React from 'react';
import { Search, X } from 'lucide-react';

// Enhanced Search Bar Component
const SearchBar = ({ searchTerm, onSearchChange, onClear }) => (
  <div className="relative">
    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
    <input
      type="text"
      placeholder="Search tasks..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full pl-10 pr-10 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
    />
    {searchTerm && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

export default SearchBar;