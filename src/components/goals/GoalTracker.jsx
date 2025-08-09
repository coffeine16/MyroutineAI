import React, { useState } from 'react';
import { X, Target, Plus, Minus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';

// We can move GoalItem into this file as it's only used here,
// or keep it separate. For simplicity, let's combine them.

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
    <div className="bg-zinc-700/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-white break-all">{title}</span>
        <button onClick={() => onDelete(goal.id)} className="text-zinc-400 hover:text-red-500 transition-colors ml-4 flex-shrink-0">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={handleDecrement} className="p-1.5 bg-zinc-600 rounded-md hover:bg-zinc-500 transition-colors">-</button>
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <button onClick={handleIncrement} className="p-1.5 bg-zinc-600 rounded-md hover:bg-zinc-500 transition-colors">+</button>
      </div>
      <p className="text-right text-sm text-zinc-400 mt-1 font-mono">
        {current} / {target} ({percentage}%)
      </p>
    </div>
  );
};


const GoalTracker = ({ isOpen, onClose, goals, setGoals }) => {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(100);

  const handleAddGoal = (e) => {
    e.preventDefault(); // Prevent form submission
    if (!newGoalTitle.trim() || newGoalTarget <= 0) return;

    const newGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle,
      current: 0,
      target: parseInt(newGoalTarget, 10),
    };
    setGoals(prev => [...prev, newGoal]);
    setNewGoalTitle('');
    setNewGoalTarget(100);
  };

  const handleUpdateGoal = (id, newCurrent) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id ? { ...goal, current: newCurrent } : goal
      )
    );
  };

  const handleDeleteGoal = (id) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Target className="mr-2 text-emerald-400" />
          Long-Term Goals
        </h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Add New Goal Form */}
      <form onSubmit={handleAddGoal} className="mb-4">
        <div className="space-y-3 rounded-lg bg-zinc-900/40 p-4 border border-zinc-700">
          <div>
            <label htmlFor="goalTitle" className="block text-sm font-medium text-zinc-300 mb-1">
              Goal Title
            </label>
            <input
              id="goalTitle"
              type="text"
              placeholder="e.g., Read 50 Books"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label htmlFor="goalTarget" className="block text-sm font-medium text-zinc-300 mb-1">
              Target Number
            </label>
            <input
              id="goalTarget"
              type="number"
              min="1"
              placeholder="50"
              value={newGoalTarget}
              onChange={(e) => setNewGoalTarget(e.target.value)}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold transition-colors text-white shadow-lg shadow-emerald-900/50"
          >
            Add New Goal
          </button>
        </div>
      </form>

      <hr className="border-zinc-700 my-4" />

      {/* Goals List */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {goals.length > 0 ? (
          goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
            />
          ))
        ) : (
          <div className="text-center text-zinc-500 py-8">
            <p>No goals yet.</p>
            <p>Add one above to get started!</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GoalTracker;