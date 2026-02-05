/**
 * API client for making HTTP requests to the backend.
 * Automatically attaches JWT token from localStorage to all authenticated requests.
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Task,
  AuthResponse,
  ApiError,
  LoginRequest,
  SignupRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  ToggleTaskCompletionRequest,
  TaskListResponse,
} from '../lib/types';

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Axios instance with default configuration.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

/**
 * Request interceptor to attach JWT token to all requests.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage with integrity check
    const token = localStorage.getItem('auth_token');

    if (token) {
      try {
        // Parse and verify the token integrity
        const tokenData = JSON.parse(token);
        if (typeof tokenData === 'object' && tokenData.token) {
          // Verify token integrity
          const computedHash = (() => {
            let hash = 0;
            for (let i = 0; i < tokenData.token.length; i++) {
              const char = tokenData.token.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash |= 0; // Convert to 32bit integer
            }
            return hash.toString();
          })();

          if (computedHash === tokenData.hash) {
            // Check if token is too old (more than 30 days)
            const age = Date.now() - tokenData.timestamp;
            if (age <= 30 * 24 * 60 * 60 * 1000) { // 30 days in milliseconds
              if (config.headers) {
                config.headers.Authorization = `Bearer ${tokenData.token}`;
              }
            } else {
              // Token is too old, remove it
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
            }
          } else {
            // Token integrity failed, remove it
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
          }
        } else if (typeof token === 'string') {
          // Legacy token format (just the token string)
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (e) {
        // If parsing fails, try as legacy token
        if (typeof token === 'string') {
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } else {
          // Invalid token format, remove it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle errors globally.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Return structured error
    const apiError: ApiError = error.response?.data || {
      error: 'Network Error',
      detail: error.message || 'An unexpected error occurred',
    };

    return Promise.reject(apiError);
  }
);

/**
 * API client methods for authentication and task management.
 */
export const api = {
  /**
   * Authentication endpoints
   */
  auth: {
    /**
     * Sign up a new user.
     */
    signup: async (data: SignupRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>('/auth/signup', data);
      return response.data;
    },

    /**
     * Sign in an existing user.
     */
    signin: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>('/auth/signin', data);
      return response.data;
    },

    /**
     * Refresh JWT token.
     */
    refresh: async (): Promise<{ token: string }> => {
      const response = await apiClient.post<{ token: string }>('/auth/refresh');
      return response.data;
    },

    /**
     * Get current user profile.
     */
    me: async (): Promise<User> => {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    },
  },

  /**
   * Task endpoints
   */
  tasks: {
    /**
     * Get all tasks for authenticated user.
     */
    list: async (completed?: boolean): Promise<TaskListResponse> => {
      const params = completed !== undefined ? { completed } : {};
      const response = await apiClient.get<TaskListResponse>('/tasks', { params });
      return response.data;
    },

    /**
     * Get a single task by ID.
     */
    get: async (taskId: string): Promise<Task> => {
      const response = await apiClient.get<Task>(`/tasks/${taskId}`);
      return response.data;
    },

    /**
     * Create a new task.
     */
    create: async (data: CreateTaskRequest): Promise<Task> => {
      const response = await apiClient.post<Task>('/tasks', data);
      return response.data;
    },

    /**
     * Update an existing task.
     */
    update: async (taskId: string, data: UpdateTaskRequest): Promise<Task> => {
      const response = await apiClient.put<Task>(`/tasks/${taskId}`, data);
      return response.data;
    },

    /**
     * Delete a task.
     */
    delete: async (taskId: string): Promise<void> => {
      await apiClient.delete(`/tasks/${taskId}`);
    },

    /**
     * Toggle task completion status.
     */
    toggleCompletion: async (
      taskId: string,
      data: ToggleTaskCompletionRequest
    ): Promise<Task> => {
      const response = await apiClient.patch<Task>(`/tasks/${taskId}/complete`, data);
      return response.data;
    },
  },
};

export default api;
