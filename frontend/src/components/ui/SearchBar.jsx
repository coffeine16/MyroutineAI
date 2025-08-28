import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Clock } from 'lucide-react';

const SearchBar = ({ 
  searchTerm = '', 
  onSearchChange, 
  onClear, 
  placeholder = "Search tasks, times, or categories...",
  showRecentSearches = false,
  recentSearches = [],
  showFilters = false,
  onFilterClick
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    if (showRecentSearches && recentSearches.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow clicking on items
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleRecentSearch = (term) => {
    onSearchChange(term);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className={`
        relative group
        ${isFocused ? 'ring-2 ring-emerald-500/50' : 'ring-1 ring-zinc-600/50'}
        ${isFocused ? 'shadow-lg shadow-emerald-500/20' : 'shadow-sm'}
        transition-all duration-300 rounded-xl overflow-hidden
        bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 backdrop-blur-sm
        border border-zinc-600/30
      `}>
        {/* Search icon */}
        <Search 
          size={20} 
          className={`
            absolute left-4 top-1/2 transform -translate-y-1/2 
            transition-all duration-300 z-10
            ${isFocused ? 'text-emerald-400' : 'text-zinc-400'}
            ${searchTerm ? 'scale-90' : 'scale-100'}
          `} 
        />

        {/* Input field */}
        <input 
          ref={inputRef}
          type="text" 
          placeholder={placeholder}
          value={searchTerm} 
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            w-full pl-12 pr-20 py-4 
            bg-transparent text-white placeholder-zinc-400
            focus:outline-none transition-all duration-300
            font-medium text-sm
            ${isFocused ? 'placeholder-zinc-500' : 'placeholder-zinc-400'}
          `}
        />

        {/* Right side controls */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* Filter button */}
          {showFilters && (
            <button
              onClick={onFilterClick}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-all duration-200 group"
            >
              <Filter size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Clear button */}
          {searchTerm && (
            <button 
              onClick={handleClear}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-all duration-200 group"
            >
              <X size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Focus glow effect */}
        <div className={`
          absolute inset-0 rounded-xl
          bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-emerald-500/10
          opacity-0 transition-opacity duration-300 pointer-events-none
          ${isFocused ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* Keyboard shortcut hint */}
        {!isFocused && !searchTerm && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 text-xs font-mono opacity-60">
            Ctrl+/
          </div>
        )}
      </div>

      {/* Recent searches dropdown */}
      {showDropdown && showRecentSearches && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-xl rounded-xl border border-zinc-600/30 shadow-xl overflow-hidden">
            <div className="p-3 border-b border-zinc-700/50">
              <div className="flex items-center text-zinc-400 text-xs font-medium">
                <Clock size={12} className="mr-2" />
                Recent Searches
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(term)}
                  className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-all duration-150 flex items-center group"
                >
                  <Search size={14} className="mr-3 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search suggestions/tips */}
      {isFocused && !searchTerm && !showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40">
          <div className="bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-xl rounded-xl border border-zinc-600/30 shadow-xl p-4">
            <div className="text-zinc-400 text-xs font-medium mb-3">Search Tips</div>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex items-center">
                <span className="font-mono bg-zinc-700/50 px-2 py-1 rounded text-zinc-400 mr-2">study</span>
                <span>Find tasks by category</span>
              </div>
              <div className="flex items-center">
                <span className="font-mono bg-zinc-700/50 px-2 py-1 rounded text-zinc-400 mr-2">@today</span>
                <span>Search by time period</span>
              </div>
              <div className="flex items-center">
                <span className="font-mono bg-zinc-700/50 px-2 py-1 rounded text-zinc-400 mr-2">"exact phrase"</span>
                <span>Find exact matches</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state (optional) */}
      {searchTerm && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-30" />
      )}
    </div>
  );
};

export default SearchBar;