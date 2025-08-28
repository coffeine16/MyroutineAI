import React, { useState } from 'react';
import { Clock, Zap, Tag, Flag, Save, X, Sparkles } from 'lucide-react';

const TaskEditForm = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    task: task?.task || '',
    time: task?.time || '12:00',
    icon: task?.icon || '📝',
    category: task?.category || 'personal',
    priority: task?.priority || 'medium',
    duration: task?.duration || '30min'
  });

  const handleSave = () => {
    if (!formData.task.trim()) return;
    onSave({ ...task, ...formData });
  };

  const categories = ['personal', 'study', 'work', 'fitness', 'wellness'];
  const priorities = ['low', 'medium', 'high'];
  const icons = ['📝', '💻', '📚', '🏫', '💪', '🛒', '🚿', '😴', '☀️', '🌙', '🎯', '⚡', '🔥', '✨', '🚀', '🎨'];

  const durations = ['15min', '30min', '45min', '1h', '1.5h', '2h', '3h', '4h'];

  const categoryColors = {
    personal: 'text-purple-400',
    study: 'text-blue-400',
    work: 'text-cyan-400',
    fitness: 'text-red-400',
    wellness: 'text-emerald-400'
  };

  const priorityColors = {
    low: 'border-emerald-500/50 bg-emerald-500/10',
    medium: 'border-amber-500/50 bg-amber-500/10', 
    high: 'border-red-500/50 bg-red-500/10'
  };

  return (
    <div className="relative">
      {/* Subtle background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
              <Sparkles size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                {task?.task ? 'Edit Task' : 'Create Task'}
              </h3>
              <p className="text-zinc-400 text-sm">Configure your productivity moment</p>
            </div>
          </div>
          <div className="text-3xl">{formData.icon}</div>
        </div>

        <div className="space-y-5">
          {/* Task Name */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-300 mb-2">
              <Tag size={14} className="text-emerald-400" />
              <span>Task Name</span>
            </label>
            <input 
              type="text" 
              value={formData.task} 
              onChange={(e) => setFormData({...formData, task: e.target.value})} 
              placeholder="What needs to be accomplished?"
              className="w-full bg-zinc-900/50 border border-zinc-600/50 rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm"
            />
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-300 mb-2">
                <Clock size={14} className="text-blue-400" />
                <span>Time</span>
              </label>
              <input 
                type="time" 
                value={formData.time} 
                onChange={(e) => setFormData({...formData, time: e.target.value})} 
                className="w-full bg-zinc-900/50 border border-zinc-600/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-300 mb-2">
                <Zap size={14} className="text-amber-400" />
                <span>Duration</span>
              </label>
              <select
                value={formData.duration} 
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-600/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
              >
                {durations.map(d => (
                  <option key={d} value={d} className="bg-zinc-800 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-300 mb-2">
              <Sparkles size={14} className="text-purple-400" />
              <span>Icon</span>
            </label>
            <div className="bg-zinc-900/50 border border-zinc-600/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {icons.map((icon) => (
                  <button 
                    key={icon} 
                    onClick={() => setFormData({...formData, icon})} 
                    className={`p-2 rounded-xl text-xl transition-all duration-200 hover:scale-105 border ${
                      formData.icon === icon 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                        : 'bg-zinc-800/50 border-zinc-600/50 hover:bg-zinc-700/50 hover:border-zinc-500/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-300 mb-2">
                <Tag size={14} className={categoryColors[formData.category]} />
                <span>Category</span>
              </label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
                className="w-full bg-zinc-900/50 border border-zinc-600/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize bg-zinc-800 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-300 mb-2">
                <Flag size={14} className="text-red-400" />
                <span>Priority</span>
              </label>
              <div className="space-y-2">
                {priorities.map(priority => (
                  <button
                    key={priority}
                    onClick={() => setFormData({...formData, priority})}
                    className={`w-full p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] text-left font-medium capitalize ${
                      formData.priority === priority
                        ? priorityColors[priority] + ' text-white'
                        : 'bg-zinc-800/50 border-zinc-600/50 text-zinc-300 hover:bg-zinc-700/50'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 pt-4 border-t border-zinc-700/30">
          <button 
            onClick={onCancel} 
            className="px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl font-medium transition-all duration-200 border border-zinc-600/50 hover:border-zinc-500/50 text-zinc-300 hover:text-white hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button 
            onClick={handleSave} 
            disabled={!formData.task.trim()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-medium text-white transition-all duration-200 shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditForm;