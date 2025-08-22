import React, { useState } from 'react';
import { X, Target, Plus, Minus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { db } from '../../lib/firebase.js';
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";

const GoalItem = ({ goal, onUpdate, onDelete }) => {
  const { title, current, target } = goal;
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
  return (
    <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-700/60 p-4 rounded-xl border border-zinc-600/50 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-white break-all">{title}</span>
        <button onClick={() => onDelete(goal.id)} className="text-zinc-400 hover:text-red-400 transition-colors ml-4 flex-shrink-0 p-1 rounded-lg hover:bg-red-500/10"><Trash2 size={16} /></button>
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={() => onUpdate(goal.id, Math.max(goal.current - 1, 0))} className="p-2 bg-zinc-700/50 rounded-lg hover:bg-zinc-600/50 transition-colors border border-zinc-600/30"><Minus size={14} /></button>
        <div className="w-full bg-zinc-900/60 rounded-full h-3 overflow-hidden border border-zinc-700/50">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500 relative" style={{ width: `${percentage}%` }}>
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <button onClick={() => onUpdate(goal.id, Math.min(goal.current + 1, goal.target))} className="p-2 bg-zinc-700/50 rounded-lg hover:bg-zinc-600/50 transition-colors border border-zinc-600/30"><Plus size={14} /></button>
      </div>
      <p className="text-right text-sm text-zinc-400 mt-2 font-mono">{current} / {target} ({percentage}%)</p>
    </div>
  );
};

const GoalTracker = ({ isOpen, onClose, goals, setGoals, user }) => {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(100);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || newGoalTarget <= 0 || !user) return;
    const newGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle,
      current: 0,
      target: parseInt(newGoalTarget, 10),
    };
    try {
      await setDoc(doc(db, 'users', user.uid, 'goals', newGoal.id), newGoal);
      setGoals(prev => [...prev, newGoal]);
      setNewGoalTitle('');
      setNewGoalTarget(100);
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleUpdateGoal = async (id, newCurrent) => {
    const updatedGoal = goals.find(g => g.id === id);
    if (!updatedGoal || !user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'goals', id), { ...updatedGoal, current: newCurrent }, { merge: true });
      setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, current: newCurrent } : goal));
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center"><Target className="mr-2 text-emerald-400" />Long-Term Goals</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-700/50"><X size={20} /></button>
      </div>
      <form onSubmit={handleAddGoal} className="mb-6">
        <div className="space-y-4 rounded-xl bg-gradient-to-br from-zinc-900/60 to-zinc-800/60 p-4 border border-zinc-700/50 backdrop-blur-sm">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Goal Title</label>
            <input type="text" placeholder="e.g., Read 50 Books" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/50 transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Target Number</label>
            <input type="number" min="1" placeholder="50" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/50 transition-all" required />
          </div>
          <button type="submit" className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-semibold transition-all text-white shadow-lg shadow-emerald-900/50 transform hover:scale-[1.02]">Add New Goal</button>
        </div>
      </form>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
        {goals.length > 0 ? (
          goals.map(goal => (<GoalItem key={goal.id} goal={goal} onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} />))
        ) : (
          <div className="text-center text-zinc-500 py-8">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-lg">No goals yet</p>
            <p className="text-sm">Add one above to get started!</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
export default GoalTracker;