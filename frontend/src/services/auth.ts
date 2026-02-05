/**
 * Better Auth configuration for JWT-based authentication.
 * Provides authentication state management and token storage.
 */
import type { User, AuthResponse, LoginRequest, SignupRequest } from '../lib/types';
import { api } from './api';

/**
 * Authentication state interface.
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Better Auth service for managing authentication state.
 */
class BetterAuthService {
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
  };

  /**
   * Initialize auth state from localStorage.
   */
  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Load authentication state from localStorage.
   */
  private loadFromStorage(): void {
    try {
      const token = this.getTokenFromStorage();
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        this.state = {
          user,
          token,
          isAuthenticated: true,
        };
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Save authentication state to localStorage.
   */
  private saveToStorage(user: User, token: string): void {
    try {
      // Store token with additional security measures
      const tokenData = {
        token,
        timestamp: Date.now(),
        // Add basic integrity check
        hash: this.generateHash(token)
      };

      localStorage.setItem('auth_token', JSON.stringify(tokenData));
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save auth state to storage:', error);
    }
  }

  /**
   * Generate a simple hash for token integrity check (not cryptographically secure).
   */
  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Verify token integrity.
   */
  private verifyTokenIntegrity(storedToken: string, storedHash: string): boolean {
    const computedHash = this.generateHash(storedToken);
    return computedHash === storedHash;
  }

  /**
   * Get token from storage with integrity check.
   */
  private getTokenFromStorage(): string | null {
    try {
      const tokenStr = localStorage.getItem('auth_token');
      if (!tokenStr) return null;

      const tokenData = JSON.parse(tokenStr);
      if (!this.verifyTokenIntegrity(tokenData.token, tokenData.hash)) {
        console.error('Token integrity check failed');
        this.clearStorage();
        return null;
      }

      // Check if token is too old (more than 30 days)
      const age = Date.now() - tokenData.timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) { // 30 days in milliseconds
        console.warn('Stored token is too old, clearing');
        this.clearStorage();
        return null;
      }

      return tokenData.token;
    } catch (error) {
      console.error('Failed to get token from storage:', error);
      return null;
    }
  }

  /**
   * Clear authentication state from localStorage.
   */
  private clearStorage(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  /**
   * Get current authentication state.
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get current user.
   */
  getUser(): User | null {
    return this.state.user;
  }

  /**
   * Get current token.
   */
  getToken(): string | null {
    return this.state.token;
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Sign up a new user.
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await api.auth.signup(data);

      // Update state and storage
      this.state = {
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      };
      this.saveToStorage(response.user, response.token);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in an existing user.
   */
  async signin(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.auth.signin(data);

      // Update state and storage
      this.state = {
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      };
      this.saveToStorage(response.user, response.token);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out the current user.
   */
  async signout(): Promise<void> {
    // Clear state and storage
    this.state = {
      user: null,
      token: null,
      isAuthenticated: false,
    };
    this.clearStorage();

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Refresh JWT token.
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await api.auth.refresh();
      const newToken = response.token;

      // Update token in state and storage
      this.state.token = newToken;
      if (this.state.user) {
        this.saveToStorage(this.state.user, newToken);
      }

      return newToken;
    } catch (error) {
      // If refresh fails, sign out
      await this.signout();
      throw error;
    }
  }

  /**
   * Get current user profile from API.
   */
  async getCurrentUser(): Promise<User> {
    try {
      const user = await api.auth.me();

      // Update user in state and storage
      this.state.user = user;
      if (this.state.token) {
        this.saveToStorage(user, this.state.token);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const auth = new BetterAuthService();

// Export class for testing
export { BetterAuthService };
