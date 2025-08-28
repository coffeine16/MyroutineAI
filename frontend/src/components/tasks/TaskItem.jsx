import React, { useState, useEffect } from 'react';
import { Clock, GripVertical, CheckSquare, Square, Trash2, Star, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskItem = ({ task, onToggle, onEdit, onDelete, isSelected, onSelect, bulkMode, dragHandleProps }) => {
  const [justCompleted, setJustCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [completionAnimation, setCompletionAnimation] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (task.completed && !justCompleted) {
      setCompletionAnimation(true);
      setTimeout(() => setCompletionAnimation(false), 2000);
    }
  }, [task.completed]);

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    const completed = e.target.checked;
    onToggle(task.id, completed);
    
    if (completed) {
      setJustCompleted(true);
      setCompletionAnimation(true);
      setTimeout(() => {
        setJustCompleted(false);
        setCompletionAnimation(false);
      }, 2000);
    }
  };

  const handleItemClick = () => {
    if (bulkMode) {
      onSelect(task.id);
    } else {
      onEdit(task);
    }
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      study: {
        bg: 'from-blue-500/15 via-blue-600/10 to-blue-500/15',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/10',
        icon: 'text-blue-400'
      },
      fitness: {
        bg: 'from-orange-500/15 via-orange-600/10 to-orange-500/15',
        border: 'border-orange-500/30',
        glow: 'shadow-orange-500/10',
        icon: 'text-orange-400'
      },
      personal: {
        bg: 'from-purple-500/15 via-purple-600/10 to-purple-500/15',
        border: 'border-purple-500/30',
        glow: 'shadow-purple-500/10',
        icon: 'text-purple-400'
      },
      work: {
        bg: 'from-emerald-500/15 via-emerald-600/10 to-emerald-500/15',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/10',
        icon: 'text-emerald-400'
      },
      default: {
        bg: 'from-zinc-800/70 to-zinc-900/70',
        border: 'border-zinc-600/30',
        glow: 'shadow-black/10',
        icon: 'text-zinc-400'
      }
    };
    return gradients[category] || gradients.default;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: {
        bg: 'bg-gradient-to-r from-red-500/20 to-red-600/20',
        text: 'text-red-300',
        border: 'border-red-500/40',
        icon: AlertCircle,
        glow: 'shadow-red-500/20'
      },
      medium: {
        bg: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20',
        text: 'text-yellow-300',
        border: 'border-yellow-500/40',
        icon: Zap,
        glow: 'shadow-yellow-500/20'
      },
      low: {
        bg: 'bg-gradient-to-r from-green-500/20 to-green-600/20',
        text: 'text-green-300',
        border: 'border-green-500/40',
        icon: Star,
        glow: 'shadow-green-500/20'
      }
    };
    return configs[priority];
  };

  const categoryStyle = getCategoryGradient(task.category);
  const priorityConfig = task.priority ? getPriorityConfig(task.priority) : null;
  const isOverdue = task.time && new Date() > new Date(`${new Date().toDateString()} ${task.time}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleItemClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-full group relative overflow-hidden transition-all duration-300 cursor-pointer 
        rounded-2xl border backdrop-blur-lg
        ${task.completed 
          ? 'opacity-70 scale-[0.98] bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-600/20' 
          : `bg-gradient-to-br ${categoryStyle.bg} ${categoryStyle.border} hover:shadow-lg ${categoryStyle.glow}`
        }
        ${isSelected 
          ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20 scale-[1.02]' 
          : ''
        }
        ${justCompleted 
          ? 'ring-2 ring-emerald-400/60 shadow-xl shadow-emerald-500/30' 
          : ''
        }
        ${isHovered && !task.completed 
          ? 'scale-[1.01] shadow-lg' 
          : ''
        }
        ${isOverdue && !task.completed 
          ? 'ring-1 ring-red-500/30 shadow-red-500/10' 
          : ''
        }
      `}
    >
      {/* Completion celebration overlay */}
      {completionAnimation && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 animate-pulse pointer-events-none rounded-2xl" />
      )}

      {/* Subtle glow for hover states */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none
        ${isHovered && !task.completed ? 'opacity-100' : ''}
        bg-gradient-to-br from-white/5 via-transparent to-white/5
      `} />

      <div className="flex items-center p-5 w-full relative z-10">
        {/* Drag Handle */}
        {!bulkMode && (
          <div 
            {...listeners} 
            className="flex-shrink-0 mr-4 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 transition-all duration-200 p-1 rounded-lg hover:bg-white/10"
          >
            <GripVertical size={16} />
          </div>
        )}
      
        {/* Bulk Selection Checkbox */}
        {bulkMode && (
          <div 
            className="flex-shrink-0 mr-4" 
            onClick={(e) => {
              e.stopPropagation();
              onSelect(task.id);
            }}
          >
            <div className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              {isSelected ? (
                <CheckSquare size={20} className="text-emerald-400" />
              ) : (
                <Square size={20} className="text-zinc-400 hover:text-zinc-300 transition-colors" />
              )}
            </div>
          </div>
        )}

        {/* Task Icon */}
        <div className={`
          flex-shrink-0 text-3xl mr-5 transition-all duration-300 
          ${task.completed ? 'grayscale opacity-60' : 'group-hover:scale-110 group-hover:rotate-3'}
          ${isHovered ? 'drop-shadow-lg' : ''}
        `}>
          {task.icon}
        </div>

        {/* Task Content */}
        <div className="flex-grow min-w-0 space-y-2">
          {/* Title and Priority Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <h3 className={`
                font-semibold text-lg transition-all duration-200 truncate
                ${task.completed 
                  ? 'line-through text-zinc-500' 
                  : 'text-white group-hover:text-white'
                }
              `}>
                {task.task}
              </h3>
              
              {/* Completion checkmark */}
              {task.completed && (
                <CheckCircle size={18} className="text-emerald-400 animate-pulse flex-shrink-0" />
              )}
            </div>

            {/* Priority Badge */}
            {task.priority && priorityConfig && (
              <div className={`
                ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}
                px-3 py-1.5 rounded-xl text-xs font-semibold
                border backdrop-blur-sm flex items-center space-x-1
                shadow-sm ${priorityConfig.glow}
                ml-3 flex-shrink-0
              `}>
                <priorityConfig.icon size={12} />
                <span className="capitalize">{task.priority}</span>
              </div>
            )}
          </div>

          {/* Time and Duration Row */}
          <div className="flex items-center text-sm">
            <div className="flex items-center space-x-2">
              <div className={`
                flex items-center space-x-1 px-2 py-1 rounded-lg
                ${isOverdue && !task.completed 
                  ? 'bg-red-500/20 text-red-300' 
                  : 'bg-zinc-800/50 text-zinc-400'
                }
              `}>
                <Clock size={12} />
                <span className="font-mono">{task.time}</span>
                {isOverdue && !task.completed && (
                  <AlertCircle size={12} className="text-red-400" />
                )}
              </div>

              {task.duration && (
                <div className="bg-zinc-700/50 text-zinc-400 px-2 py-1 rounded-lg text-xs font-medium">
                  ~{task.duration}
                </div>
              )}

              {/* Category Badge */}
              <div className={`
                px-2 py-1 rounded-lg text-xs font-medium capitalize
                bg-zinc-700/30 ${categoryStyle.icon} border border-zinc-600/30
              `}>
                {task.category}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Delete Button */}
          {!bulkMode && (
            <button 
              onClick={() => onDelete(task.id)}
              className="
                opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 
                transition-all duration-200 p-2.5 rounded-xl hover:bg-red-500/10
                hover:shadow-lg hover:shadow-red-500/20 hover:scale-110
              "
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Enhanced Checkbox */}
          <div className="relative">
            <input 
              type="checkbox" 
              checked={task.completed} 
              onChange={handleCheckboxChange}
              className="
                appearance-none h-7 w-7 rounded-xl 
                bg-gradient-to-br from-zinc-800/80 to-zinc-700/80
                border-2 border-zinc-600/50 
                checked:bg-gradient-to-br checked:from-emerald-500 checked:to-emerald-400
                checked:border-emerald-400
                cursor-pointer transition-all duration-300
                hover:scale-110 hover:shadow-lg
                focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-transparent
                shadow-inner
              " 
            />
            
            {/* Custom checkmark */}
            {task.completed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <CheckCircle size={14} className="text-white drop-shadow-sm" />
              </div>
            )}

            {/* Completion celebration */}
            {justCompleted && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion celebration ring */}
      {justCompleted && (
        <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-2xl animate-ping pointer-events-none" />
      )}

      {/* Bottom progress indicator for overdue tasks */}
      {isOverdue && !task.completed && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/50 via-red-400/70 to-red-500/50 rounded-b-2xl animate-pulse" />
      )}
    </div>
  );
};

export default TaskItem;