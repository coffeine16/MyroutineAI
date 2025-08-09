import React from 'react';
import { BarChart3, X, TrendingUp, Trophy } from 'lucide-react';
import ProgressBar from './ProgressBar';

// Analytics Dashboard Component
const AnalyticsDashboard = ({ tasks, onClose }) => {
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const categoryStats = tasks.reduce((acc, task) => {
    const category = task.category || 'other';
    if (!acc[category]) {
      acc[category] = { total: 0, completed: 0 };
    }
    acc[category].total += 1;
    if (task.completed) acc[category].completed += 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 rounded-2xl p-6 w-full max-w-md border border-zinc-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <BarChart3 className="mr-2" />
            Analytics
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-zinc-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-300">Overall Progress</span>
              <span className="text-white font-bold">{completionRate}%</span>
            </div>
            <ProgressBar percentage={completionRate} showAnimation={true} />
            <p className="text-sm text-zinc-400 mt-2">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>

          <div className="bg-zinc-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <TrendingUp size={16} className="mr-2" />
              Category Breakdown
            </h4>
            <div className="space-y-2">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-zinc-300 capitalize">{category}</span>
                  <span className="text-white">
                    {stats.completed}/{stats.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <Trophy size={16} className="mr-2" />
              Quick Stats
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-400">{completedTasks}</div>
                <div className="text-xs text-zinc-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{totalTasks - completedTasks}</div>
                <div className="text-xs text-zinc-400">Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;