'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../services/auth';
import { api } from '../../services/api';
import TaskForm from '../../components/TaskForm';

export default function NewTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.tasks.list();
      setTasks(response.tasks.map(task => ({
        id: task.id,
        text: task.title,
        completed: task.completed,
        category: task.category || 'General',
        priority: task.priority || 'Low',
        date: task.due_date || ''
      })));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      // Initialize with sample tasks if API call fails
      setTasks([
        {
          id: 1,
          text: 'Complete project proposal',
          completed: false,
          category: 'Planning',
          priority: 'High',
          date: '2024-01-15'
        },
        {
          id: 2,
          text: 'Review design mockups',
          completed: true,
          category: 'Design',
          priority: 'Medium',
          date: '2024-01-12'
        },
        {
          id: 3,
          text: 'Fix login bug',
          completed: false,
          category: 'Development',
          priority: 'High',
          date: '2024-01-20'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAdded = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleTaskStatusChange = (updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto"></div>
          <p className="text-[#B0B0B0] mt-4">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
          TaskFlow Manager
        </h1>
        
        <TaskForm
          tasks={tasks}
          onTaskAdded={handleTaskAdded}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          onTaskStatusChange={handleTaskStatusChange}
        />
      </div>
    </div>
  );
}