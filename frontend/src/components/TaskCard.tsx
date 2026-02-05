/**
 * TaskCard component.
 * Displays a task with title, description, completion checkbox, and actions.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '../lib/types';
import { formatDateTime, truncate } from '../lib/utils';
import { api } from '../services/api';
import { useToast } from './ToastProvider';
import { Edit, Trash2, Calendar } from 'lucide-react';

export interface TaskCardProps {
  task: Task;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleComplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setIsToggling(true);

    try {
      const updatedTask = await api.tasks.toggleCompletion(task.id, { completed: e.target.checked });
      onUpdate?.(updatedTask);

      // Show success notification
      const status = e.target.checked ? 'completed' : 'marked as incomplete';
      showToast(`Task ${status}`, 'success');
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      // Revert checkbox on error
      e.target.checked = !e.target.checked;
      // Show error notification
      showToast('Failed to update task completion. Please try again.', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.tasks.delete(task.id);
      onDelete?.(task.id);
      // Show success notification
      showToast('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Show error notification
      showToast('Failed to delete task. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetails = () => {
    router.push(`/tasks/${task.id}`);
  };

  // Determine priority color and glow
  const getPriorityClasses = () => {
    switch(task.title.toLowerCase().includes('high') ? 'high' :
           task.title.toLowerCase().includes('medium') ? 'medium' :
           task.title.toLowerCase().includes('low') ? 'low' : 'medium') {
      case 'high':
        return { dotClass: 'priority-high', text: 'High' };
      case 'medium':
        return { dotClass: 'priority-medium', text: 'Medium' };
      case 'low':
        return { dotClass: 'priority-low', text: 'Low' };
      default:
        return { dotClass: 'priority-medium', text: 'Medium' };
    }
  };

  const priority = getPriorityClasses();

  // Determine category icon
  const getCategoryIcon = () => {
    if (task.title.toLowerCase().includes('design')) return '🎨';
    if (task.title.toLowerCase().includes('develop') || task.title.toLowerCase().includes('code')) return '💻';
    if (task.title.toLowerCase().includes('plan')) return '📅';
    return '📝';
  };

  const categoryIcon = getCategoryIcon();

  return (
    <div
      className={`glass-card p-6 rounded-2xl slide-hover ${task.completed ? 'task-completed' : ''}`}
      onClick={handleViewDetails}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggleComplete}
            disabled={isToggling}
            className="task-checkbox"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tasks/${task.id}`);
            }}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>

      <h3
        className={`text-xl font-bold mb-2 task-title ${
          task.completed ? 'line-through text-gray-500' : 'text-white'
        }`}
      >
        {task.title}
      </h3>

      {task.description && (
        <p className={`mb-4 task-desc ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
          {truncate(task.description, 150)}
        </p>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{categoryIcon}</span>
          <span className="px-3 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
            {task.title.toLowerCase().includes('design') ? 'Design' :
             task.title.toLowerCase().includes('develop') ? 'Development' :
             task.title.toLowerCase().includes('plan') ? 'Planning' : 'General'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`priority-dot ${priority.dotClass}`}></span>
          <span className="text-xs text-gray-400">{priority.text}</span>
        </div>
      </div>

      <div className="flex items-center mt-4 text-gray-400 text-sm">
        <Calendar className="h-4 w-4 mr-2" />
        <span>{formatDateTime(task.created_at)}</span>
      </div>
    </div>
  );
}
