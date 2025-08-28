import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Target, Bell, LogOut, RefreshCw, Flame, Plus, Trophy, Zap, BarChart3, Menu, TrendingUp, Sparkles, MessageSquarePlus, Calendar, Star, Clock, Filter } from 'lucide-react';
import AiTaskInput from './components/ai/AiTaskInput.jsx';
import { runAiTaskParser, runChatbotConversation } from './lib/grok.js';
import { auth, db } from './lib/firebase.js';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import AuthForm from './components/auth/AuthForm.jsx';
import {
  initGoogleCalendarClient,
  requestAccessToken,
  upsertCalendarEvent,
  deleteCalendarEvent,
} from "./lib/calendar.js";

import TaskEditForm from './components/tasks/TaskEditForm.jsx';
import Modal from './components/ui/Modal.jsx';
import GoalTracker from './components/goals/GoalTracker.jsx';
import Chatbot from './components/ai/Chatbot.jsx';
import { requestNotificationPermission, showNotification } from './lib/notifications.js';
import AnalyticsDashboard from './components/ui/AnalyticsDashboard.jsx';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [quote, setQuote] = useState("Progress, not perfection.");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showGoalTracker, setShowGoalTracker] = useState(false);
  const [goals, setGoals] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTaskLoading, setAiTaskLoading] = useState(false);
  const [showAiTaskInput, setShowAiTaskInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm GrindBot. How can I help you be more productive today?" }
  ]);

  // Animated background particles
  const ParticleBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
    </div>
  );

  // Enhanced Progress Bar Component
  const EnhancedProgressBar = ({ percentage, showAnimation }) => (
    <div className="relative">
      <div className="w-full bg-zinc-800/80 rounded-full h-3 overflow-hidden border border-zinc-700/50 backdrop-blur-sm">
        <div 
          className={`h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${showAnimation ? 'animate-shimmer' : ''}`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-right"></div>
        </div>
      </div>
      {percentage === 100 && (
        <div className="absolute -top-1 -right-1 animate-bounce">
          <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
            <Trophy size={12} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );

  // Enhanced Task Item Component with drag and drop support
  const EnhancedTaskItem = ({ task, onToggle, onEdit, onDelete, isSelected, onSelect, bulkMode }) => {
    const priorityColors = {
      high: 'from-red-500/20 to-red-600/20 border-red-500/30',
      medium: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
      low: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30'
    };

    const categoryColors = {
      work: 'text-blue-400',
      personal: 'text-purple-400',
      fitness: 'text-red-400',
      wellness: 'text-green-400'
    };

    return (
      <div className={`group relative bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-xl rounded-2xl p-4 border border-zinc-700/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10 ${task.completed ? 'opacity-75' : 'hover:border-emerald-500/30'} ${isSelected ? 'ring-2 ring-emerald-500/50' : ''}`}>
        
        {/* Floating priority indicator */}
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${priorityColors[task.priority]} border backdrop-blur-sm flex items-center justify-center animate-pulse-gentle`}>
          <div className="w-2 h-2 rounded-full bg-current opacity-80"></div>
        </div>

        <div className="flex items-center space-x-4">
          {bulkMode && (
            <div className="relative">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(task.id)}
                className="w-5 h-5 rounded-lg border-2 border-zinc-600 bg-zinc-800 checked:bg-emerald-500 checked:border-emerald-500 transition-all"
              />
            </div>
          )}
          
          <div className="relative">
            <button
              onClick={() => onToggle(task.id, !task.completed)}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-emerald-400'}`}
            >
              {task.completed && (
                <div className="flex items-center justify-center text-white animate-scale-in">
                  ✓
                </div>
              )}
            </button>
            {task.completed && (
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl animate-gentle-bounce">{task.icon}</span>
              <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'} transition-all`}>
                {task.task}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-zinc-800/50 border border-zinc-600/50 ${categoryColors[task.category]}`}>
                {task.category}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-zinc-400">
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{task.time}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap size={14} />
                <span>{task.duration}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all hover:scale-110"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-all hover:scale-110"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Search Bar
  const EnhancedSearchBar = ({ searchTerm, onSearchChange, onClear }) => (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search tasks, times, or categories..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-12 pr-12 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
      />
      {searchTerm && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );

  // Stats cards with enhanced visuals
  const StatsCard = ({ icon: Icon, title, value, subtitle, color = "emerald" }) => {
    const colorClasses = {
      emerald: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400",
      amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
      blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
      purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400"
    };

    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-2xl group`}>
        <div className="flex items-center justify-between mb-3">
          <Icon size={24} className="group-hover:scale-110 transition-transform" />
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-75">{subtitle}</p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const fiveMinutesFromNow = new Date(new Date().getTime() + 5 * 60000);
      const notificationTime = fiveMinutesFromNow.toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit',
      });
      const dueTasks = tasks.filter(task => !task.completed && task.time === notificationTime);
      dueTasks.forEach(task => {
        showNotification(`Time for: ${task.task}`, {
          body: `Your schedule says it's time to start "${task.task}".`,
          icon: '/favicon.ico'
        });
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [tasks]);

  useEffect(() => {
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        localStorage.setItem('dailyGrindUser', JSON.stringify(user));
        setUser(user);
        initializeUserData(user.uid);
        initGoogleCalendarClient();
      } else {
        localStorage.removeItem('dailyGrindUser');
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save or update a task in Firestore + Google Calendar
  const saveTaskWithCalendar = async (rawTask) => {
    try {
      const googleEventId = await upsertCalendarEvent(rawTask);
      const taskToSave = { ...rawTask, googleEventId };

      // Firestore
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskToSave.id);
      await setDoc(taskRef, taskToSave, { merge: true });

      return taskToSave;
    } catch (err) {
      console.error("saveTaskWithCalendar failed:", err);
      throw err;
    }
  };

  // Delete a task from Firestore + Google Calendar
  const deleteTaskWithCalendar = async (task) => {
    try {
      if (task.googleEventId) {
        await deleteCalendarEvent(task.googleEventId);
      }
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', task.id));
    } catch (err) {
      console.error("deleteTaskWithCalendar failed:", err);
      throw err;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        showNotification("Notifications Enabled!", {
          body: "You'll now receive updates from Daily Grind."
        });
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleToggleBulkMode = () => {
    if (bulkMode) {
      setSelectedTasks(new Set());
    }
    setBulkMode(!bulkMode);
  };

  const handleSendMessage = async (userInput) => {
    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setAiLoading(true);
  
    try {
      const aiResponseString = await runChatbotConversation(newMessages);
      let assistantResponse = aiResponseString;
    
      // Fix: Extract ALL JSON objects from the response
      const jsonObjects = [];
      const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      let match;
      
      while ((match = jsonRegex.exec(aiResponseString)) !== null) {
        try {
          const parsed = JSON.parse(match[0]);
          jsonObjects.push(parsed);
        } catch (e) {
          console.warn("Failed to parse JSON object:", match[0]);
        }
      }
    
      // Process all createTask actions
      const allNewTasks = [];
      let taskCreated = false;
      
      for (const jsonObj of jsonObjects) {
        if (jsonObj.action === 'createTask') {
          taskCreated = true;
          const tasksToCreate = Array.isArray(jsonObj.payload) 
            ? jsonObj.payload 
            : [jsonObj.payload];
          
          const newTasks = tasksToCreate.map((taskData, index) => ({
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
            completed: false,
            ...taskData
          }));
          
          allNewTasks.push(...newTasks);
        }
        // Handle regular chat responses
        else if (jsonObj.response) {
          assistantResponse = jsonObj.response;
        }
      }
      
      // If tasks were created, add them all at once
      if (taskCreated && allNewTasks.length > 0) {
        setTasks(prev => [...prev, ...allNewTasks]);
        
        // Save all tasks
        await Promise.all(
          allNewTasks.map(async (task) => {
            await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), task);
            try {
              await saveTaskWithCalendar(task);
            } catch (err) {
              console.error("Failed to sync task to Calendar:", err);
            }
          })
        );
        
        assistantResponse = `I've added ${allNewTasks.length} task${allNewTasks.length > 1 ? 's' : ''} to your schedule!`;
      }
    
      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble right now. Please try again."
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const initializeUserData = async (userId) => {
    const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
    const goalsCollectionRef = collection(db, 'users', userId, 'goals');
    const [tasksSnapshot, goalsSnapshot] = await Promise.all([
      getDocs(tasksCollectionRef),
      getDocs(goalsCollectionRef)
    ]);
    if (tasksSnapshot.empty) {
      setTasks([]);
    } else {
      setTasks(tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }
    if (goalsSnapshot.empty) {
      setGoals([]);
    } else {
      setGoals(goalsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }
    setStreak(Math.floor(Math.random() * 15) + 1);
  };

  const handleAuthSuccess = (user) => {
    localStorage.setItem('dailyGrindUser', JSON.stringify(user));
    setUser(user);
    initializeUserData(user.uid);
    initGoogleCalendarClient();
  };

  const handleAiTaskCreate = async (prompt) => {
  setAiLoading(true);
  try {
    const aiResults = await runAiTaskParser(prompt);
    
    // Fix: Ensure aiResults is always an array
    const resultsArray = Array.isArray(aiResults) ? aiResults : [aiResults];
    
    if (!resultsArray || resultsArray.length === 0 || !resultsArray[0]) {
      alert("AI could not create tasks. Try again.");
      return;
    }

    const newTasks = resultsArray.map((res, index) => ({
      id: `task-${Date.now()}-${index}-${Math.random().toString(36).slice(2,6)}`,
      completed: false,
      duration: res.duration || "1h",
      ...res,
    }));

    // Optimistic UI
    setTasks(prev => [...prev, ...newTasks]);

    // Background sync for each (fail-safe)
    await Promise.allSettled(newTasks.map(saveTaskWithCalendar));

  } catch (err) {
    console.error("AI task creation failed:", err);
    alert("Failed to create tasks. Please try again.");
  } finally {
    setAiLoading(false);
  }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Ensure task.task and task.time exist
        const taskName = task?.task ?? '';
        const taskTime = task?.time ?? '';

        const matchesSearch =
          taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          taskTime.includes(searchTerm);

        if (filter === 'completed') return matchesSearch && task.completed;
        if (filter === 'pending') return matchesSearch && !task.completed;
        return matchesSearch;
      })
      .sort((a, b) => {
        const timeA = a?.time ?? '';
        const timeB = b?.time ?? '';
        return timeA.localeCompare(timeB);
      });
  }, [tasks, searchTerm, filter]);

  const handleTaskToggle = async (taskId, completed) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, completed } : t)));
    if (completed) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        showNotification("Task Completed! 🎉", {
          body: `You've finished: ${task.task}`
        });
      }
    }
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), { completed });
    } catch (error) {
      console.error("Error updating task:", error);
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, completed: !completed } : t)));
    }
  };

  const handleTaskDelete = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await Promise.all([
        deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId)),
        taskToDelete?.googleEventId
          ? deleteCalendarEvent(taskToDelete.googleEventId).catch(err => {
              console.error("Failed to delete from Google Calendar:", err);
            })
          : Promise.resolve()
      ]);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Couldn't delete task properly.");
    }
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleSaveTask = async (updatedTask) => {
    // ⚡ Optimistic UI update
    setTasks(prev => {
      const exists = prev.some(t => t.id === updatedTask.id);
      return exists
        ? prev.map(t => (t.id === updatedTask.id ? updatedTask : t))
        : [...prev, updatedTask];
    });

    try {
      // ✅ Sync in background
      const savedTask = await saveTaskWithCalendar(updatedTask);

      // Replace with synced version
      setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));

    } catch (err) {
      alert("Couldn't save/sync this task.");
    } finally {
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  const handleTaskSelect = (taskId) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleAddTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      task: '',
      time: '12:00',
      icon: '📝',
      category: 'personal',
      priority: 'medium',
      duration: '30min',
      completed: false
    };
    setEditingTask(newTask);
    setShowEditModal(true);
  };

  const handleSignOut = async () => {
    await auth.signOut();
  };

  const handleBulkComplete = async () => {
    if (selectedTasks.size === 0) return;
    const batch = writeBatch(db);
    selectedTasks.forEach(taskId => {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      batch.update(taskRef, { completed: true });
    });
    await batch.commit();
    setTasks(prev => prev.map(task => selectedTasks.has(task.id) ? { ...task, completed: true } : task));
    setSelectedTasks(new Set());
  };

  const handleBulkIncomplete = async () => {
    if (selectedTasks.size === 0) return;
    const batch = writeBatch(db);
    selectedTasks.forEach(taskId => {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      batch.update(taskRef, { completed: false });
    });
    await batch.commit();
    setTasks(prev => prev.map(task => selectedTasks.has(task.id) ? { ...task, completed: false } : task));
    setSelectedTasks(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;

    const tasksToDelete = tasks.filter(task => selectedTasks.has(task.id));

    // ⚡ Optimistic UI update
    setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)));
    setSelectedTasks(new Set());

    // Prepare Firestore batch
    const batch = writeBatch(db);
    tasksToDelete.forEach(task => {
      const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
      batch.delete(taskRef);
    });

    try {
      // ✅ Run Firestore batch + Calendar deletions in parallel
      await Promise.all([
        batch.commit(),
        Promise.all(
          tasksToDelete.map(task =>
            task.googleEventId
              ? deleteCalendarEvent(task.googleEventId).catch(err =>
                  console.error(`Failed to delete event for task ${task.id}:`, err)
                )
              : Promise.resolve()
          )
        )
      ]);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Some tasks may not have been fully deleted.");
    }
  };

  const calculateProgress = useCallback(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const fetchQuote = () => {
    const quotes = [
      "Progress, not perfection.", 
      "Small steps lead to big changes.", 
      "Consistency beats intensity.", 
      "Your only competition is yesterday's you.", 
      "Success is the sum of small efforts repeated day in and day out.", 
      "The expert in anything was once a beginner.", 
      "Don't watch the clock; do what it does. Keep going."
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  const progress = calculateProgress();

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-zinc-700/30">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent animate-gradient">
            Daily Grind
          </h1>
          <div className="flex items-center text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20" title="Daily Streak">
            <Flame size={20} className="animate-pulse mr-2" />
            <span className="font-bold text-lg">{streak}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-zinc-400 mb-6">
          <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Online</span>
          </div>
        </div>

        {/* Enhanced action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowAnalytics(true)} 
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-white hover:scale-105 transition-all backdrop-blur-sm group"
          >
            <BarChart3 size={20} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Analytics</span>
          </button>
          <button 
            onClick={() => setShowGoalTracker(true)} 
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-purple-400 hover:text-white hover:scale-105 transition-all backdrop-blur-sm group"
          >
            <Target size={20} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Goals</span>
          </button>
          <button 
            onClick={handleNotificationToggle}
            className={`p-3 rounded-2xl border transition-all hover:scale-105 backdrop-blur-sm group ${notificationsEnabled ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-br from-zinc-700/20 to-zinc-800/20 border-zinc-600/30 text-zinc-400'}`}
          >
            <Bell size={20} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Alerts</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 text-red-400 hover:text-white hover:scale-105 transition-all backdrop-blur-sm group"
          >
            <LogOut size={20} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Enhanced progress section */}
      <div className="p-6 border-b border-zinc-700/30">
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-3xl p-6 border border-zinc-700/50 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5"></div>
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center text-zinc-300 font-semibold">
                <Zap size={18} className="mr-2 text-emerald-400" />
                Daily Progress
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {progress}%
                </span>
                {progress === 100 && <Trophy size={18} className="text-yellow-400 animate-bounce" />}
              </div>
            </div>
            <EnhancedProgressBar percentage={progress} showAnimation={progress > 80} />
            <div className="flex justify-between items-center mt-4 text-sm">
              <span className="text-zinc-500">
                {user?.email ? user.email.split('@')[0] : 'Demo User'}
              </span>
              <span className="text-zinc-400">
                {tasks.filter(t => t.completed).length} of {tasks.length} completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced quote section */}
      <div className="p-6">
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/10 to-orange-500/10 rounded-3xl p-6 border border-amber-500/20 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-2 right-2 w-20 h-20 bg-amber-400/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-2 left-2 w-16 h-16 bg-orange-400/10 rounded-full blur-xl"></div>
          </div>
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center text-amber-300 font-semibold">
                <Sparkles size={18} className="mr-2 text-amber-400 animate-pulse" />
                Daily Inspiration
              </span>
              <button 
                onClick={fetchQuote}
                className="text-amber-400 hover:text-amber-300 transition-all hover:rotate-180 duration-500 p-1"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-amber-200/90 italic leading-relaxed font-medium">
              "{quote}"
            </p>
            <div className="mt-3 flex justify-end">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-amber-400/60 fill-current" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-6 shadow-2xl shadow-emerald-500/25"></div>
          <p className="text-zinc-400 animate-pulse text-lg font-medium">Loading your grind...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center p-4">
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-zinc-100 relative">
      <ParticleBackground />
      
      {/* Custom styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slide-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-shimmer { 
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-slide-right { animation: slide-right 2s infinite; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-gentle-bounce { animation: gentle-bounce 2s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease-in-out infinite;
        }
        .animate-pulse-gentle { animation: pulse-gentle 2s ease-in-out infinite; }
      `}</style>

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-700/50 backdrop-blur-xl bg-zinc-900/80 sticky top-0 z-30">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            Daily Grind
          </h1>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)} 
            className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-300 hover:text-white hover:scale-105 transition-all"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Enhanced Sidebar */}
        <div className={`lg:w-96 lg:min-h-screen bg-gradient-to-b from-zinc-900/95 to-zinc-800/95 backdrop-blur-2xl border-r border-zinc-700/30 ${showMobileMenu ? 'block' : 'hidden lg:block'} relative z-20`}>
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          {/* Enhanced Header */}
          <div className="p-6 border-b border-zinc-700/30 bg-zinc-900/50 backdrop-blur-xl sticky top-[69px] lg:top-0 z-20">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard 
                icon={Target} 
                title="Tasks Today" 
                value={tasks.length} 
                subtitle="Total scheduled"
                color="emerald" 
              />
              <StatsCard 
                icon={Trophy} 
                title="Completed" 
                value={tasks.filter(t => t.completed).length} 
                subtitle="Tasks finished"
                color="amber" 
              />
              <StatsCard 
                icon={Clock} 
                title="Progress" 
                value={`${progress}%`} 
                subtitle="Daily completion"
                color="blue" 
              />
              <StatsCard 
                icon={Flame} 
                title="Streak" 
                value={streak} 
                subtitle="Days active"
                color="purple" 
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <div className="flex flex-wrap gap-3">
                {['all', 'pending', 'completed'].map((filterType) => (
                  <button 
                    key={filterType} 
                    onClick={() => setFilter(filterType)} 
                    className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                      filter === filterType 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50 scale-105' 
                        : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 border border-zinc-600/50 hover:bg-zinc-700/50 hover:scale-105'
                    }`}
                  >
                    <span className="capitalize">{filterType}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-full">
                      {filterType === 'all' ? tasks.length : filterType === 'completed' ? tasks.filter(t => t.completed).length : tasks.filter(t => !t.completed).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={handleAddTask} 
                  className="p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl transition-all shadow-lg shadow-emerald-900/50 hover:scale-110 group" 
                  title="Add Task"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <button 
                  onClick={handleToggleBulkMode} 
                  className={`px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    bulkMode 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50 scale-105' 
                      : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-600/50 hover:scale-105'
                  }`}
                >
                  {bulkMode ? 'Exit Bulk' : 'Bulk Select'}
                </button>
              </div>
            </div>

            {/* Enhanced Search */}
            <EnhancedSearchBar 
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
              onClear={() => setSearchTerm('')} 
            />
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Bulk Actions */}
            {bulkMode && selectedTasks.size > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">
                    {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleBulkComplete}
                      className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all font-medium"
                    >
                      Complete All
                    </button>
                    <button 
                      onClick={handleBulkIncomplete}
                      className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-all font-medium"
                    >
                      Mark Pending
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all font-medium"
                    >
                      Delete All
                    </button>
                    <button 
                      onClick={() => setSelectedTasks(new Set())}
                      className="px-4 py-2 bg-zinc-500/20 text-zinc-400 rounded-xl hover:bg-zinc-500/30 transition-all font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
              <div className="text-center text-zinc-400 py-20 flex flex-col items-center justify-center h-full">
                <div className="relative mb-8">
                  <div className="text-8xl animate-gentle-bounce">🎯</div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-zinc-300 bg-gradient-to-r from-zinc-300 to-zinc-400 bg-clip-text text-transparent">
                  {searchTerm ? 'No matches found' : 'Ready to grind?'}
                </h3>
                <p className="text-zinc-500 mb-8 max-w-md text-center leading-relaxed">
                  {searchTerm ? 'Try adjusting your search terms or filters' : 'Add some tasks to get started on your productivity journey!'}
                </p>
                {!searchTerm && (
                  <button 
                    onClick={handleAddTask} 
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-900/50 hover:scale-110 group"
                  >
                    <Plus size={20} className="inline mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Create Your First Task
                  </button>
                )}
              </div>
            ) : (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4 max-w-5xl mx-auto">
                    {filteredTasks.map(task => (
                      <EnhancedTaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={handleTaskToggle} 
                        onEdit={handleTaskEdit} 
                        onDelete={handleTaskDelete} 
                        isSelected={selectedTasks.has(task.id)} 
                        onSelect={handleTaskSelect} 
                        bulkMode={bulkMode} 
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <GoalTracker 
        isOpen={showGoalTracker} 
        onClose={() => setShowGoalTracker(false)} 
        goals={goals} 
        setGoals={setGoals} 
        user={user} 
      />
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        {editingTask && (
          <TaskEditForm 
            task={editingTask} 
            onSave={handleSaveTask} 
            onCancel={() => setShowEditModal(false)} 
          />
        )}
      </Modal>
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)}>
        <AnalyticsDashboard 
          tasks={tasks} 
          onClose={() => setShowAnalytics(false)} 
        />
      </Modal>

      {/* Floating Actions */}
      {/* Floating Controls (Calendar + Chatbot) */}
      {/* Floating Controls */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 flex flex-col items-end space-y-4 z-30">
      
      {/* Calendar Toggle Button */}
      <button
        onClick={() => setShowCalendar((prev) => !prev)}
        className="relative p-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full shadow-2xl shadow-blue-900/40 transform hover:scale-110 transition-all duration-300 group"
        title={showCalendar ? "Hide Calendar" : "Show Calendar"}
      >
        <Calendar size={26} className="group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30"></div>
      </button>
      
      {/* Google Calendar Card (collapsible) */}
      {showCalendar && (
        <div className="bg-gradient-to-br from-white/95 to-gray-100/95 dark:from-zinc-900/95 dark:to-zinc-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-700/50 shadow-2xl rounded-3xl p-6 w-80 transform animate-slide-up">
          <h3 className="text-lg font-bold flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            Google Calendar
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            Seamlessly sync your tasks with Google Calendar for ultimate productivity.
          </p>
          <button
            onClick={requestAccessToken}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Connect Calendar
          </button>
        </div>
      )}
      
      {/* AI Task Creator Button */}
      <button
        onClick={() => setShowAiTaskInput((prev) => !prev)}
        className="relative p-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-full shadow-2xl shadow-amber-900/40 transform hover:scale-110 transition-all duration-300 group"
        title={showAiTaskInput ? "Hide AI Task Creator" : "Show AI Task Creator"}
      >
        <Sparkles size={26} className="group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-30"></div>
      </button>

      {/* AI Task Creator Card (collapsible) */}
      {showAiTaskInput && (
        <AiTaskInput
          onTaskCreate={handleAiTaskCreate}
          loading={aiTaskLoading}
          onClose={() => setShowAiTaskInput(false)}
        />
      )}
      
      {/* Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="relative p-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-full shadow-2xl shadow-emerald-900/50 transform hover:scale-110 transition-all duration-300 group"
        title="Open AI Assistant"
      >
        <MessageSquarePlus size={26} className="group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30"></div>
      </button>
      </div>

      {/* Chatbot */}
      <Chatbot 
        isOpen={showChatbot} 
        onClose={() => setShowChatbot(false)} 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        loading={aiLoading} 
      />
    </div>
  );
};

export default App;