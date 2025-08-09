import React, { useState } from 'react';

// Task Edit Form Component
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
  const icons = ['📝', '💻', '📚', '🏫', '💪', '🍔', '🚿', '😴', '☀️', '🌙', '🎯', '⚡'];

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-white">Edit Task</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Task Name</label>
          <input
            type="text"
            value={formData.task}
            onChange={(e) => setFormData({...formData, task: e.target.value})}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              placeholder="e.g., 30min"
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {icons.map((icon) => (
              <button
                key={icon}
                onClick={() => setFormData({...formData, icon})}
                className={`p-2 rounded-lg text-xl hover:bg-zinc-600 transition-colors ${
                  formData.icon === icon ? 'bg-emerald-600' : 'bg-zinc-700'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500"
            >
              {priorities.map(priority => (
                <option key={priority} value={priority} className="capitalize">
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default TaskEditForm;