import React from 'react';
import { BarChart3, X, TrendingUp, Trophy } from 'lucide-react';
import ProgressBar from './ProgressBar';

const AnalyticsDashboard = ({ tasks, onClose }) => {
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center"><BarChart3 className="mr-2 text-emerald-400" />Analytics</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-700/50"><X size={20} /></button>
      </div>
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-700/60 rounded-xl p-4 border border-zinc-600/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-300">Overall Progress</span>
            <span className="text-white font-bold text-lg">{completionRate}%</span>
          </div>
          <ProgressBar percentage={completionRate} showAnimation={true} />
          <p className="text-sm text-zinc-400 mt-2">{completedTasks} of {totalTasks} tasks completed</p>
        </div>
        <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-700/60 rounded-xl p-4 border border-zinc-600/50 backdrop-blur-sm">
          <h4 className="text-white font-semibold mb-3 flex items-center"><TrendingUp size={16} className="mr-2" />Category Breakdown</h4>
          <div className="space-y-3">
            {['study', 'work', 'fitness', 'personal'].map(category => {
              const categoryTasks = tasks.filter(t => t.category === category);
              if (categoryTasks.length === 0) return null;
              const completedCount = categoryTasks.filter(t => t.completed).length;
              const percentage = Math.round((completedCount / categoryTasks.length) * 100);
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${category === 'study' ? 'bg-blue-400' : category === 'work' ? 'bg-green-400' : category === 'fitness' ? 'bg-orange-400' : 'bg-purple-400'}`}></div>
                    <span className="text-zinc-300 capitalize">{category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-semibold">{completedCount}/{categoryTasks.length}</span>
                    <span className="text-zinc-400 text-sm ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-700/60 rounded-xl p-4 border border-zinc-600/50 backdrop-blur-sm">
          <h4 className="text-white font-semibold mb-3 flex items-center"><Trophy size={16} className="mr-2" />Today's Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-400">{completedTasks}</div>
              <div className="text-xs text-emerald-300">Completed</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-400">{totalTasks - completedTasks}</div>
              <div className="text-xs text-yellow-300">Remaining</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default AnalyticsDashboard;