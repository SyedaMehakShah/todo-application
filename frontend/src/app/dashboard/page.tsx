/**
 * Dashboard page.
 * Protected route that displays user dashboard after authentication.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../services/auth';
import type { User } from '../../lib/types';
import { Sun, Moon } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        if (!auth.isAuthenticated()) {
          router.push('/login');
          return;
        }

        const currentUser = auth.getUser();
        setUser(currentUser);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await auth.signout();
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="glass-card rounded-b-3xl p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold gradient-text">TaskFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:scale-110 transition-transform"
              >
                {theme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon className="text-blue-500" />}
              </button>
              <span className="text-sm text-gray-300">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="glass-card p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to your Dashboard
            </h2>
            <p className="text-gray-400 mb-6">
              You are successfully authenticated!
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                <strong className="text-white">Email:</strong> {user?.email}
              </p>
              <p className="text-sm text-gray-300">
                <strong className="text-white">Email Verified:</strong>{' '}
                {user?.email_verified ? (
                  <span className="text-green-400">Yes</span>
                ) : (
                  <span className="text-orange-400">No</span>
                )}
              </p>
            </div>
            <div className="mt-8">
              <a
                href="/tasks"
                className="btn-primary inline-flex items-center px-6 py-3 text-base font-medium rounded-lg"
              >
                View Tasks
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
