import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm sm:max-w-md mx-auto border border-zinc-700/50 backdrop-blur-xl transform animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
export default Modal;