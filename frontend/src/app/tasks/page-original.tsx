/**
 * Task list page.
 * Displays all tasks for the authenticated user with filtering and creation capabilities.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../services/auth';
import { api } from '../../services/api';
import { Task } from '../../lib/types';
import TodoApp from '../../components/TodoApp';

export default function TasksPage() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen">
      <TodoApp />
    </div>
  );
}
