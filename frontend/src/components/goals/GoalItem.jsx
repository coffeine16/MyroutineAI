import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, CheckCircle, Star, TrendingUp, Target, Zap, Trophy } from 'lucide-react';

const ProgressBar = ({ percentage, size = 'default', animated = true, isCompleted = false }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setAnimatedPercentage(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animated]);

  const sizeClasses = {
    small: 'h-2',
    default: 'h-3',
    large: 'h-4'
  };

  return (
    <div className={`w-full bg-gradient-to-r from-zinc-700/80 to-zinc-600/80 rounded-full ${sizeClasses[size]} overflow-hidden border border-zinc-600/30 backdrop-blur-sm relative`}>
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700 opacity-50" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div 
        className={`
          relative bg-gradient-to-r from-emerald-500 to-emerald-400 ${sizeClasses[size]} rounded-full
          transition-all duration-1000 ease-out
          before:absolute before:inset-0 before:bg-gradient-to-r 
          before:from-white/20 before:via-white/10 before:to-transparent
          before:rounded-full before:opacity-80
          ${isCompleted ? 'shadow-lg shadow-emerald-500/30 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : ''}
          overflow-hidden
        `}
        style={{ width: `${animatedPercentage}%` }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>

      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
        </div>
      )}

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

const GoalItem = ({ goal, onUpdate, onDelete }) => {
  const { title, current, target } = goal;
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
  const isCompleted = percentage >= 100;
  const isNearCompletion = percentage >= 80 && percentage < 100;
  const [isDeleting, setIsDeleting] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const handleIncrement = () => {
    const newValue = Math.min(goal.current + 1, goal.target);
    onUpdate(goal.id, newValue);
    
    // Show update animation
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 500);
  };

  const handleDecrement = () => {
    const newValue = Math.max(goal.current - 1, 0);
    onUpdate(goal.id, newValue);
    
    // Show update animation
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 500);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(goal.id), 300);
  };

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    if (isCompleted) return "Amazing! Goal achieved! 🎉";
    if (isNearCompletion) return "Almost there! Keep going! 🔥";
    if (percentage >= 50) return "Great progress! 💪";
    if (percentage >= 25) return "Good start! 📈";
    return "Let's get started! 🚀";
  };

  const getProgressColor = () => {
    if (isCompleted) return 'text-emerald-400';
    if (isNearCompletion) return 'text-yellow-400';
    if (percentage >= 50) return 'text-blue-400';
    return 'text-zinc-400';
  };

  return (
    <div className={`
      bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 rounded-2xl p-6 
      border border-zinc-600/30 backdrop-blur-lg relative overflow-hidden
      group hover:shadow-lg hover:shadow-black/20 transition-all duration-300
      ${isDeleting ? 'animate-pulse opacity-50 scale-95' : ''}
      ${isCompleted ? 'ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10' : ''}
      ${justUpdated ? 'scale-[1.02] ring-2 ring-blue-500/30' : ''}
      ${isNearCompletion && !isCompleted ? 'ring-1 ring-yellow-500/20 shadow-md shadow-yellow-500/5' : ''}
    `}>
      {/* Completion celebration overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10 pointer-events-none animate-pulse" />
      )}

      {/* Near completion glow */}
      {isNearCompletion && !isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4">
          <div className="flex items-center mb-2">
            {isCompleted && (
              <div className="flex items-center mr-2 animate-bounce">
                <CheckCircle size={18} className="text-emerald-400 mr-1" />
                <Star size={14} className="text-yellow-400" />
              </div>
            )}
            {isNearCompletion && !isCompleted && (
              <Zap size={16} className="text-yellow-400 mr-2 animate-pulse" />
            )}
            <h4 className={`font-semibold text-lg break-words leading-tight ${
              isCompleted ? 'text-emerald-100' : 'text-white'
            }`}>
              {title}
            </h4>
          </div>
          
          {/* Motivational message */}
          <div className={`text-xs font-medium ${getProgressColor()}`}>
            {getMotivationalMessage()}
          </div>
        </div>
        
        <button 
          onClick={handleDelete}
          className="text-zinc-500 hover:text-red-400 transition-all duration-200 p-2 rounded-xl hover:bg-red-500/10 group-hover:opacity-100 opacity-60 flex-shrink-0"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        {/* Progress Bar and Controls */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleDecrement}
            disabled={current <= 0 || isDeleting}
            className="p-3 bg-gradient-to-br from-zinc-700/80 to-zinc-600/80 rounded-xl hover:from-zinc-600/80 hover:to-zinc-500/80 transition-all duration-200 border border-zinc-600/30 backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed group flex-shrink-0"
          >
            <Minus size={16} className="text-zinc-300 group-hover:text-white group-disabled:text-zinc-500 transition-colors" />
          </button>
          
          <div className="flex-1 space-y-2">
            <ProgressBar 
              percentage={percentage} 
              animated={true} 
              isCompleted={isCompleted}
              size="default"
            />
            
            {/* Milestone indicators */}
            <div className="flex justify-between text-xs">
              <div className="flex space-x-4">
                {[25, 50, 75].map((milestone) => (
                  <div key={milestone} className={`flex items-center space-x-1 ${
                    percentage >= milestone ? 'text-emerald-400' : 'text-zinc-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      percentage >= milestone ? 'bg-emerald-400' : 'bg-zinc-600'
                    }`} />
                    <span className="font-mono">{milestone}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleIncrement}
            disabled={current >= target || isDeleting}
            className="p-3 bg-gradient-to-br from-emerald-600/80 to-emerald-500/80 rounded-xl hover:from-emerald-500/80 hover:to-emerald-400/80 transition-all duration-200 border border-emerald-500/30 backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm flex-shrink-0"
          >
            <Plus size={16} className="text-white group-hover:scale-110 group-disabled:text-zinc-400 group-disabled:scale-100 transition-all" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target size={14} className="text-zinc-500" />
              <span className="text-zinc-300 font-mono text-sm">
                {current} / {target}
              </span>
            </div>
            
            <div className={`font-bold text-lg ${
              isCompleted ? 'text-emerald-400' : 
              isNearCompletion ? 'text-yellow-400' : 'text-white'
            }`}>
              {percentage}%
            </div>
          </div>
          
          <div className="text-right">
            {percentage > 0 && percentage < 100 && (
              <div className="flex items-center text-zinc-400 text-sm">
                <TrendingUp size={12} className="mr-1" />
                <span className="font-mono">{target - current} to go</span>
              </div>
            )}
            
            {isCompleted && (
              <div className="flex items-center text-emerald-400 text-sm font-medium">
                <CheckCircle size={12} className="mr-1" />
                Completed!
              </div>
            )}
          </div>
        </div>

        {/* Achievement Badge */}
        {isCompleted && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-emerald-300">
              <Trophy className="animate-bounce" size={16} />
              <span className="font-semibold text-sm">Goal Achievement Unlocked!</span>
              <Star className="animate-spin" size={16} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalItem;