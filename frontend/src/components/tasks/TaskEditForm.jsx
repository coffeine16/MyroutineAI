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
      {/* subtle bg */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {task?.task ? 'Edit Task' : 'Create Task'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Configure your productivity moment
              </p>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl">{formData.icon}</div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {/* Task name */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-zinc-300 mb-1 flex items-center gap-2">
              <Tag size={13} className="text-emerald-400" />
              Task Name
            </label>
            <input
              value={formData.task}
              onChange={e => setFormData({ ...formData, task: e.target.value })}
              placeholder="What needs to be accomplished?"
              className="w-full rounded-xl bg-zinc-900/50 border border-zinc-600/50 p-2.5 sm:p-3 text-sm sm:text-base text-white"
            />
          </div>

          {/* Time + duration (always one row) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-zinc-300 mb-1 flex items-center gap-2">
                <Clock size={13} className="text-blue-400" /> Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full rounded-xl bg-zinc-900/50 border border-zinc-600/50 p-2.5 sm:p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-semibold text-zinc-300 mb-1 flex items-center gap-2">
                <Zap size={13} className="text-amber-400" /> Duration
              </label>
              <select
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                className="w-full rounded-xl bg-zinc-900/50 border border-zinc-600/50 p-2.5 sm:p-3 text-sm"
              >
                {durations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-zinc-300 mb-1 flex items-center gap-2">
              <Sparkles size={13} className="text-purple-400" /> Icon
            </label>

            {/* mobile = horizontal */}
            <div className="sm:hidden flex gap-2 overflow-x-auto pb-1">
              {icons.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`min-w-[40px] h-10 rounded-xl text-lg border ${
                    formData.icon === icon
                      ? 'bg-emerald-500/20 border-emerald-500/50'
                      : 'bg-zinc-800/50 border-zinc-600/50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* desktop grid */}
            <div className="hidden sm:grid grid-cols-8 gap-2 bg-zinc-900/50 border border-zinc-600/50 rounded-xl p-3">
              {icons.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-2 rounded-xl text-xl border ${
                    formData.icon === icon
                      ? 'bg-emerald-500/20 border-emerald-500/50'
                      : 'bg-zinc-800/50 border-zinc-600/50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Category + priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-zinc-300 mb-1 flex items-center gap-2">
                <Tag size={13} className={categoryColors[formData.category]} /> Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl bg-zinc-900/50 border border-zinc-600/50 p-2.5 sm:p-3 text-sm"
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-semibold text-zinc-300 mb-1 flex items-center gap-2">
                <Flag size={13} className="text-red-400" /> Priority
              </label>
              <div className="flex gap-2">
                {priorities.map(p => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 py-2 rounded-xl text-xs sm:text-sm capitalize border ${
                      formData.priority === p
                        ? priorityColors[p]
                        : 'bg-zinc-800/50 border-zinc-600/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-zinc-700/30">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-sm text-zinc-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.task.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditForm;
