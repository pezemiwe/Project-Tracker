import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface LockStatus {
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  expiresAt: string | null;
  lockedByUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface LockInfo {
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
}

export function useActivityLockStatus(activityId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['activity-lock', activityId],
    queryFn: async (): Promise<LockStatus> => {
      const response = await api.get<LockStatus>(`/activities/${activityId}/lock-status`);
      return response.data;
    },
    enabled: enabled && !!activityId,
    refetchInterval: 10000, // Poll every 10 seconds
  });
}

export function useLockActivity(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LockInfo> => {
      const response = await api.post<LockInfo>(`/activities/${activityId}/lock`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-lock', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities', activityId] });
    },
  });
}

export function useUnlockActivity(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post(`/activities/${activityId}/unlock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-lock', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities', activityId] });
    },
  });
}
