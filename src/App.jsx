import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Target, 
  Bell, 
  LogOut, 
  RefreshCw, 
  Flame, 
  Plus, 
  Trophy, 
  Zap, 
  BarChart3 
} from 'lucide-react';

// Local Imports
import AiTaskInput from './components/ai/AiTaskInput.jsx';
import { runAiTaskParser } from './lib/grok.js';
import { auth } from './lib/firebase.js';
import { db } from './lib/firebase.js';
import { collection, doc, getDocs, writeBatch, updateDoc, setDoc } from "firebase/firestore";
import { scheduleTemplates } from './data/scheduleTemplates.js';
import AuthForm from './components/auth/AuthForm.jsx';
import TaskItem from './components/tasks/TaskItem.jsx';
import TaskEditForm from './components/tasks/TaskEditForm.jsx';
import BulkActions from './components/tasks/BulkActions.jsx';
import ToggleSwitch from './components/ui/ToggleSwitch.jsx';
import ProgressBar from './components/ui/ProgressBar.jsx';
import UndoToast from './components/ui/UndoToast.jsx';
import SearchBar from './components/ui/SearchBar.jsx';
import AnalyticsDashboard from './components/ui/AnalyticsDashboard.jsx';
import Modal from './components/ui/Modal.jsx';
import GoalTracker from './components/goals/GoalTracker.jsx';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState(0);
  const [examMode, setExamMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [quote, setQuote] = useState("Stay focused. You've got this.");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showGoalTracker, setShowGoalTracker] = useState(false); // <-- ADD THIS
  const [goals, setGoals] = useState([ // <-- ADD THIS
    { id: 'goal-1', title: 'Solve 300 LeetCode Mediums', current: 42, target: 300 }
  ]); 
  const [aiLoading, setAiLoading] = useState(false);
  // Enhanced state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [savedNormalTasks, setSavedNormalTasks] = useState([]);
  const undoTimeoutRef = useRef(null);

  useEffect(() => {
    // 1. Check for a saved user in localStorage when the app loads
    const savedUser = localStorage.getItem('dailyGrindUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUser(user);
      initializeUserData(user.uid);
      setLoading(false);
    } else {
      // 2. If no saved user, listen for new auth changes (like a new login)
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          // This part is no longer needed here because onAuthSuccess handles it
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  // NEW function to handle successful authentication
  const handleAuthSuccess = (user) => {
    localStorage.setItem('dailyGrindUser', JSON.stringify(user)); // Save user to localStorage
    setUser(user);
    initializeUserData(user.uid);
  };

const initializeUserData = async (userId) => {
    // Create a reference to this user's specific 'tasks' collection
    const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
    const querySnapshot = await getDocs(tasksCollectionRef);

    if (querySnapshot.empty) {
      // --- NEW USER ---
      // If the user has no tasks, create the default schedule for them
      console.log("New user detected, creating default schedule in database...");
      const dayOfWeek = new Date().getDay();
      const scheduleTemplate = (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5)
        ? scheduleTemplates.mwf
        : scheduleTemplates.tth;
      
      const newTasks = scheduleTemplate.map((task, index) => ({
        id: `task-${index}`, // Use a stable ID
        ...task,
        completed: false
      }));

      // Use a "batch write" to save all the new tasks to the database at once
      const batch = writeBatch(db);
      newTasks.forEach(task => {
        const taskRef = doc(db, 'users', userId, 'tasks', task.id);
        batch.set(taskRef, task);
      });
      await batch.commit();
      
      setTasks(newTasks);
      setSavedNormalTasks(newTasks);

    } else {
      // --- RETURNING USER ---
      // If they have tasks, load them from the database
      console.log("Returning user, loading tasks from database...");
      const dbTasks = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setTasks(dbTasks);
      setSavedNormalTasks(dbTasks);
    }

    setStreak(Math.floor(Math.random() * 15) + 1); // This can remain as is for now
  };

  const handleExamModeToggle = (isExamMode) => {
    setExamMode(isExamMode);

    if (isExamMode) {
      // Turning ON Exam Mode
      setSavedNormalTasks(tasks); // Save your current list of tasks

      // Create the new exam schedule from the template
      const examSchedule = scheduleTemplates.exam.map((task, index) => ({
        id: `exam-task-${index}`,
        ...task,
        completed: false, // Reset completion status for the exam day
      }));
      setTasks(examSchedule);
    } else {
      // Turning OFF Exam Mode
      setTasks(savedNormalTasks); // Restore your normal task list
    }
  };
  // Undo functionality
  const addToUndoStack = useCallback((action) => {
    setUndoStack(prev => [...prev.slice(-9), action]);
  }, []);
  
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

    setTasks(prevTasks => [...prevTasks, newTask]);

    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', newTask.id);
      await setDoc(taskRef, newTask);
    } catch (error) {
      console.error("Error saving AI task to database: ", error);
    }
  };

  const showUndoNotification = useCallback((message) => {
    setUndoMessage(message);
    setShowUndoToast(true);
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    if (lastAction.type === 'toggle') {
      setTasks(prev => prev.map(task => 
        task.id === lastAction.taskId 
          ? { ...task, completed: lastAction.previousState }
          : task
      ));
    } else if (lastAction.type === 'bulk') {
      setTasks(lastAction.previousTasks);
    } else if (lastAction.type === 'delete') {
      setTasks(prev => [...prev, lastAction.deletedTask].sort((a,b) => a.time.localeCompare(b.time)));
    } else if (lastAction.type === 'bulk_delete') {
        setTasks(lastAction.previousTasks);
    }
    
    setShowUndoToast(false);
  }, [undoStack]);

  // Search and filter functionality
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.time.includes(searchTerm);
    
    if (filter === 'completed') return matchesSearch && task.completed;
    if (filter === 'pending') return matchesSearch && !task.completed;
    return matchesSearch;
  }).sort((a, b) => a.time.localeCompare(b.time));

  // Bulk operations
  const toggleBulkMode = useCallback(() => {
    setBulkMode(prev => !prev);
    setSelectedTasks(new Set());
  }, []);

  const handleTaskSelect = useCallback((taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleBulkComplete = useCallback(() => {
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map(task =>
      selectedTasks.has(task.id) ? { ...task, completed: true } : task
    );
    
    setTasks(updatedTasks);
    addToUndoStack({ type: 'bulk', previousTasks });
    showUndoNotification(`Marked ${selectedTasks.size} tasks as complete`);
    setSelectedTasks(new Set());
  }, [tasks, selectedTasks, addToUndoStack, showUndoNotification]);

  const handleBulkIncomplete = useCallback(() => {
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map(task =>
      selectedTasks.has(task.id) ? { ...task, completed: false } : task
    );
    
    setTasks(updatedTasks);
    addToUndoStack({ type: 'bulk', previousTasks });
    showUndoNotification(`Marked ${selectedTasks.size} tasks as incomplete`);
    setSelectedTasks(new Set());
  }, [tasks, selectedTasks, addToUndoStack, showUndoNotification]);

  const handleBulkDelete = useCallback(() => {
    const previousTasks = [...tasks];
    const remainingTasks = tasks.filter(task => !selectedTasks.has(task.id));
    
    setTasks(remainingTasks);
    addToUndoStack({ 
      type: 'bulk_delete', 
      previousTasks: previousTasks
    });
    showUndoNotification(`Deleted ${selectedTasks.size} tasks`);
    setSelectedTasks(new Set());
  }, [tasks, selectedTasks, addToUndoStack, showUndoNotification]);

const handleTaskToggle = async (taskId, completed) => {
    // 1. Optimistically update the UI for a snappy user experience
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ));

    // 2. Save the change to the Firestore database in the background
    try {
      // Create a reference to the specific task document in the database
      // It's located at: users -> {the_user's_id} -> tasks -> {the_task's_id}
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      
      // Update the 'completed' field in that document
      await updateDoc(taskRef, {
        completed: completed
      });

    } catch (error) {
      console.error("Error updating task in database: ", error);
      // Optional: Revert the UI change if the database update fails
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ));
      // Optional: Show an error message to the user
    }
  };

  const handleTaskEdit = useCallback((task) => {
    setEditingTask(task);
    setShowEditModal(true);
  }, []);

  const handleTaskDelete = useCallback((taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    
    setTasks(updatedTasks);
    addToUndoStack({
      type: 'delete',
      deletedTask: taskToDelete
    });
    showUndoNotification('Task deleted');
  }, [tasks, addToUndoStack, showUndoNotification]);

  const handleSaveTask = useCallback((updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setShowEditModal(false);
    setEditingTask(null);
  }, []);

  const handleAddTask = useCallback(() => {
    const newTask = {
      id: `task-${Date.now()}`,
      task: 'New Task',
      time: '12:00',
      icon: '📝',
      category: 'personal',
      priority: 'medium',
      duration: '30min',
      completed: false
    };
    
    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask);
    setShowEditModal(true);
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    localStorage.removeItem('dailyGrindUser'); // Remove user from localStorage
    setUser(null);
  };

  const calculateProgress = useCallback(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const fetchQuote = () => {
    const quotes = [
      "Stay focused. You've got this.",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your grind...</p>
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

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-zinc-800 rounded-2xl shadow-2xl flex flex-col h-[90vh] max-h-[800px] border border-zinc-700">
        {/* Header */}
        <header className="p-4 border-b border-zinc-700">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold text-emerald-400">
              My Daily Grind
            </h1>
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-amber-400" title="Daily Streak">
                <Flame size={20} />
                <span className="ml-1 font-bold">{streak}</span>
              </div>
              <button 
                className="text-zinc-400 hover:text-white transition-all hover:scale-110" 
                title="Analytics"
                onClick={() => setShowAnalytics(true)}
              >
                <BarChart3 size={20} />
              </button>
              <button 
                onClick={() => setShowGoalTracker(true)}
                className="text-zinc-400 hover:text-white transition-all hover:scale-110" 
                title="Track Goals"
              >
                <Target size={20} />
              </button>
              <button 
                className={`transition-all hover:scale-110 ${notificationsEnabled ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                title="Toggle Notifications"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <Bell size={20} />
              </button>
              <button 
                className="text-zinc-400 hover:text-white transition-all hover:scale-110" 
                title="Sign Out"
                onClick={handleSignOut}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-zinc-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-300">Exam Mode</span>
              <ToggleSwitch checked={examMode} onChange={(e) => handleExamModeToggle(e.target.checked)} />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2">
            {['all', 'pending', 'completed'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 border-b border-zinc-700">
          <AiTaskInput onTaskCreate={handleAiTaskCreate} loading={aiLoading} />
        </div>
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
            />
            <div className="flex space-x-2 ml-3">
              <button
                onClick={handleAddTask}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                title="Add Task"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={toggleBulkMode}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  bulkMode 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500'
                }`}
              >
                {bulkMode ? 'Exit' : 'Bulk'}
              </button>
            </div>
          </div>

          {bulkMode && selectedTasks.size > 0 && (
            <BulkActions
              selectedCount={selectedTasks.size}
              onMarkComplete={handleBulkComplete}
              onMarkIncomplete={handleBulkIncomplete}
              onDelete={handleBulkDelete}
              onClearSelection={() => setSelectedTasks(new Set())}
            />
          )}

          {filteredTasks.length === 0 ? (
            <div className="text-center text-zinc-400 py-8">
              <div className="text-4xl mb-4">🎯</div>
              {searchTerm ? 'No tasks match your search.' : 'No tasks for today. Add some to get started!'}
            </div>
          ) : (
            <div className="space-y-0">
              {filteredTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                  onEdit={handleTaskEdit}
                  onDelete={handleTaskDelete}
                  isSelected={selectedTasks.has(task.id)}
                  onSelect={handleTaskSelect}
                  bulkMode={bulkMode}
                  dragHandleProps={{}}
                />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="p-4 border-t border-zinc-700">
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm font-medium text-zinc-300 mb-2">
              <span className="flex items-center">
                <Zap size={16} className="mr-1 text-emerald-400" />
                Quote of the Day
              </span>
              <button
                onClick={fetchQuote}
                className="text-zinc-400 hover:text-white transition-all hover:rotate-180 duration-300"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 italic">"{quote}"</p>
          </div>
          
          <div className="flex justify-between text-sm font-medium text-zinc-300 mb-2">
            <span>Daily Progress</span>
            <span className="flex items-center">
              {progress}%
              {progress === 100 && <Trophy size={16} className="ml-1 text-yellow-400" />}
            </span>
          </div>
          <ProgressBar percentage={progress} showAnimation={progress > 80} />
          
          <p className="text-center text-xs text-zinc-500 mt-3">
            {user.email ? user.email.split('@')[0] : 'Demo User'} • {tasks.filter(t => t.completed).length} completed today
          </p>
        </footer>
      </div>

      {/* Edit Task Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        {editingTask && (
          <TaskEditForm 
            task={editingTask} 
            onSave={handleSaveTask}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <AnalyticsDashboard 
          tasks={tasks} 
          onClose={() => setShowAnalytics(false)} 
        />
      )}

      {/* Undo Toast */}
      <UndoToast
        show={showUndoToast}
        onUndo={handleUndo}
        onDismiss={() => setShowUndoToast(false)}
        message={undoMessage}
      />
      <GoalTracker 
        isOpen={showGoalTracker}
        onClose={() => setShowGoalTracker(false)}
        goals={goals}
        setGoals={setGoals}
      />
    </div>
  );
};

export default App;