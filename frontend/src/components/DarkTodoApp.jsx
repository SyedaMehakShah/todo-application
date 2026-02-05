import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const DarkTodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.tasks.list();
      setTasks(response.tasks.map(task => ({
        id: task.id,
        text: task.title,
        completed: task.completed,
        category: task.category || 'General',
        priority: task.priority || 'Low',
        date: task.due_date || ''
      })));
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Using sample data.');
      // Sample tasks if API fails
      setTasks([
        { id: 1, text: 'Sample task 1', completed: false, category: 'General', priority: 'Low', date: '' },
        { id: 2, text: 'Sample task 2', completed: true, category: 'Work', priority: 'High', date: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.trim()) {
      alert('Please enter a task');
      return;
    }

    try {
      const newTaskObj = await api.tasks.create({
        title: newTask.trim(),
        category: 'General',
        priority: 'Low'
      });

      const taskToAdd = {
        id: newTaskObj.id,
        text: newTaskObj.title,
        completed: newTaskObj.completed,
        category: newTaskObj.category || 'General',
        priority: newTaskObj.priority || 'Low',
        date: newTaskObj.due_date || ''
      };

      setTasks(prev => [taskToAdd, ...prev]);
      setNewTask('');
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Failed to add task. Please try again.');
    }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.tasks.delete(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const updateTask = async (taskId, newText) => {
    if (!newText.trim()) {
      alert('Task cannot be empty');
      return;
    }

    try {
      const updatedTask = await api.tasks.update(taskId, {
        title: newText.trim()
      });

      setTasks(prev => prev.map(task =>
        task.id === taskId ? {
          ...task,
          text: updatedTask.title,
          completed: updatedTask.completed,
          category: updatedTask.category,
          priority: updatedTask.priority,
          date: updatedTask.due_date
        } : task
      ));
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task. Please try again.');
    }
  };

  const toggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const updatedTask = await api.tasks.toggleCompletion(taskId, {
        completed: !task.completed
      });

      setTasks(prev => prev.map(task =>
        task.id === taskId ? {
          ...task,
          completed: updatedTask.completed
        } : task
      ));
    } catch (err) {
      console.error('Error toggling task:', err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const editTask = (taskId, currentText) => {
    const newText = prompt('Edit task:', currentText);
    if (newText !== null) {
      updateTask(taskId, newText);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff]"></div>
        <span className="ml-3 text-[#e0e0e0]">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 m-9">
      <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 transition-all duration-300">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#eee] mb-6 text-center">
          📝 My Todo App
        </h1>
        
        {error && (
          <div className="bg-[#ff4757]/20 border border-[#ff4757]/50 text-[#ff4757] px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Add Task Form */}
        <form onSubmit={addTask} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter a new task..."
              className="flex-grow bg-[#2a2a40] text-[#e0e0e0] rounded-xl px-4 py-3 border-2 border-[#3a3a5a] focus:border-[#00d4ff] focus:outline-none transition-all duration-300 placeholder:text-[#888]"
            />
            <button
              type="submit"
              className="bg-[#00d4ff] hover:bg-[#1ad9ff] text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-98 transition-all duration-300 cursor-pointer"
            >
              ➕
            </button>
          </div>
        </form>

        {/* Task List */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-[#eee]">
            Your Tasks ({tasks.length})
          </h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8 bg-[#2a2a40]/50 rounded-xl border border-[#3a3a5a]/50">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-[#888]">No tasks yet. Add a task to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`bg-[#2a2a40] text-[#e0e0e0] p-4 rounded-xl mb-3 transition-all duration-300 hover:bg-[#333350] ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between m-2">
                    <div className="flex items-center space-x-3 flex-1 m-4 p-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleComplete(task.id)}
                        className="w-5 h-5 text-[#00d4ff] bg-[#2a2a40] border-[#3a3a5a] rounded focus:ring-[#00d4ff] focus:ring-2 cursor-pointer"
                      />
                      <span className={`${task.completed ? 'line-through' : ''} flex-1`}>
                        {task.text}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editTask(task.id, task.text)}
                        className="bg-[#6c63ff] hover:bg-[#7d75ff] text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-[#ff4757] hover:bg-[#ff5e6a] text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 mt-6">
          <div className="bg-[#2a2a40]/50 p-3 rounded-xl text-center">
            <h3 className="text-xs text-[#888] mb-1">Total</h3>
            <p className="text-lg font-bold text-[#00d4ff]">{tasks.length}</p>
          </div>
          <div className="bg-[#2a2a40]/50 p-3 rounded-xl text-center">
            <h3 className="text-xs text-[#888] mb-1">Active</h3>
            <p className="text-lg font-bold text-[#6c63ff]">{tasks.filter(t => !t.completed).length}</p>
          </div>
          <div className="bg-[#2a2a40]/50 p-3 rounded-xl text-center">
            <h3 className="text-xs text-[#888] mb-1">Done</h3>
            <p className="text-lg font-bold text-[#ff6b6b]">{tasks.filter(t => t.completed).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DarkTodoApp;