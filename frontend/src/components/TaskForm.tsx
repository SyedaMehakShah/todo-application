/**
 * TaskForm component.
 * Reusable form for creating and editing tasks.
 */
'use client';

import { useState, FormEvent } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { Task } from '../lib/types';
import { sanitizeInput } from '../lib/utils';
import { useToast } from './ToastProvider';

export interface TaskFormProps {
  task?: Task;
  onSubmit: (data: { title: string; description: string }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function TaskForm({
  task,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: TaskFormProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 500) {
      newErrors.title = 'Title must be 500 characters or less';
    }

    if (description && description.length > 10000) {
      newErrors.description = 'Description must be 10,000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: sanitizeInput(title),
        description: sanitizeInput(description || ''),
      });

      // Show success notification
      const action = task ? 'updated' : 'created';
      showToast(`Task successfully ${action}`, 'success');
    } catch (error: any) {
      console.error('Form submission error:', error);
      let errorMessage = 'Failed to save task. Please try again.';

      // Handle different types of errors
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
        setErrors({ title: error.response.data.detail });
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        setErrors({ title: error.response.data.error });
      } else if (error.message) {
        errorMessage = error.message;
        setErrors({ title: error.message });
      }

      // Show error notification
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder="Enter task title"
        required
        maxLength={500}
        disabled={isSubmitting}
      />

      <div className="w-full">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description (optional)"
          maxLength={10000}
          rows={4}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {description.length} / 10,000 characters
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
