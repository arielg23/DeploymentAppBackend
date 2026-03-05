import axios from 'axios';

import * as Keychain from 'react-native-keychain';

import { API_BASE_URL as BASE_URL } from '../config';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {'Content-Type': 'application/json'},
});

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  Keychain.setGenericPassword('tokens', JSON.stringify({access, refresh}));
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  Keychain.resetGenericPassword();
};

export const loadTokensFromStorage = async (): Promise<boolean> => {
  try {
    const creds = await Keychain.getGenericPassword();
    if (creds) {
      const parsed = JSON.parse(creds.password);
      accessToken = parsed.access;
      refreshToken = parsed.refresh;
      return true;
    }
  } catch {}
  return false;
};

// Request interceptor: add auth header
apiClient.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: refresh token on 401
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {refresh_token: refreshToken});
        accessToken = res.data.access_token;
        await Keychain.setGenericPassword('tokens', JSON.stringify({access: accessToken, refresh: refreshToken}));
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        clearTokens();
        // Navigate to login - handled by auth store listener
      }
    }
    return Promise.reject(error);
  },
);
