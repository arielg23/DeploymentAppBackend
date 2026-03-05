import {create} from 'zustand';
import {clearTokens, loadTokensFromStorage, setTokens} from '../api/client';
import {login as apiLogin} from '../api/auth';

interface AuthState {
  isAuthenticated: boolean;
  technicianId: string | null;
  email: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  technicianId: null,
  email: null,
  isLoading: false,

  login: async (email, password) => {
    set({isLoading: true});
    try {
      const data = await apiLogin(email, password);
      set({isAuthenticated: true, technicianId: data.technician_id, email: data.email, isLoading: false});
    } catch (error) {
      set({isLoading: false});
      throw error;
    }
  },

  logout: () => {
    clearTokens();
    set({isAuthenticated: false, technicianId: null, email: null});
  },

  restoreSession: async () => {
    const restored = await loadTokensFromStorage();
    if (restored) {
      set({isAuthenticated: true});
    }
    return restored;
  },
}));
