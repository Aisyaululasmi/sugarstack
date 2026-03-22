import type { AuthResponse } from '@sugarstack/shared';
import { apiClient } from './http.client';

class AuthRepository {
  async login(email: string, password: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }
}

export const authRepository = new AuthRepository();
