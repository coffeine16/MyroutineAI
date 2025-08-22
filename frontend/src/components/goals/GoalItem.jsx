import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

const GoalItem = ({ goal, onUpdate, onDelete }) => {
  const { title, current, target } = goal;
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

  const handleIncrement = () => {
    onUpdate(goal.id, Math.min(goal.current + 1, goal.target));
  };

  const handleDecrement = () => {
    onUpdate(goal.id, Math.max(goal.current - 1, 0));
  };

  return (
    <div className="bg-zinc-700 p-4 rounded-lg mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-white">{title}</span>
        <button onClick={() => onDelete(goal.id)} className="text-red-400 hover:text-red-300">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={handleDecrement} className="p-1 bg-zinc-600 rounded-md hover:bg-zinc-500">-</button>
        <div className="w-full bg-zinc-600 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <button onClick={handleIncrement} className="p-1 bg-zinc-600 rounded-md hover:bg-zinc-500">+</button>
      </div>
      <p className="text-right text-sm text-zinc-400 mt-1">
        {current} / {target} ({percentage}%)
      </p>
    </div>
  );
};

export default GoalItem;