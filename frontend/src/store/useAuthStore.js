import { create } from 'zustand';
import axios from 'axios';

// Ensure cookies (JWT) are sent with every request
axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Register a new account
  registerUser: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/auth/register', { name, email, password });
      set({
        user: response.data,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Login existing account
  loginUser: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      set({
        user: response.data,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Logout session
  logoutUser: async () => {
    set({ loading: true });
    try {
      await axios.post('/api/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Logout failed',
        loading: false,
      });
    }
  },

  // Validate active cookie session
  checkAuth: async () => {
    set({ loading: true });
    try {
      const response = await axios.get('/api/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
