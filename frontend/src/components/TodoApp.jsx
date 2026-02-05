import React, { useState, useEffect } from 'react';

// Simple task API using localStorage
const taskApi = {
  list: async () => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    return { tasks };
  },
  create: async (taskData) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title,
      completed: false,
      category: taskData.category || 'General',
      priority: taskData.priority || 'Low',
      due_date: taskData.due_date || null,
      created_at: new Date().toISOString()
    };
    
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.unshift(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    return newTask;
  },
  update: async (id, taskData) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
      localStorage.setItem('tasks', JSON.stringify(tasks));
      return tasks[taskIndex];
    }
    throw new Error('Task not found');
  },
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const filteredTasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
    return { success: true };
  },
  toggleCompletion: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = !tasks[taskIndex].completed;
      localStorage.setItem('tasks', JSON.stringify(tasks));
      return tasks[taskIndex];
    }
    throw new Error('Task not found');
  }
};

const TodoApp = () => {
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
      const response = await taskApi.list();
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
        { id: '1', text: 'Complete project proposal', completed: false, category: 'Planning', priority: 'High', date: '2024-01-15' },
        { id: '2', text: 'Review design mockups', completed: true, category: 'Design', priority: 'Medium', date: '2024-01-12' },
        { id: '3', text: 'Fix login bug', completed: false, category: 'Development', priority: 'High', date: '2024-01-20' }
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
      const newTaskObj = await taskApi.create({
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
        await taskApi.delete(taskId);
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
      const updatedTask = await taskApi.update(taskId, {
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
      const updatedTask = await taskApi.toggleCompletion(taskId);

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
    if (newText !== null && newText.trim() !== '') {
      updateTask(taskId, newText.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">My Todo App</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-200">
        <div className="flex">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter a new task..."
            className="flex-grow px-6 py-3 border-2 border-gray-200 rounded-l-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg transition-all duration-200"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-r-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            + Add Task
          </button>
        </div>
      </form>

      {/* Task List */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Your Tasks ({tasks.length})
        </h2>

        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">No tasks yet. Add a task to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`p-5 rounded-2xl shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-xl ${
                  task.completed
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500'
                    : 'bg-gradient-to-r from-white to-gray-50 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id)}
                    className="h-6 w-6 text-green-500 rounded-full focus:ring-2 focus:ring-green-300 cursor-pointer"
                  />
                  <span className={`text-lg font-medium ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}>
                    {task.text}
                  </span>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => editTask(task.id, task.text)}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-2xl shadow-md">
          <h3 className="font-bold text-blue-800 text-lg">Total Tasks</h3>
          <p className="text-3xl font-bold text-blue-600">{tasks.length}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-2xl shadow-md">
          <h3 className="font-bold text-yellow-800 text-lg">Active</h3>
          <p className="text-3xl font-bold text-yellow-600">{tasks.filter(t => !t.completed).length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-2xl shadow-md">
          <h3 className="font-bold text-green-800 text-lg">Completed</h3>
          <p className="text-3xl font-bold text-green-600">{tasks.filter(t => t.completed).length}</p>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;