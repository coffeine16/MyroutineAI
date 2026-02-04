import React from "react";
import { BarChart3, X, CheckCircle, Clock, Flame } from "lucide-react";

const AnalyticsDashboard = ({ tasks = [], onClose }) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full max-w-lg mx-auto border-zinc-700/50 rounded-2xl text-zinc-100 space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={28} className="text-emerald-400" />
          <h2 className="text-lg font-semibold">Analytics</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-zinc-800 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Completion Card */}
      <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg text-white-400">Completion</span>
          <span className="text-lg font-semibold text-zinc-100">
            {completionRate}%
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-zinc-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <p className="text-xs text-white-500">
          {completed} of {total} tasks completed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={CheckCircle}
          label="Completed"
          value={completed}
          color="text-emerald-400"
        />
        <Stat
          icon={Clock}
          label="Pending"
          value={pending}
          color="text-amber-400"
        />
        <Stat
          icon={Flame}
          label="Streak"
          value="—"
          color="text-purple-400"
        />
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 p-3 flex items-center gap-3">
    <Icon size={18} className={color} />
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-base font-semibold text-zinc-100">
        {value}
      </div>
    </div>
  </div>
);

export default AnalyticsDashboard;
