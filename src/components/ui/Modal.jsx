import React from 'react';

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto border border-zinc-700">
        {children}
      </div>
    </div>
  );
};

export default Modal;