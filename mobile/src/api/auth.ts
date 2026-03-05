import {apiClient, setTokens} from './client';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  technician_id: string;
  email: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/auth/login', {email, password});
  setTokens(res.data.access_token, res.data.refresh_token);
  return res.data;
};
