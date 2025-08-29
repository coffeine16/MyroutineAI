import React, { useEffect } from "react";

const Modal = ({ isOpen, onClose, children, size = "default" }) => {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: "max-w-sm",
    default: "max-w-md",
    large: "max-w-2xl",
    analytics: "max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
        backdropFilter: "blur(8px)",
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
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="relative z-10 p-6">{children}</div>
      </div>

      {/* Hide scrollbar globally for modal */}
      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari */
        }
      `}</style>
    </div>
  );
};

export default Modal;
