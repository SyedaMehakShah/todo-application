/**
 * TypeScript type definitions for the Todo application.
 * Defines interfaces for User, Task, API responses, and errors.
 */

/**
 * User entity representing an authenticated user account.
 */
export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Task entity representing a todo item belonging to a user.
 */
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  category?: string;
  priority?: string;
  due_date?: string;
}

/**
 * Authentication response containing user data and JWT token.
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * API error response structure.
 */
export interface ApiError {
  error: string;
  detail: string;
}

/**
 * Login request payload.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Signup request payload.
 */
export interface SignupRequest {
  email: string;
  password: string;
}

/**
 * Task creation request payload.
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  due_date?: string;
}

/**
 * Task update request payload.
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  due_date?: string;
}

/**
 * Task completion toggle request payload.
 */
export interface ToggleTaskCompletionRequest {
  completed: boolean;
}

/**
 * Task list response.
 */
export interface TaskListResponse {
  tasks: Task[];
  count: number;
}
