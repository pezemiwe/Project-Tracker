import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore, User } from '../stores/authStore';
import { useNavigate } from '@tanstack/react-router';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate({ to: '/' });
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      clearAuth();
      navigate({ to: '/login' });
    },
    onError: () => {
      // Clear auth even if API call fails
      clearAuth();
      navigate({ to: '/login' });
    },
  });
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return {
    user,
    isAuthenticated,
  };
}
