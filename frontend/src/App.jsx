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
  const [filter, setFilter] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! How can I help you be more productive today?" }
  ]);

  // Animated background particles
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e, taskId) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (diff > 50) { // Swipe left to complete
      handleTaskToggle(taskId, true);
    }
  };
  // Enhanced Progress Bar Component
  const EnhancedProgressBar = ({ percentage}) => (
    <div className="relative">
      <div className="w-full bg-zinc-800/80 rounded-full h-3 overflow-hidden border border-zinc-700/50 backdrop-blur-sm">
        <div 
          className={`h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
      </div>
      {percentage === 100 && (
        <div className="absolute -top-1 -right-1">
          <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
            <Trophy size={12} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );

  // Enhanced Task Item Component with drag and drop support
  const EnhancedTaskItem = ({ task, onToggle, onEdit, onDelete }) => {
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
      <div className={`group relative bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-zinc-700/50 transition-all duration-300 hover:shadow-emerald-500/10 ${task.completed ? 'opacity-75' : 'hover:border-emerald-500/30'}`}>
        
        {/* Mobile-friendly priority indicator */}
        <div className={`absolute -top-1 lg:-top-2 -right-1 lg:-right-2 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-br ${priorityColors[task.priority]} border backdrop-blur-sm flex items-center justify-center`}>
          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-current opacity-80"></div>
        </div>

        <div className="flex items-start space-x-3 lg:space-x-4">
          {/* Mobile-optimized checkbox and toggle */}
          <div className="flex flex-col space-y-2 pt-1">
            
            <div className="relative">
              <button
                onClick={() => onToggle(task.id, !task.completed)}
                className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 transition-all duration-300 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-emerald-400'}`}
              >
                {task.completed && (
                  <div className="flex items-center justify-center text-white text-xs animate-scale-in">
                    ✓
                  </div>
                )}
              </button>
              {task.completed && (
                <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-75"></div>
              )}
            </div>
          </div>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start lg:items-center flex-col lg:flex-row lg:space-x-3 mb-2 lg:mb-2">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-0">
                <span className="text-lg lg:text-2xl">{task.icon}</span>
                <h3 className={`font-semibold text-base lg:text-lg ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'} transition-all break-words`}>
                  {task.task}
                </h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-zinc-800/50 border border-zinc-600/50 ${categoryColors[task.category]} flex-shrink-0 self-start lg:self-center`}>
                {task.category}
              </span>
            </div>
            
            {/* Mobile-stacked time info */}
            <div className="flex items-center flex-wrap gap-3 lg:gap-4 text-xs lg:text-sm text-zinc-400">
              <div className="flex items-center space-x-1">
                <Clock size={12} className="lg:w-3.5 lg:h-3.5" />
                <span>{task.time}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap size={12} className="lg:w-3.5 lg:h-3.5" />
                <span>{task.duration}</span>
              </div>
            </div>
          </div>

          {/* Mobile-optimized action buttons */}
          <div className="flex lg:items-center space-x-1 lg:space-x-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity pt-1 lg:pt-0">
            <button
              onClick={() => onEdit(task)}
              className="p-2 lg:p-2 rounded-lg lg:rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all hover:scale-110"
            >
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 lg:p-2 rounded-lg lg:rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-all hover:scale-110"
            >
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20">
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
    <div className="relative group w-full lg:max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 lg:pl-4 flex items-center pointer-events-none">
        <svg className="h-4 w-4 lg:h-5 lg:w-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 lg:pl-10 pr-10 lg:pr-10 py-2.5 lg:py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl lg:rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all backdrop-blur-sm text-sm lg:text-base"
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
  const StatItem = ({ icon: Icon, label, value, color, className = "" }) => (
    <div
      className={`
        flex items-center gap-4
        px-4 py-2
        rounded-xl
        bg-zinc-900/60 border border-zinc-700/50
        ${className}
      `}
    >
      <Icon size={28} className={color} />
      <div className="text-md">
        <div className="text-zinc-400">{label}</div>
        <div className="font-semibold text-zinc-100">{value}</div>
      </div>
    </div>
  );



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
        localStorage.setItem('dailyUser', JSON.stringify(user));
        setUser(user);
        initializeUserData(user.uid);
        initGoogleCalendarClient();
      } else {
        localStorage.removeItem('dailyUser');
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save or update a task in Firestore + Google Calendar
// Save or update a task + sync with Google Calendar
// Save (create or update) a task in Firestore + Google Calendar
const saveTaskWithCalendar = async (rawTask) => {
  try {
    console.log("DEBUG saveTaskWithCalendar rawTask:", rawTask);
    
    // Always create/update event
    const googleEventId = await upsertCalendarEvent(rawTask);
    console.log("DEBUG: upsertCalendarEvent returned:", googleEventId, typeof googleEventId);
    
    // Attach googleEventId only if it exists
    const taskToSave = {
      ...rawTask,
      ...(googleEventId ? { googleEventId } : {})
    };
    
    // Persist in Firestore
    const taskRef = doc(db, "users", user.uid, "tasks", taskToSave.id);
    await setDoc(taskRef, taskToSave, { merge: true });
    
    console.log("Task saved with GoogleEventId:", googleEventId);
    console.log("DEBUG: Returning taskToSave:", taskToSave); // Add this line
    
    return taskToSave; // Make sure this includes googleEventId
  } catch (err) {
    console.error("saveTaskWithCalendar failed:", err);
    throw err;
  }
};

  const handleSaveTask = async (rawTask) => {
    // ⚡ Optimistic UI update with a placeholder
    setTasks(prev => {
      const exists = prev.some(t => t.id === rawTask.id);
      const tempTask = { ...rawTask, syncing: true }; // 🚩 googleEventId will come after sync
      return exists
        ? prev.map(t => (t.id === rawTask.id ? tempTask : t))
        : [...prev, tempTask];
    });

    try {
      // ✅ Save to Firestore + Google Calendar (returns task with googleEventId)
      const savedTask = await saveTaskWithCalendar(rawTask);
      console.log("DEBUG: savedTask returned:", savedTask); 

      // 🔄 Replace the temporary version with the fully synced task
      setTasks(prev => {
      const updated = prev.map(t =>
        t.id === savedTask.id ? { ...savedTask, syncing: false } : t
      );
      console.log("DEBUG: Updated tasks state:", updated.find(t => t.id === savedTask.id)); // Add this
      return updated;
    });

    } catch (err) {
      console.error("handleSaveTask failed:", err);
      alert("Couldn't save/sync this task.");

      // ❌ Roll back optimistic update if save fails
      setTasks(prev => prev.filter(t => t.id !== rawTask.id));
    } finally {
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  // ---- calendar delete helper ----
  const deleteTaskWithCalendar = async (taskId) => {
    try {
      const taskToDelete = tasks.find((t) => t.id === taskId);
      if (!taskToDelete) {
        console.warn("Task not found for deletion:", taskId);
        return;
      }

      // delete from Google Calendar if event exists
      if (taskToDelete.googleEventId) {
        await deleteCalendarEvent(taskToDelete.googleEventId);
      } else {
        console.warn("⚠️ No googleEventId on task:", taskToDelete);
      }

      // delete from Firestore
      await deleteDoc(doc(db, "users", user.uid, "tasks", taskId));
      console.log("✅ Deleted task:", taskId);

      // update local state
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("❌ deleteTaskWithCalendar failed:", err);
    }
  };


  // ---- UI handler ----
  const handleTaskDelete = async (taskId) => {
    try {
      await deleteTaskWithCalendar(taskId);
    } catch (err) {
      console.error("Error deleting task:", err);
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
          body: "You'll now receive updates from MyRoutineAI."
        });
      }
    } else {
      setNotificationsEnabled(false);
    }
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
    localStorage.setItem('dailyUser', JSON.stringify(user));
    setUser(user);
    initializeUserData(user.uid);
    initGoogleCalendarClient();
  };

  const handleAiTaskCreate = async (prompt) => {
    setAiLoading(true);
    try {
      const aiResults = await runAiTaskParser(prompt);
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
      
      // Background sync AND update local state with returned tasks
      console.log("DEBUG: About to sync tasks:", newTasks.length); // ADD THIS
      const syncResults = await Promise.allSettled(newTasks.map(saveTaskWithCalendar));
      console.log("DEBUG: Sync results:", syncResults); // ADD THIS
      
      // Update local state with tasks that have googleEventId
      const syncedTasks = syncResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      console.log("DEBUG: Synced tasks with googleEventId:", syncedTasks); // ADD THIS
      
      if (syncedTasks.length > 0) {
        console.log("DEBUG: Updating local state"); // ADD THIS
        setTasks(prev => 
          prev.map(task => {
            const syncedTask = syncedTasks.find(st => st.id === task.id);
            return syncedTask || task;
          })
        );
      }
      
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

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
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

  const SidebarContent = ({setSidebarOpen}) => (
    <>
      <div className="p-6 border-b border-zinc-700/30">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-300 hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            MyRoutineAI
          </button>
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
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-6 shadow-2xl shadow-emerald-500/25"></div>
          <p className="text-zinc-400 animate-pulse text-lg font-medium">Loading your day...</p>
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
      {/* Custom styles */}

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-700/50 backdrop-blur-xl bg-zinc-900/80 fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-300 hover:text-white hover:scale-105 transition-all"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              MyRoutineAI
            </h1>
          </div>
          
          {/* Mobile progress indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-zinc-800/30 px-3 py-1.5 rounded-xl border border-zinc-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-zinc-300">{progress}%</span>
            </div>
            <div className="flex items-center text-amber-400 bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20">
              <Flame size={16} className="mr-1" />
              <span className="text-sm font-bold">{streak}</span>
            </div>
          </div>
        </div>
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Enhanced Sidebar */}
        <div className={`
          ${sidebarOpen ? 'lg:w-96' : 'lg:w-0'} 
          fixed lg:relative top-0 left-0 h-full lg:h-auto
          ${sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:w-0'} 
          transition-all duration-300 ease-in-out 
          lg:min-h-screen 
          bg-gradient-to-b from-zinc-900/98 to-zinc-800/98 lg:from-zinc-900/95 lg:to-zinc-800/95 
          backdrop-blur-2xl 
          border-r border-zinc-700/30 
          z-50 lg:z-20 
          overflow-hidden
          shadow-2xl lg:shadow-none
        `}>
          <div className="w-80 lg:w-96 h-full overflow-y-auto">
            <SidebarContent setSidebarOpen={setSidebarOpen}/>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative z-10 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-0' : ''}`}>
          {/* Enhanced Header */}
          <div className="border-b border-zinc-700/30 bg-zinc-900/50 backdrop-blur-xl sticky top-[69px] lg:top-0 z-20 flex-shrink-0">
            {/* Always visible header bar */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                {/* Sidebar toggle button - only show on desktop when sidebar is closed */}
                {!sidebarOpen && (
                  <button 
                    onClick={() => setSidebarOpen(true)}
                    className="hidden lg:flex p-3 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 hover:scale-105 transition-all group"
                    title="Open Sidebar"
                  >
                    <Menu size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
                
                <div className="flex items-center space-x-3">
                  {/* Collapsible header toggle button */}
                  <button
                    onClick={() => setHeaderCollapsed(!headerCollapsed)}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      headerCollapsed 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-zinc-800/50 border border-zinc-600/50 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50'
                    }`}
                    title={headerCollapsed ? "Show Header Details" : "Hide Header Details"}
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${headerCollapsed ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div>
                    <button
                      onClick={() => setHeaderCollapsed(!headerCollapsed)}
                      className="text-left transition-all duration-300 hover:text-emerald-400 group"
                    >
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all">
                        Your Tasks
                      </h2>
                    </button>
                    <p className={`text-zinc-400 text-sm transition-all duration-300 ${
                      headerCollapsed ? 'opacity-60' : 'opacity-100'
                    }`}>
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick actions - always visible but compact when collapsed */}
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 bg-zinc-800/30 px-4 py-2 rounded-xl border border-zinc-700/50 transition-all duration-300 ${
                  headerCollapsed ? 'px-3 py-1.5' : 'px-4 py-2'
                }`}>
                  <TrendingUp size={headerCollapsed ? 14 : 16} className="text-emerald-400" />
                  <span className={`font-semibold text-zinc-300 transition-all duration-300 ${
                    headerCollapsed ? 'text-xs' : 'text-sm'
                  }`}>
                    {progress}% Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Smooth Collapsible content */}
            <div className={`transition-all duration-500 ease-in-out ${
              headerCollapsed 
                ? 'max-h-0 opacity-0 -mt-2' 
                : 'max-h-[600px] opacity-100 mt-0'
            }`} style={{ overflow: headerCollapsed ? 'hidden' : 'visible' }}>
            <div className="px-6 pb-6 pt-0">

              {/* Stats Grid */}
              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  mb-4
                  lg:flex
                  lg:flex wrap
                  lg:gap-3
                  sm:grid-cols-4
                "
              >
                <StatItem
                  icon={Target}
                  label="Tasks"
                  value={tasks.length}
                  color="text-emerald-400"
                  className="lg:w-[160px]"
                />

                <StatItem
                  icon={Trophy}
                  label="Completed"
                  value={tasks.filter(t => t.completed).length}
                  color="text-amber-400"
                  className="lg:w-[160px]"
                />

                <StatItem
                  icon={Clock}
                  label="Progress"
                  value={`${progress}%`}
                  color="text-blue-400"
                  className="lg:w-[160px]"
                />

                <StatItem
                  icon={Flame}
                  label="Streak"
                  value={streak}
                  color="text-purple-400"
                  className="lg:w-[160px]"
                />
              </div>

              {/* Actions Row */}
              <div
                className="flex items-center gap-2 sm:gap-3"
              >
                <button
                  onClick={handleAddTask}
                  className="
                    shrink-0
                    px-3 py-2
                    sm:px-4 sm:py-2.5
                    text-sm font-semibold
                    rounded-xl
                    bg-emerald-600 hover:bg-emerald-500
                    transition-all
                    whitespace-nowrap
                  "
                >
                  <span className="sm:hidden">+</span>
                  <span className="hidden sm:inline">Add Task</span>

                </button>

                {/* Search (kept close, not pushed away) */}
                <div className="flex-1 max-w-full sm:max-w-sm lg:max-w-md">
                  <EnhancedSearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClear={() => setSearchTerm('')}
                  />
                </div>
              </div>

            </div>

            </div>
            <div className={`px-6 transition-all duration-300 ${headerCollapsed ? 'pb-6 pt-2' : 'pb-6'}`}>
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'pending', 'completed'].map((filterType) => (
                  <button 
                    key={filterType} 
                    onClick={() => setFilter(filterType)} 
                    className={`flex-shrink-0 px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl text-sm font-semibold transition-all duration-300 ${
                      filter === filterType 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50' 
                        : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 border border-zinc-600/50 hover:bg-zinc-700/50'
                    }`}
                  >
                    <span className="capitalize">{filterType}</span>
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                      {filterType === 'all' ? tasks.length : filterType === 'completed' ? tasks.filter(t => t.completed).length : tasks.filter(t => !t.completed).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto overscroll-bounce p-3 lg:p-6 min-h-0">

            {/* Tasks Grid - mobile spacing */}
            {filteredTasks.length === 0 ? (
              <div className="text-center text-zinc-400 py-25 lg:py-20 flex flex-col items-center justify-center h-full px-4">
                <div className="relative mb-6 lg:mb-8">
                  <div className="text-5xl lg:text-6xl opacity-80">🎯</div>
                  <div className="absolute -top-1 lg:-top-2 -right-1 lg:-right-2 w-5 h-5 lg:w-6 lg:h-6 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-zinc-500 mb-6 lg:mb-8 max-w-sm lg:max-w-md text-center leading-relaxed text-sm lg:text-base px-4">
                  {searchTerm ? 'Try adjusting your search terms or filters' : 'Add some tasks to get started on your productivity journey!'}
                </p>
                {!searchTerm && (
                  <button 
                    onClick={handleAddTask} 
                    className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl lg:rounded-2xl font-bold transition-all shadow-xl shadow-emerald-900/50 hover:scale-110 group text-sm lg:text-base"
                  >
                    <Plus size={18} className="lg:w-5 lg:h-5 inline mr-2 group-hover:rotate-90 transition-transform duration-300" />
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
                  <div className="space-y-3 lg:space-y-4 max-w-5xl mx-auto">
                    {filteredTasks.map(task => (
                      <EnhancedTaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={handleTaskToggle} 
                        onEdit={handleTaskEdit} 
                        onDelete={() => handleTaskDelete(task.id)}
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
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} className="mx-4 lg:mx-auto max-w-lg lg:max-w-2xl">
        {editingTask && (
          <TaskEditForm 
            task={editingTask} 
            onSave={handleSaveTask} 
            onCancel={() => setShowEditModal(false)} 
          />
        )}
      </Modal>
      
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} size="analytics" className="mx-4 lg:mx-auto max-w-lg lg:max-w-2xl">
        <AnalyticsDashboard 
          tasks={tasks} 
          onClose={() => setShowAnalytics(false)} 
        />
      </Modal>

      {/* Floating Actions */}

      {/* Fixed Floating Controls */}
      <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 flex flex-col items-end space-y-3 z-[60] pointer-events-none max-h-screen">
        
        {/* Calendar Toggle Button */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setShowCalendar((prev) => !prev)}
            className="relative p-3 lg:p-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full shadow-xl lg:shadow-2xl shadow-blue-900/40 transform hover:scale-110 transition-all duration-300 group z-[61]"
            title={showCalendar ? "Hide Calendar" : "Show Calendar"}
          >
            <Calendar size={20} className="lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Google Calendar Card - positioned to avoid cutoff */}
          {showCalendar && (
            <div className="absolute bottom-full right-0 mb-3 bg-gradient-to-br from-white/98 to-gray-100/98 dark:from-zinc-900/98 dark:to-zinc-800/98 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-700/50 shadow-2xl rounded-2xl lg:rounded-3xl p-4 lg:p-6 w-80 lg:w-96 transform animate-slide-up z-[62]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-bold flex items-center gap-3">
                  <div className="p-1.5 lg:p-2 bg-blue-500/10 rounded-lg lg:rounded-xl">
                    <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                  </div>
                  Google Calendar
                </h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                Seamlessly sync your tasks with Google Calendar for ultimate productivity.
              </p>
              <button
                onClick={requestAccessToken}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm lg:text-base"
              >
                Connect Calendar
              </button>
            </div>
          )}
        </div>
        
        {/* AI Task Creator Button */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setShowAiTaskInput((prev) => !prev)}
            className="relative p-3 lg:p-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-full shadow-xl lg:shadow-2xl shadow-amber-900/40 transform hover:scale-110 transition-all duration-300 group z-[61]"
            title={showAiTaskInput ? "Hide AI Task Creator" : "Show AI Task Creator"}
          >
            <Sparkles size={20} className="lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-amber-500 opacity-20"></div>
          </button>

          {/* AI Task Creator Card - positioned to avoid cutoff */}
          {/* AI Task Creator Card - positioned to avoid cutoff */}
          {showAiTaskInput && (
            <div className="fixed bottom-20 right-4 w-72 sm:w-80 lg:w-96 z-[62] max-h-[calc(100vh-8rem)] overflow-y-auto">
              <AiTaskInput
                onTaskCreate={handleAiTaskCreate}
                loading={aiTaskLoading}
                onClose={() => setShowAiTaskInput(false)}
              />
            </div>
          )}
        </div>
        
        {/* Chatbot Button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setShowChatbot(true)}
            className="relative p-3 lg:p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-full shadow-xl lg:shadow-2xl shadow-emerald-900/50 transform hover:scale-110 transition-all duration-300 group z-[61]"
            title="Open AI Assistant"
          >
            <MessageSquarePlus size={20} className="lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
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