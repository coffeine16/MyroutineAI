import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Target, Bell, LogOut, RefreshCw, Flame, Plus, Trophy, Zap, BarChart3, Menu, TrendingUp, Sparkles, MessageSquarePlus } from 'lucide-react';
import AiTaskInput from './components/ai/AiTaskInput.jsx';
import { runAiTaskParser, runChatbotConversation } from './lib/grok.js';
import { auth, db } from './lib/firebase.js';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import AuthForm from './components/auth/AuthForm.jsx';
import TaskItem from './components/tasks/TaskItem.jsx';
import TaskEditForm from './components/tasks/TaskEditForm.jsx';
import BulkActions from './components/tasks/BulkActions.jsx';
import ProgressBar from './components/ui/ProgressBar.jsx';
import SearchBar from './components/ui/SearchBar.jsx';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm GrindBot. How can I help you be more productive today?" }
  ]);

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
      } else {
        localStorage.removeItem('dailyGrindUser');
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    const aiResponseString = await runChatbotConversation(newMessages);
    let assistantResponse = aiResponseString;
    try {
      const firstBracket = aiResponseString.indexOf('{');
      const lastBracket = aiResponseString.lastIndexOf('}');
      if (firstBracket !== -1 && lastBracket !== -1) {
        const jsonString = aiResponseString.substring(firstBracket, lastBracket + 1);
        const aiResponseObject = JSON.parse(jsonString);
        if (aiResponseObject.action === 'createTask') {
          const newTask = {
            id: `task-${Date.now()}`,
            completed: false,
            ...aiResponseObject.payload
          };
          setTasks(prev => [...prev, newTask]);
          await setDoc(doc(db, 'users', user.uid, 'tasks', newTask.id), newTask);
          assistantResponse = `Okay, I've added "${newTask.task}" to your schedule for you.`;
        }
      }
    } catch (e) {
      console.error("Could not parse AI action from response:", e);
    }
    setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
    setAiLoading(false);
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
  };

  const handleAiTaskCreate = async (prompt) => {
    setAiLoading(true);
    const aiResult = await runAiTaskParser(prompt);
    setAiLoading(false);
    if (!aiResult) {
      alert("AI could not create the task. Please try a different prompt.");
      return;
    }
    const newTask = {
      id: `task-${Date.now()}`,
      completed: false,
      duration: "1h",
      ...aiResult,
    };
    setTasks(prev => [...prev, newTask]);
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', newTask.id);
      await setDoc(taskRef, newTask);
    } catch (error) {
      console.error("Error saving AI task:", error);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const matchesSearch = task.task.toLowerCase().includes(searchTerm.toLowerCase()) || (task.time && task.time.includes(searchTerm));
        if (filter === 'completed') return matchesSearch && task.completed;
        if (filter === 'pending') return matchesSearch && !task.completed;
        return matchesSearch;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
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
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleSaveTask = async (updatedTask) => {
    const taskExists = tasks.some(t => t.id === updatedTask.id);
    try {
      await setDoc(doc(db, 'users', user.uid, 'tasks', updatedTask.id), updatedTask, { merge: true });
    } catch (error) {
      console.error("Error saving task:", error);
      return;
    }
    if (taskExists) {
      setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    } else {
      setTasks(prev => [...prev, updatedTask]);
    }
    setShowEditModal(false);
    setEditingTask(null);
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
    const batch = writeBatch(db);
    selectedTasks.forEach(taskId => {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      batch.delete(taskRef);
    });
    await batch.commit();
    setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)));
    setSelectedTasks(new Set());
  };

  const calculateProgress = useCallback(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const fetchQuote = () => {
    const quotes = ["Progress, not perfection.", "Small steps lead to big changes.", "Consistency beats intensity.", "Your only competition is yesterday's you.", "Success is the sum of small efforts repeated day in and day out.", "The expert in anything was once a beginner.", "Don't watch the clock; do what it does. Keep going."];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-400 animate-pulse">Loading your grind...</p>
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

  const progress = calculateProgress();

  const SidebarContent = () => (
    <>
      <div className="hidden lg:block p-6 border-b border-zinc-700/50">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Daily Grind</h1>
          <div className="flex items-center text-amber-400" title="Daily Streak">
            <Flame size={24} className="animate-pulse" />
            <span className="ml-2 font-bold text-lg">{streak}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-zinc-400 mb-4">
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowAnalytics(true)} className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-400 hover:text-white transition-all hover:scale-105" title="Analytics"><BarChart3 size={18} /></button>
          <button onClick={() => setShowGoalTracker(true)} className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-400 hover:text-white transition-all hover:scale-105" title="Track Goals"><Target size={18} /></button>
          <button onClick={handleNotificationToggle} className={`p-2 rounded-xl border transition-all hover:scale-105 ${notificationsEnabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-800/50 border-zinc-600/50 text-zinc-400 hover:text-white'}`} title="Toggle Notifications"><Bell size={18} /></button>
          <button onClick={handleSignOut} className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-400 hover:text-red-400 transition-all hover:scale-105" title="Sign Out"><LogOut size={18} /></button>
        </div>
      </div>
      <div className="p-6 border-b border-zinc-700/50">
        <AiTaskInput onTaskCreate={handleAiTaskCreate} loading={aiLoading} />
      </div>
      <div className="p-6 border-b border-zinc-700/50">
        <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-700/60 rounded-2xl p-4 border border-zinc-600/50 backdrop-blur-sm">
          <div className="flex justify-between text-sm font-medium text-zinc-300 mb-3">
            <span className="flex items-center"><Zap size={16} className="mr-1 text-emerald-400" />Daily Progress</span>
            <span className="flex items-center">{progress}% {progress === 100 && <Trophy size={16} className="ml-1 text-yellow-400" />}</span>
          </div>
          <ProgressBar percentage={progress} showAnimation={progress > 80} />
          <p className="text-center text-xs text-zinc-500 mt-3">{user.email ? user.email.split('@')[0] : 'Demo User'} • {tasks.filter(t => t.completed).length} completed</p>
        </div>
      </div>
      <div className="p-6">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-2xl p-4 border border-amber-500/20 backdrop-blur-sm">
          <div className="flex justify-between items-center text-sm font-medium text-amber-300 mb-3">
            <span className="flex items-center"><Sparkles size={16} className="mr-2 text-amber-400" />Quote of the Day</span>
            <button onClick={fetchQuote} className="text-amber-400 hover:text-amber-300 transition-all hover:rotate-180 duration-300"><RefreshCw size={16} /></button>
          </div>
          <p className="text-sm text-amber-200/80 italic leading-relaxed">"{quote}"</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-zinc-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="relative flex flex-col lg:flex-row min-h-screen">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-700/50 backdrop-blur-sm bg-zinc-900/50 sticky top-0 z-20">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Daily Grind</h1>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-600/50 text-zinc-300 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
        <div className={`lg:w-96 lg:min-h-screen bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-xl border-r border-zinc-700/50 ${showMobileMenu ? 'block' : 'hidden lg:block'}`}>
          <SidebarContent />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 lg:p-6 border-b border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm sticky top-[69px] lg:top-0 z-10">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'completed'].map((filterType) => (
                  <button key={filterType} onClick={() => setFilter(filterType)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === filterType ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 border border-zinc-600/50 hover:bg-zinc-700/50'}`}>
                    <span className="capitalize">{filterType}</span>
                    <span className="ml-2 text-xs opacity-75">{filterType === 'all' ? tasks.length : filterType === 'completed' ? tasks.filter(t => t.completed).length : tasks.filter(t => !t.completed).length}</span>
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                <button onClick={handleAddTask} className="p-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/50 hover:scale-105" title="Add Task"><Plus size={18} /></button>
                <button onClick={handleToggleBulkMode} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${bulkMode ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-600/50'}`}>
                  {bulkMode ? 'Exit Bulk' : 'Bulk Select'}
                </button>
              </div>
            </div>
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onClear={() => setSearchTerm('')} />
          </div>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {bulkMode && selectedTasks.size > 0 && (<BulkActions selectedCount={selectedTasks.size} onMarkComplete={handleBulkComplete} onMarkIncomplete={handleBulkIncomplete} onDelete={handleBulkDelete} onClearSelection={() => setSelectedTasks(new Set())} />)}
            {filteredTasks.length === 0 ? (
              <div className="text-center text-zinc-400 py-16 flex flex-col items-center justify-center h-full">
                <div className="text-6xl mb-6 animate-bounce">🎯</div>
                <h3 className="text-xl font-semibold mb-2 text-zinc-300">{searchTerm ? 'No matches found' : 'No tasks for today'}</h3>
                <p className="text-zinc-500">{searchTerm ? 'Try adjusting your search terms' : 'Add some tasks to get started on your grind!'}</p>
                {!searchTerm && (<button onClick={handleAddTask} className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/50 hover:scale-105">Create Your First Task</button>)}
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
                  <div className="space-y-3 max-w-4xl mx-auto">
                    {filteredTasks.map(task => (<TaskItem key={task.id} task={task} onToggle={handleTaskToggle} onEdit={handleTaskEdit} onDelete={handleTaskDelete} isSelected={selectedTasks.has(task.id)} onSelect={handleTaskSelect} bulkMode={bulkMode} dragHandleProps={{}} />))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
      <GoalTracker isOpen={showGoalTracker} onClose={() => setShowGoalTracker(false)} goals={goals} setGoals={setGoals} user={user} />
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        {editingTask && <TaskEditForm task={editingTask} onSave={handleSaveTask} onCancel={() => setShowEditModal(false)} />}
      </Modal>
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)}>
        <AnalyticsDashboard tasks={tasks} onClose={() => setShowAnalytics(false)} />
      </Modal>
      <button onClick={() => setShowChatbot(true)} className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-900/50 transform hover:scale-110 transition-transform" title="Open AI Assistant">
        <MessageSquarePlus size={24} />
      </button>
      <Chatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} messages={messages} onSendMessage={handleSendMessage} loading={aiLoading} />
    </div>
  );
};
export default App;