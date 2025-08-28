import React from 'react';

const BulkActions = ({ selectedCount, onMarkComplete, onMarkIncomplete, onDelete, onClearSelection }) => (
  <div className="bg-gradient-to-r from-zinc-900/90 to-zinc-800/90 border border-zinc-700/50 backdrop-blur-sm rounded-xl p-5 mb-6 shadow-2xl">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-zinc-300 font-medium">
          {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={onMarkComplete} 
          className="group px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-500/25 hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.485 1.431a1.473 1.473 0 0 1 2.104 2.062l-7.84 9.801a1.473 1.473 0 0 1-2.12.04L.431 8.138a1.473 1.473 0 0 1 2.084-2.083l4.111 4.112 6.859-8.736z"/>
              </svg>
            </div>
            Complete
          </span>
        </button>
        
        <button 
          onClick={onMarkIncomplete} 
          className="group px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-amber-500/25 hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        </button>
        
        <button 
          onClick={onDelete} 
          className="group px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-red-500/25 hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </span>
        </button>
        
        <button 
          onClick={onClearSelection} 
          className="group px-4 py-2 bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-zinc-300 hover:text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-zinc-500/25 hover:scale-105 active:scale-95 border border-zinc-600/50"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </span>
        </button>
      </div>
    </div>
  </div>
);

export default BulkActions;