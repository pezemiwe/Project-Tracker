import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { UserRole } from '../stores/authStore';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateUserData {
  email: string;
  fullName: string;
  role: UserRole;
  temporaryPassword: string;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UsersListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useUsers(filters?: {
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async (): Promise<UsersListResponse> => {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await api.get<UsersListResponse>(`/users?${params.toString()}`);
      return response.data;
    },
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async (): Promise<User> => {
      const response = await api.get<User>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData): Promise<User> => {
      const response = await api.post<User>('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserData): Promise<User> => {
      const response = await api.put<User>(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    },
  });
}

export function useResetPassword(userId: string) {
  return useMutation({
    mutationFn: async (newPassword: string): Promise<void> => {
      await api.put(`/users/${userId}/reset-password`, { newPassword });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
