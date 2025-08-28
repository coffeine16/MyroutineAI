import React, { useState, useEffect } from 'react';
import { X, Target, Plus, Minus, Trash2, Trophy, TrendingUp, Zap, Star, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { db } from '../../lib/firebase.js';
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";

const ProgressBar = ({ percentage, size = 'default', animated = true }) => {
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
          ${percentage >= 100 ? 'shadow-lg shadow-emerald-500/30' : ''}
          overflow-hidden
        `}
        style={{ width: `${animatedPercentage}%` }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        
        {percentage >= 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>

      {percentage >= 100 && (
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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(goal.id), 200);
  };

  return (
    <div className={`
      bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 rounded-2xl p-5 
      border border-zinc-600/30 backdrop-blur-lg relative overflow-hidden
      group hover:shadow-lg hover:shadow-black/20 transition-all duration-300
      ${isDeleting ? 'animate-pulse opacity-50 scale-95' : ''}
      ${isCompleted ? 'ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10' : ''}
    `}>
      {/* Completion celebration overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-3">
          <div className="flex items-center mb-1">
            {isCompleted && <CheckCircle size={16} className="text-emerald-400 mr-2 animate-pulse" />}
            <h4 className={`font-semibold break-words ${isCompleted ? 'text-emerald-100' : 'text-white'}`}>
              {title}
            </h4>
          </div>
          {isCompleted && (
            <div className="flex items-center text-emerald-400 text-xs font-medium">
              <Star size={12} className="mr-1" />
              Goal Completed!
            </div>
          )}
        </div>
        
        <button 
          onClick={handleDelete}
          className="text-zinc-500 hover:text-red-400 transition-all duration-200 p-1.5 rounded-lg hover:bg-red-500/10 group-hover:opacity-100 opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Progress controls */}
      <div className="flex items-center space-x-3 mb-4">
        <button 
          onClick={() => onUpdate(goal.id, Math.max(goal.current - 1, 0))}
          disabled={current <= 0}
          className="p-2.5 bg-gradient-to-br from-zinc-700/80 to-zinc-600/80 rounded-xl hover:from-zinc-600/80 hover:to-zinc-500/80 transition-all duration-200 border border-zinc-600/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Minus size={14} className="text-zinc-300 group-hover:text-white transition-colors" />
        </button>
        
        <div className="flex-1">
          <ProgressBar percentage={percentage} animated={true} />
        </div>
        
        <button 
          onClick={() => onUpdate(goal.id, Math.min(goal.current + 1, goal.target))}
          disabled={current >= target}
          className="p-2.5 bg-gradient-to-br from-emerald-600/80 to-emerald-500/80 rounded-xl hover:from-emerald-500/80 hover:to-emerald-400/80 transition-all duration-200 border border-emerald-500/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
        >
          <Plus size={14} className="text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center space-x-4">
          <span className="text-zinc-400 font-mono">
            {current} / {target}
          </span>
          <span className={`font-semibold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
            {percentage}%
          </span>
        </div>
        
        {percentage > 0 && percentage < 100 && (
          <div className="flex items-center text-zinc-500 text-xs">
            <TrendingUp size={12} className="mr-1" />
            {target - current} to go
          </div>
        )}
      </div>
    </div>
  );
};

const GoalTracker = ({ isOpen, onClose, goals = [], setGoals, user }) => {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate stats
  const completedGoals = goals.filter(g => g.current >= g.target).length;
  const totalProgress = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.current / g.target * 100), 0) / goals.length) : 0;

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || newGoalTarget <= 0 || !user || isSubmitting) return;

    setIsSubmitting(true);
    const newGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      current: 0,
      target: parseInt(newGoalTarget, 10),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'goals', newGoal.id), newGoal);
      setGoals(prev => [...prev, newGoal]);
      setNewGoalTitle('');
      setNewGoalTarget(10);
    } catch (error) {
      console.error("Error adding goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async (id, newCurrent) => {
    const updatedGoal = goals.find(g => g.id === id);
    if (!updatedGoal || !user) return;

    try {
      await setDoc(doc(db, 'users', user.uid, 'goals', id), { 
        ...updatedGoal, 
        current: newCurrent,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, current: newCurrent } : goal
      ));
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
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Target className="mr-3 text-emerald-400" size={24} />
            <div>
              <h3 className="text-2xl font-bold text-white">Long-Term Goals</h3>
              <p className="text-zinc-400 text-sm">Track your progress toward bigger achievements</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/10 group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Stats Overview */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-4 border border-emerald-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="text-emerald-400" size={20} />
                <span className="text-2xl font-bold text-white">{completedGoals}</span>
              </div>
              <p className="text-emerald-300 text-sm font-medium">Completed</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <Zap className="text-blue-400" size={20} />
                <span className="text-2xl font-bold text-white">{goals.length - completedGoals}</span>
              </div>
              <p className="text-blue-300 text-sm font-medium">In Progress</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-purple-400" size={20} />
                <span className="text-2xl font-bold text-white">{totalProgress}%</span>
              </div>
              <p className="text-purple-300 text-sm font-medium">Avg Progress</p>
            </div>
          </div>
        )}

        {/* Add New Goal Form */}
        <div className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 rounded-2xl p-6 border border-zinc-600/30 backdrop-blur-lg space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Plus size={18} className="mr-2 text-emerald-400" />
            Create New Goal
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="block text-sm font-medium text-zinc-300 mb-2">
                Goal Title
              </div>
              <input 
                type="text" 
                placeholder="e.g., Read 12 Books This Year"
                value={newGoalTitle} 
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-xl p-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all backdrop-blur-sm"
              />
            </div>
            
            <div>
              <div className="block text-sm font-medium text-zinc-300 mb-2">
                Target Number
              </div>
              <input 
                type="number" 
                min="1" 
                max="9999"
                placeholder="12"
                value={newGoalTarget} 
                onChange={(e) => setNewGoalTarget(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-xl p-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all backdrop-blur-sm"
              />
            </div>
          </div>
          
          <button 
            onClick={handleAddGoal}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-semibold transition-all text-white shadow-lg shadow-emerald-500/20 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? 'Adding Goal...' : 'Add New Goal'}
          </button>
        </div>

        {/* Goals List */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
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
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl flex items-center justify-center border border-zinc-600/50">
                <Target className="text-zinc-400" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">No Goals Yet</h4>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Set your first long-term goal above and start tracking your progress toward bigger achievements.
              </p>
              <div className="flex items-center justify-center text-zinc-500 text-sm">
                <Zap size={16} className="mr-2" />
                Goals help you stay motivated and focused
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GoalTracker;