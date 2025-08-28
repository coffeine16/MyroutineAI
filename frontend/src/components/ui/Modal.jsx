import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, children, size = 'default' }) => {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-sm',
    default: 'max-w-md',
    large: 'max-w-2xl',
    analytics: 'max-w-4xl max-h-[90vh] overflow-y-auto'
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        background: 'radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)',
        backdropFilter: 'blur(8px)',
        animation: isOpen ? 'fadeIn 0.3s ease-out forwards' : 'fadeOut 0.2s ease-in forwards'
      }}
      onClick={onClose}
    >
      <div 
        className={`
          bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 
          rounded-2xl shadow-2xl p-0 w-full ${sizeClasses[size]} mx-auto 
          border border-zinc-700/40 backdrop-blur-xl 
          relative overflow-hidden
          transform transition-all duration-300 ease-out
          hover:shadow-3xl
        `}
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          animation: isOpen ? 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'modalSlideOut 0.2s ease-in forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-2xl opacity-30">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 animate-pulse" />
        </div>

        {/* Content container */}
        <div className="relative z-10 p-6">
          {children}
        </div>
      </div>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes modalSlideIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0px);
          }
        }
        
        @keyframes modalSlideOut {
          from { 
            opacity: 1;
            transform: scale(1) translateY(0px);
          }
          to { 
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
        }

        .hover\\:shadow-3xl:hover {
          box-shadow: 
            0 35px 60px -12px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
};

export default Modal;