import React, { useState } from 'react';
import { Clock, GripVertical, CheckSquare, Square, Trash2 } from 'lucide-react';

const TaskItem = ({ task, onToggle, onEdit, onDelete, isSelected, onSelect, bulkMode, dragHandleProps }) => {
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

  const getCategoryGradient = (category) => {
    const gradients = {
      study: 'from-blue-500/20 to-blue-600/20 border-blue-500/50',
      fitness: 'from-orange-500/20 to-orange-600/20 border-orange-500/50',
      personal: 'from-purple-500/20 to-purple-600/20 border-purple-500/50',
      work: 'from-green-500/20 to-green-600/20 border-green-500/50',
      default: 'from-zinc-800/60 to-zinc-700/60 border-zinc-600/50'
    };
    return gradients[category] || gradients.default;
  };

  return (
    <div className={`w-full group relative overflow-hidden transition-all duration-300 cursor-pointer rounded-2xl border backdrop-blur-sm ${task.completed ? 'opacity-60 scale-[0.98]' : ''} ${isSelected ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50 shadow-lg shadow-emerald-500/25' : `bg-gradient-to-br ${getCategoryGradient(task.category)}`} ${justCompleted ? 'animate-pulse from-emerald-600/40 to-emerald-500/40 border-emerald-400/50' : ''}`}>
      <div className="flex items-center p-4 w-full">
        {!bulkMode && (<div {...dragHandleProps} className="flex-shrink-0 mr-3 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-300 transition-colors"><GripVertical size={16} /></div>)}
        {bulkMode && (<div className="flex-shrink-0 mr-3" onClick={(e) => e.stopPropagation()}>{isSelected ? (<CheckSquare size={20} className="text-emerald-400" />) : (<Square size={20} className="text-zinc-400 hover:text-zinc-300 transition-colors" />)}</div>)}
        <div className="flex-shrink-0 text-2xl mr-4 transition-transform duration-200 group-hover:scale-110">{task.icon}</div>
        
        {/* THIS DIV IS THE FIX */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-semibold transition-all duration-200 truncate ${task.completed ? 'line-through text-zinc-400' : 'text-white'}`}>{task.task}</p>
            {task.priority && (<span className={`text-xs px-2 py-1 rounded-full ml-2 font-medium ${task.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>{task.priority}</span>)}
          </div>
          <div className="flex items-center text-sm text-zinc-400">
            <Clock size={12} className="mr-1" />
            <span>{task.time}</span>
            {task.duration && (<span className="ml-3 text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full text-xs">~{task.duration}</span>)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-auto" onClick={(e) => e.stopPropagation()}>
          {!bulkMode && (<button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={16} /></button>)}
          <div className="relative">
            <input type="checkbox" checked={task.completed} onChange={handleCheckboxChange} className="appearance-none h-6 w-6 rounded-lg bg-zinc-900/50 border-2 border-zinc-600 checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-all group-hover:scale-110 focus:ring-2 focus:ring-emerald-500/50" />
            {task.completed && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-2 h-2 bg-white rounded-full animate-bounce"></div></div>)}
          </div>
        </div>
      </div>
      {justCompleted && (<div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-2xl pointer-events-none" />)}
    </div>
  );
};
export default TaskItem;