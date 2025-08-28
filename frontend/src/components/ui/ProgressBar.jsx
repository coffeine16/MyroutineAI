import React, { useEffect, useState } from 'react';

const ProgressBar = ({ 
  percentage = 0, 
  showAnimation = false, 
  color = 'emerald',
  size = 'default',
  showLabel = false,
  animated = true,
  glowing = false
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Animate the progress bar fill
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animated]);

  // Color variants
  const colorVariants = {
    emerald: {
      bg: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      shadow: 'shadow-emerald-500/30',
      glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      light: 'bg-emerald-500/20'
    },
    blue: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-400',
      shadow: 'shadow-blue-500/30',
      glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]',
      light: 'bg-blue-500/20'
    },
    orange: {
      bg: 'bg-gradient-to-r from-orange-500 to-orange-400',
      shadow: 'shadow-orange-500/30',
      glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]',
      light: 'bg-orange-500/20'
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-500 to-purple-400',
      shadow: 'shadow-purple-500/30',
      glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]',
      light: 'bg-purple-500/20'
    },
    yellow: {
      bg: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
      shadow: 'shadow-yellow-500/30',
      glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]',
      light: 'bg-yellow-500/20'
    },
    red: {
      bg: 'bg-gradient-to-r from-red-500 to-red-400',
      shadow: 'shadow-red-500/30',
      glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]',
      light: 'bg-red-500/20'
    }
  };

  // Size variants
  const sizeVariants = {
    small: 'h-1.5',
    default: 'h-2.5',
    large: 'h-4',
    xl: 'h-6'
  };

  const currentColor = colorVariants[color] || colorVariants.emerald;

  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-300 font-medium">Progress</span>
          <span className="text-white font-semibold">{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={`
        relative w-full bg-gradient-to-r from-zinc-700/80 to-zinc-600/80 
        rounded-full ${sizeVariants[size]} overflow-hidden
        border border-zinc-600/30 backdrop-blur-sm
        shadow-inner
      `}>
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700 opacity-50" />
        
        {/* Subtle inner highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Progress fill */}
        <div 
          className={`
            relative ${currentColor.bg} ${sizeVariants[size]} rounded-full
            transition-all duration-1000 ease-out
            ${showAnimation ? `animate-pulse ${currentColor.shadow} shadow-lg` : ''}
            ${glowing ? `filter ${currentColor.glow}` : ''}
            before:absolute before:inset-0 before:bg-gradient-to-r 
            before:from-white/20 before:via-white/10 before:to-transparent
            before:rounded-full before:opacity-80
            overflow-hidden
          `}
          style={{ 
            width: `${animatedPercentage}%`,
            boxShadow: glowing ? `0 0 12px ${currentColor.shadow.replace('shadow-', '').replace('/30', '/40')}` : undefined
          }}
        >
          {/* Animated shimmer effect */}
          {showAnimation && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
          
          {/* Inner glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        {/* Completion sparkle effect */}
        {percentage >= 100 && showAnimation && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
          </div>
        )}
      </div>

      {/* Milestone indicators */}
      {size !== 'small' && (
        <div className="relative">
          <div className="absolute inset-0 flex justify-between items-center px-1">
            {[25, 50, 75].map((milestone) => (
              <div 
                key={milestone}
                className={`w-0.5 h-1 rounded-full transition-all duration-300 ${
                  percentage >= milestone 
                    ? `${currentColor.bg.replace('bg-gradient-to-r', 'bg-gradient-to-b')} opacity-60` 
                    : 'bg-zinc-600 opacity-30'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;