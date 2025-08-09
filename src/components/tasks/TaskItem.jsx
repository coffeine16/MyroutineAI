import React, { useState } from 'react';
import { 
  Clock, 
  GripVertical, 
  CheckSquare, 
  Square, 
  Trash2 
} from 'lucide-react';

// Enhanced Task Item Component
const TaskItem = ({ task, onToggle, onEdit, onDelete, isSelected, onSelect, bulkMode, dragHandleProps }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    const completed = e.target.checked;
    onToggle(task.id, completed);
    
    if (completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1000);
    }
  };

  const handleItemClick = () => {
    if (bulkMode) {
      onSelect(task.id);
    } else {
      onEdit(task);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      study: 'border-blue-500 bg-blue-900/20',
      fitness: 'border-orange-500 bg-orange-900/20',
      personal: 'border-purple-500 bg-purple-900/20',
      work: 'border-green-500 bg-green-900/20',
      default: 'border-zinc-600 bg-zinc-700'
    };
    return colors[category] || colors.default;
  };

  return (
    <div 
      className={`task-item group relative overflow-hidden transition-all duration-300 mb-3 cursor-pointer rounded-xl border-2 ${
        task.completed ? 'opacity-60 scale-[0.98]' : ''
      } ${
        isSelected ? 'border-emerald-500 bg-emerald-900/20 shadow-lg shadow-emerald-500/25' : getCategoryColor(task.category)
      } ${
        isHovered && !bulkMode ? 'shadow-lg transform translate-y-[-2px] shadow-zinc-700/50' : ''
      } ${
        justCompleted ? 'animate-pulse bg-emerald-600/30 border-emerald-400' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleItemClick}
    >
      <div className="flex items-center p-4">
        {!bulkMode && (
          <div {...dragHandleProps} className="flex-shrink-0 mr-3 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-300">
            <GripVertical size={16} />
          </div>
        )}

        {bulkMode && (
          <div className="flex-shrink-0 mr-3" onClick={(e) => e.stopPropagation()}>
            {isSelected ? (
              <CheckSquare size={20} className="text-emerald-500" />
            ) : (
              <Square size={20} className="text-zinc-400 hover:text-zinc-300" />
            )}
          </div>
        )}
        
        <div className="flex-shrink-0 text-2xl mr-4 transition-transform duration-200 hover:scale-110">
          {task.icon}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-semibold transition-colors duration-200 truncate ${
              task.completed ? 'line-through text-zinc-400' : 'text-white'
            }`}>
              {task.task}
            </p>
            {task.priority && (
              <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {task.priority}
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-zinc-400">
            <Clock size={12} className="mr-1" />
            <span>{task.time}</span>
            {task.duration && (
              <span className="ml-3 text-zinc-500">~{task.duration}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          {!bulkMode && (
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
            >
              <Trash2 size={16} />
            </button>
          )}
          
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleCheckboxChange}
            className="h-6 w-6 rounded-lg bg-zinc-900 border-zinc-600 text-emerald-500 focus:ring-emerald-500 cursor-pointer transition-transform hover:scale-110"
          />
        </div>
      </div>
      
      {justCompleted && (
        <div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-xl pointer-events-none" />
      )}
    </div>
  );
};

export default TaskItem;