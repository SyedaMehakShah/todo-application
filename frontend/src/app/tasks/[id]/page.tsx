/**
 * Task details page.
 * Displays a single task with full details and edit/delete actions.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '../../../services/auth';
import { api } from '../../../services/api';
import { Task } from '../../../lib/types';
import TaskForm from '../../../components/TaskForm';
import Button from '../../../components/ui/Button';
import { formatDateTime } from '../../../lib/utils';
import { ArrowLeft, Edit, Trash2, Calendar } from 'lucide-react';

export default function TaskDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchTask();
  }, [router, taskId]);

  const fetchTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedTask = await api.tasks.get(taskId);
      setTask(fetchedTask);
    } catch (err: any) {
      console.error('Failed to fetch task:', err);
      setError('Failed to load task. It may not exist or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (data: { title: string; description: string }) => {
    if (!task) return;

    try {
      const updatedTask = await api.tasks.update(task.id, data);
      setTask(updatedTask);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update task:', err);
      throw err; // Let TaskForm handle the error
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.tasks.delete(task.id);
      router.push('/tasks');
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;

    try {
      const updatedTask = await api.tasks.toggleCompletion(task.id, { completed: !task.completed });
      setTask(updatedTask);
    } catch (err: any) {
      console.error('Failed to toggle task completion:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  const handleBack = () => {
    router.push('/tasks');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B]"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen">
        <nav className="glass-card rounded-b-3xl p-6 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold gradient-text">TaskFlow</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card text-center py-12 rounded-2xl">
            <p className="text-red-400 text-lg mb-4">{error || 'Task not found'}</p>
            <Button variant="primary" onClick={handleBack}>
              Back to Tasks
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-card rounded-b-3xl p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold gradient-text">TaskFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/tasks"
                className="text-sm text-gray-300 hover:text-white"
              >
                Tasks
              </a>
              <a
                href="/dashboard"
                className="text-sm text-gray-300 hover:text-white"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </button>
        </div>

        {/* Task Details or Edit Form */}
        <div className="glass-card p-8 rounded-2xl">
          {isEditing ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Edit Task</h2>
              <TaskForm
                task={task}
                onSubmit={handleUpdateTask}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save Changes"
              />
            </>
          ) : (
            <>
              {/* Task Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={handleToggleComplete}
                    className="task-checkbox mt-1"
                  />
                  <div className="flex-1">
                    <h2
                      className={`text-3xl font-bold mb-2 ${
                        task.completed ? 'line-through text-gray-500' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          task.completed
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}
                      >
                        {task.completed ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Description */}
              {task.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
                  <p className="text-gray-400 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Task Metadata */}
              <div className="mb-6 pb-6 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Details</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>
                    <span className="font-medium text-white">Created:</span> {formatDateTime(task.created_at)}
                  </div>
                  {task.updated_at !== task.created_at && (
                    <div>
                      <span className="font-medium text-white">Last Updated:</span> {formatDateTime(task.updated_at)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-white">Task ID:</span> {task.id}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteTask}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
