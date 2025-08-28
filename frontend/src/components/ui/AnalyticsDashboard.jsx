import React from 'react';
import { BarChart3, X, TrendingUp, Trophy, Target, Clock, Zap } from 'lucide-react';

const ProgressBar = ({ percentage, showAnimation = false, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-400',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-400',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
  };

  return (
    <div className="relative w-full h-2 bg-zinc-700/50 rounded-full overflow-hidden backdrop-blur-sm">
      <div 
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-700 ease-out shadow-sm`}
        style={{ 
          width: `${percentage}%`,
          transform: showAnimation ? 'translateX(0)' : 'translateX(-100%)',
          animation: showAnimation ? 'slideIn 1.5s ease-out forwards' : 'none'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30" />
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, subtitle, gradient, iconColor, border }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 border ${border} backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className={`${iconColor} group-hover:scale-110 transition-transform duration-300`} />
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <h4 className="text-white/90 font-medium text-sm">{title}</h4>
      {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

const CategoryRow = ({ category, completed, total, color }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const colorMap = {
    study: { bg: 'bg-blue-500', text: 'text-blue-400', gradient: 'blue' },
    work: { bg: 'bg-emerald-500', text: 'text-emerald-400', gradient: 'emerald' },
    fitness: { bg: 'bg-orange-500', text: 'text-orange-400', gradient: 'orange' },
    personal: { bg: 'bg-purple-500', text: 'text-purple-400', gradient: 'purple' }
  };

  return (
    <div className="group hover:bg-white/5 rounded-lg p-3 transition-all duration-200 border border-transparent hover:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${colorMap[category]?.bg} shadow-sm`} />
          <span className="text-white/90 capitalize font-medium">{category}</span>
        </div>
        <div className="text-right">
          <span className="text-white font-semibold">{completed}/{total}</span>
          <span className="text-white/50 text-sm ml-2">({percentage}%)</span>
        </div>
      </div>
      <ProgressBar percentage={percentage} color={colorMap[category]?.gradient} />
    </div>
  );
};

const AnalyticsDashboard = ({ tasks = [], onClose }) => {
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const categories = ['study', 'work', 'fitness', 'personal'];
  const categoryStats = categories.map(category => {
    const categoryTasks = tasks.filter(t => t.category === category);
    const completed = categoryTasks.filter(t => t.completed).length;
    return { category, completed, total: categoryTasks.length };
  }).filter(stat => stat.total > 0);

  const pendingTasks = totalTasks - completedTasks;
  const streak = 4; // This would come from your app's streak logic

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <BarChart3 className="mr-3 text-emerald-400" size={24} />
          <h3 className="text-2xl font-bold text-white">Analytics</h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-zinc-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/10 group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* Main Progress Card */}
      <div className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 rounded-2xl p-6 border border-zinc-600/30 backdrop-blur-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white/90 text-lg font-semibold">Daily Progress</h4>
              <p className="text-white/60 text-sm">Thursday, August 28</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                {completionRate}%
              </span>
            </div>
          </div>
          <ProgressBar percentage={completionRate} showAnimation={true} />
          <div className="flex justify-between items-center mt-3">
            <span className="text-white/70 text-sm">{completedTasks} of {totalTasks} tasks completed</span>
            <div className="flex items-center text-emerald-400 text-sm">
              <Zap size={14} className="mr-1" />
              {completionRate >= 75 ? 'Excellent!' : completionRate >= 50 ? 'Good pace' : 'Keep going!'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Trophy}
          title="Completed"
          value={completedTasks}
          subtitle="Tasks finished"
          gradient="from-emerald-500/20 to-emerald-600/20"
          iconColor="text-emerald-400"
          border="border-emerald-500/20"
        />
        <StatCard
          icon={Clock}
          title="Pending"
          value={pendingTasks}
          subtitle="Tasks remaining"
          gradient="from-yellow-500/20 to-orange-500/20"
          iconColor="text-yellow-400"
          border="border-yellow-500/20"
        />
        <StatCard
          icon={Target}
          title="Streak"
          value={streak}
          subtitle="Days active"
          gradient="from-purple-500/20 to-pink-500/20"
          iconColor="text-purple-400"
          border="border-purple-500/20"
        />
      </div>

      {/* Category Breakdown */}
      {categoryStats.length > 0 && (
        <div className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 rounded-2xl p-6 border border-zinc-600/30 backdrop-blur-lg">
          <div className="flex items-center mb-5">
            <TrendingUp size={20} className="mr-3 text-blue-400" />
            <h4 className="text-white font-semibold text-lg">Category Breakdown</h4>
          </div>
          <div className="space-y-3">
            {categoryStats.map(({ category, completed, total }) => (
              <CategoryRow 
                key={category} 
                category={category} 
                completed={completed} 
                total={total} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 rounded-2xl p-6 border border-zinc-600/30 backdrop-blur-lg">
        <h4 className="text-white font-semibold text-lg mb-4 flex items-center">
          <Zap size={20} className="mr-3 text-yellow-400" />
          Today's Insights
        </h4>
        <div className="space-y-3 text-sm">
          {completionRate >= 75 && (
            <div className="flex items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3" />
              <span className="text-emerald-300">Outstanding productivity today! You're on fire! 🔥</span>
            </div>
          )}
          {completionRate < 50 && pendingTasks > 0 && (
            <div className="flex items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
              <span className="text-blue-300">You still have {pendingTasks} tasks to tackle. You've got this!</span>
            </div>
          )}
          <div className="flex items-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3" />
            <span className="text-purple-300">Keep your {streak}-day streak alive by completing more tasks!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;