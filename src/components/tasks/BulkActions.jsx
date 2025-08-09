import React from 'react';

// Enhanced Bulk Actions Component
const BulkActions = ({ selectedCount, onMarkComplete, onMarkIncomplete, onDelete, onClearSelection }) => (
  <div className="bg-emerald-600/20 border border-emerald-500/50 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <span className="text-sm text-emerald-300 font-medium">
        {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex space-x-2">
        <button
          onClick={onMarkComplete}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-md transition-colors font-medium"
        >
          Complete
        </button>
        <button
          onClick={onMarkIncomplete}
          className="px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 text-white text-sm rounded-md transition-colors font-medium"
        >
          Incomplete
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md transition-colors font-medium"
        >
          Delete
        </button>
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 text-white text-sm rounded-md transition-colors font-medium"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
);

export default BulkActions;