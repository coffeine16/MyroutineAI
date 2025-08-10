import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { collection, doc, getDocs, writeBatch, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
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
    // This single listener handles all auth states:
    // 1. App loads with a user already logged in.
    // 2. A new user logs in.
    // 3. The user logs out.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // If a user is found (either from a new login or a saved session),
        // save them to localStorage and initialize their data.
        localStorage.setItem('dailyGrindUser', JSON.stringify(user));
        setUser(user);
        initializeUserData(user.uid);
      } else {
        // If no user is found (user logged out),
        // clear localStorage and the user state.
        localStorage.removeItem('dailyGrindUser');
        setUser(null);
      }
      // Set loading to false after we've determined the auth state.
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []); // The empty array ensures this effect runs only once on mount

  const initializeUserData = async (userId) => {
    const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
    const querySnapshot = await getDocs(tasksCollectionRef);

    if (querySnapshot.empty) {
      console.log("New user detected. Starting with a blank schedule.");
      setTasks([]);
      setSavedNormalTasks([]);
    } else {
      console.log("Returning user, loading tasks from database...");
      const dbTasks = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      // This is the key fix for your refresh problem:
      // Ensure both state variables are updated when loading a returning user.
      setTasks(dbTasks);
      setSavedNormalTasks(dbTasks);
    }

    setStreak(Math.floor(Math.random() * 15) + 1); 
  };

  // NEW function to handle successful authentication
  const handleAuthSuccess = (user) => {
    localStorage.setItem('dailyGrindUser', JSON.stringify(user)); // Save user to localStorage
    setUser(user);
    initializeUserData(user.uid);
  };

  const handleExamModeToggle = async (isExamMode) => {
    setExamMode(isExamMode);
  
    if (isExamMode) {
      // --- TURNING EXAM MODE ON ---
      // 1. Save the current normal tasks to a temporary state
      setSavedNormalTasks(tasks);
      setTasks([]); // Show a blank/loading state immediately

      // 2. Check Firestore for a saved exam schedule for this user
      const examTasksCollectionRef = collection(db, 'users', user.uid, 'examTasks');
      const querySnapshot = await getDocs(examTasksCollectionRef);

      if (querySnapshot.empty) {
        // First time in exam mode: give a blank slate
        console.log("First time in Exam Mode. Starting with a blank schedule.");
        setTasks([]); 
      } else {
        // Returning to exam mode: load the saved schedule
        console.log("Loading saved exam schedule from database...");
        const dbTasks = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setTasks(dbTasks);
      }
    } else {
      // --- TURNING EXAM MODE OFF ---
      // Restore the normal task list from the temporary state
      const batch = writeBatch(db);
      tasks.forEach(task => {
        const taskRef = doc(db, 'users', user.uid, 'examTasks', task.id);
        batch.set(taskRef, task);
      });
      await batch.commit();
      console.log("Exam tasks saved to database.");
      setTasks(savedNormalTasks);
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
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const matchesSearch = task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (task.time && task.time.includes(searchTerm));

        if (filter === 'completed') return matchesSearch && task.completed;
        if (filter === 'pending') return matchesSearch && !task.completed;
        return matchesSearch;
      })
      .sort((a, b) => {
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return 0; // Keep original order if time is missing
      });
  }, [tasks, searchTerm, filter]);

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
    // This line makes the function "mode-aware"
    const collectionName = examMode ? 'examTasks' : 'tasks';

    // 1. Optimistically update the UI for a snappy user experience
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ));

    // 2. Save the change to the correct Firestore collection
    try {
      const taskRef = doc(db, 'users', user.uid, collectionName, taskId);
      
      await updateDoc(taskRef, {
        completed: completed
      });

    } catch (error) {
      console.error(`Error updating task in ${collectionName}: `, error);
      // Revert the UI change if the database update fails
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ));
      alert("Failed to update task. Please check your connection.");
    }
  };

  const handleTaskEdit = useCallback((task) => {
    setEditingTask(task);
    setShowEditModal(true);
  }, []);

  const handleTaskDelete = async (taskId) => {
    const collectionName = examMode ? 'examTasks' : 'tasks';

    // Remove the task from the local state immediately for a fast UI response
    setTasks(prev => prev.filter(task => task.id !== taskId));

    // Delete the task from the Firestore database in the background
    try {
      const taskRef = doc(db, 'users', user.uid, collectionName, taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error(`Error deleting task from ${collectionName}: `, error);
      // Optional: add logic here to restore the task to the UI if the delete fails
    }
  };

  const handleSaveTask = async (updatedTask) => {
    const collectionName = examMode ? 'examTasks' : 'tasks';
    const taskExists = tasks.some(task => task.id === updatedTask.id);

    // Save to the database first
    try {
      const taskRef = doc(db, 'users', user.uid, collectionName, updatedTask.id);
      await setDoc(taskRef, updatedTask, { merge: true });
    } catch (error) {
      console.error(`Error saving task to ${collectionName}: `, error);
      return; // Stop if the database save fails
    }

    // Then, update the local state to match
    if (taskExists) {
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    } else {
      setTasks(prev => [...prev, updatedTask]);
    }
    
    setShowEditModal(false);
    setEditingTask(null);
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