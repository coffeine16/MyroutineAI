import React, { useState } from 'react';

const TaskEditForm = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    task: task.task,
    time: task.time,
    icon: task.icon,
    category: task.category || 'personal',
    priority: task.priority || 'medium',
    duration: task.duration || '30min'
  });

  const handleSave = () => {
    onSave({ ...task, ...formData });
  };

  const categories = ['personal', 'study', 'work', 'fitness'];
  const priorities = ['low', 'medium', 'high'];
  const icons = ['📝', '💻', '📚', '🏫', '💪', '🛒', '🚿', '😴', '☀️', '🌙', '🎯', '⚡'];

  return (
    <>
      <h3 className="text-lg font-bold mb-4 text-white">Edit Task</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Task Name</label>
          <input type="text" value={formData.task} onChange={(e) => setFormData({...formData, task: e.target.value})} className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Time</label>
            <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Duration</label>
            <input type="text" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="e.g., 30min" className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500/50" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Icon</label>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {icons.map((icon) => (
              <button key={icon} onClick={() => setFormData({...formData, icon})} className={`p-2 rounded-lg text-xl hover:bg-zinc-600/50 transition-colors border ${formData.icon === icon ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-zinc-700/50 border-zinc-600/50'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500/50">
              {categories.map(cat => (<option key={cat} value={cat} className="capitalize bg-zinc-800">{cat}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Priority</label>
            <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500/50">
              {priorities.map(p => (<option key={p} value={p} className="capitalize bg-zinc-800">{p}</option>))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={onCancel} className="px-5 py-2.5 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-xl text-sm font-medium transition-colors border border-zinc-600/50">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-emerald-900/50">Save Changes</button>
      </div>
    </>
  );
};
export default TaskEditForm;