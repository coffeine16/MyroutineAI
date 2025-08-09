import React, { useEffect } from 'react';
import { Undo2, X } from 'lucide-react';

// Enhanced Undo Toast Component
const UndoToast = ({ show, onUndo, onDismiss, message }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 bg-zinc-800 text-white px-4 py-3 rounded-lg shadow-xl border border-zinc-700 flex items-center space-x-3 z-50">
      <span className="text-sm">{message}</span>
      <button
        onClick={onUndo}
        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center space-x-1 transition-colors"
      >
        <Undo2 size={16} />
        <span>Undo</span>
      </button>
      <button
        onClick={onDismiss}
        className="text-zinc-400 hover:text-white ml-2 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default UndoToast;