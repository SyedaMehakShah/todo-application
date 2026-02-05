import React, { useState } from 'react';
import { api } from '../services/api';

const TaskForm = ({ onTaskAdded, tasks = [], onTaskUpdated, onTaskDeleted, onTaskStatusChange, ...restProps }) => {
  const [taskText, setTaskText] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Low');
  const [dueDate, setDueDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingCategory, setEditingCategory] = useState('General');
  const [editingPriority, setEditingPriority] = useState('Low');
  const [editingDueDate, setEditingDueDate] = useState('');

  const categories = ['Design', 'Development', 'Planning', 'General'];
  const priorities = ['High', 'Medium', 'Low'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!taskText.trim()) {
      alert('Please enter a task description');
      return;
    }

    try {
      const newTask = await api.tasks.create({
        title: taskText,
        category: category,
        priority: priority,
        due_date: dueDate
      });

      if (onTaskAdded && typeof onTaskAdded === 'function') {
        onTaskAdded({
          id: newTask.id,
          text: newTask.title,
          completed: newTask.completed,
          category: newTask.category || category,
          priority: newTask.priority || priority,
          date: newTask.due_date || dueDate
        });
      } else {
        console.error('onTaskAdded is not a function');
      }

      // Reset form
      setTaskText('');
      setCategory('General');
      setPriority('Low');
      setDueDate('');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleUpdate = async (taskId) => {
    try {
      const updatedTask = await api.tasks.update(taskId, {
        title: editingText,
        category: editingCategory,
        priority: editingPriority,
        due_date: editingDueDate
      });

      if (onTaskUpdated && typeof onTaskUpdated === 'function') {
        onTaskUpdated({
          id: updatedTask.id,
          text: updatedTask.title,
          completed: updatedTask.completed,
          category: updatedTask.category || editingCategory,
          priority: updatedTask.priority || editingPriority,
          date: updatedTask.due_date || editingDueDate
        });
      } else {
        console.error('onTaskUpdated is not a function');
      }

      setEditingTaskId(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.tasks.delete(taskId);
        if (onTaskDeleted && typeof onTaskDeleted === 'function') {
          onTaskDeleted(taskId);
        } else {
          console.error('onTaskDeleted is not a function');
        }
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleStatusChange = async (taskId, completed) => {
    try {
      const updatedTask = await api.tasks.toggleCompletion(taskId, {
        completed: !completed
      });

      if (onTaskStatusChange && typeof onTaskStatusChange === 'function') {
        onTaskStatusChange({
          id: updatedTask.id,
          text: updatedTask.title,
          completed: updatedTask.completed,
          category: updatedTask.category,
          priority: updatedTask.priority,
          date: updatedTask.due_date
        });
      } else {
        console.error('onTaskStatusChange is not a function');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
    setEditingCategory(task.category);
    setEditingPriority(task.priority);
    setEditingDueDate(task.date);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Add Task Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Task</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-2">Task Description *</label>
            <input
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What needs to be done?"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorities.map(pri => (
                <option key={pri} value={pri}>{pri}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Tasks</h2>
        
        {tasks.length === 0 ? (
          <p className="text-gray-600">No tasks found. Add a task to get started!</p>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`p-4 rounded-lg shadow-md ${
                  task.completed 
                    ? 'bg-green-100 border-l-4 border-green-500' 
                    : 'bg-white border-l-4 border-blue-500'
                }`}
              >
                {editingTaskId === task.id ? (
                  // Edit Mode
                  <div className="mb-4">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <select
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      
                      <select
                        value={editingPriority}
                        onChange={(e) => setEditingPriority(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {priorities.map(pri => (
                          <option key={pri} value={pri}>{pri}</option>
                        ))}
                      </select>
                      
                      <input
                        type="date"
                        value={editingDueDate}
                        onChange={(e) => setEditingDueDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdate(task.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleStatusChange(task.id, task.completed)}
                        className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {task.text}
                        </p>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <span className="mr-3">Category: {task.category}</span>
                          <span className="mr-3">Priority: {task.priority}</span>
                          {task.date && <span>Due: {new Date(task.date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(task)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status Summary */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">Task Summary:</h3>
        <p>Total: {tasks.length} | Active: {tasks.filter(t => !t.completed).length} | Completed: {tasks.filter(t => t.completed).length}</p>
      </div>
    </div>
  );
};

export default TaskForm;