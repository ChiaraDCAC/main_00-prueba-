import { create } from 'zustand';
import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const token = get().token;
    const response = await axios.put('/api/auth/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updatedUser = response.data.data;
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    set({ user: updatedUser });
    return response.data;
  },

  initAuth: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token) {
      let user = null;
      try { user = userStr ? JSON.parse(userStr) : null; } catch {}
      set({ token, user, isAuthenticated: true });
    }
  },
}));

// Restore session on app load
useAuthStore.getState().initAuth();
