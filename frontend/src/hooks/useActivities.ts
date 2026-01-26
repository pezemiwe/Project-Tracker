import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type ActivityStatus = 'Planned' | 'InProgress' | 'OnHold' | 'Completed' | 'Cancelled';

export interface Activity {
  id: string;
  sn: number;
  investmentObjectiveId: string;
  title: string;
  descriptionAndObjective?: string;
  startDate?: string;
  endDate?: string;
  status: ActivityStatus;
  progressPercent: number;
  lead?: string;
  estimatedSpendUsdTotal?: number;
  annualEstimates: Record<string, number>;
  riskRating?: string;
  priority?: string;
  lockedBy?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDetail extends Activity {
  investmentObjective: {
    id: string;
    title: string;
    region?: string;
  };
  lockedByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateActivityData {
  investmentObjectiveId: string;
  title: string;
  descriptionAndObjective?: string;
  startDate?: string;
  endDate?: string;
  status?: ActivityStatus;
  progressPercent?: number;
  lead?: string;
  estimatedSpendUsdTotal?: number;
  riskRating?: string;
  priority?: string;
  annualEstimates?: Record<string, number>;
}

export interface UpdateActivityData {
  title?: string;
  descriptionAndObjective?: string;
  startDate?: string;
  endDate?: string;
  status?: ActivityStatus;
  progressPercent?: number;
  lead?: string;
  estimatedSpendUsdTotal?: number;
  riskRating?: string;
  priority?: string;
  annualEstimates?: Record<string, number>;
}

export interface ActivitiesListResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useActivities(filters?: {
  investmentObjectiveId?: string;
  status?: ActivityStatus;
  lead?: string;
  startYear?: number;
  endYear?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: async (): Promise<ActivitiesListResponse> => {
      const params = new URLSearchParams();
      if (filters?.investmentObjectiveId) params.append('objectiveId', filters.investmentObjectiveId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.lead) params.append('lead', filters.lead);
      if (filters?.startYear) params.append('startYear', String(filters.startYear));
      if (filters?.endYear) params.append('endYear', String(filters.endYear));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get<ActivitiesListResponse>(`/activities?${params.toString()}`);
      return response.data;
    },
  });
}

export function useActivity(activityId: string) {
  return useQuery({
    queryKey: ['activities', activityId],
    queryFn: async (): Promise<ActivityDetail> => {
      const response = await api.get<ActivityDetail>(`/activities/${activityId}`);
      return response.data;
    },
    enabled: !!activityId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateActivityData): Promise<Activity> => {
      const response = await api.post<Activity>('/activities', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}

export function useUpdateActivity(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateActivityData): Promise<Activity> => {
      const response = await api.put<Activity>(`/activities/${activityId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', activityId] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string): Promise<void> => {
      await api.delete(`/activities/${activityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}
