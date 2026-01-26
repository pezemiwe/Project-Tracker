import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Objective {
  id: string;
  sn: number;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  states: string[];
  regions: string[];
  tags: string[];
  overallStartYear: number;
  overallEndYear: number;
  status: string;
  computedEstimatedSpendUsd: number;
  activityCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectiveDetail extends Objective {
  activities: {
    id: string;
    sn: number;
    title: string;
    status: string;
    startDate: string;
    endDate: string;
    lead: string;
    estimatedSpendUsdTotal: number;
  }[];
}

export interface CreateObjectiveData {
  title: string;
  shortDescription?: string;
  longDescription?: string;
  states?: string[];
  tags?: string[];
  overallStartYear: number;
  overallEndYear: number;
  status?: string;
}

export interface UpdateObjectiveData {
  title?: string;
  shortDescription?: string;
  longDescription?: string;
  states?: string[];
  tags?: string[];
  overallStartYear?: number;
  overallEndYear?: number;
  status?: string;
}

export interface ObjectivesListResponse {
  objectives: Objective[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useObjectives(filters?: {
  status?: string;
  region?: string;
  state?: string;
  startYear?: number;
  endYear?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['objectives', filters],
    queryFn: async (): Promise<ObjectivesListResponse> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.region) params.append('region', filters.region);
      if (filters?.state) params.append('state', filters.state);
      if (filters?.startYear) params.append('startYear', String(filters.startYear));
      if (filters?.endYear) params.append('endYear', String(filters.endYear));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get<ObjectivesListResponse>(`/objectives?${params.toString()}`);
      return response.data;
    },
  });
}

export function useObjective(objectiveId: string) {
  return useQuery({
    queryKey: ['objectives', objectiveId],
    queryFn: async (): Promise<ObjectiveDetail> => {
      const response = await api.get<ObjectiveDetail>(`/objectives/${objectiveId}`);
      return response.data;
    },
    enabled: !!objectiveId,
  });
}

export function useCreateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateObjectiveData): Promise<Objective> => {
      const response = await api.post<Objective>('/objectives', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}

export function useUpdateObjective(objectiveId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateObjectiveData): Promise<Objective> => {
      const response = await api.put<Objective>(`/objectives/${objectiveId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      queryClient.invalidateQueries({ queryKey: ['objectives', objectiveId] });
    },
  });
}

export function useDeleteObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (objectiveId: string): Promise<void> => {
      await api.delete(`/objectives/${objectiveId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}

export interface ObjectiveAggregates {
  objectiveId: string;
  objectiveTitle: string;
  perYearEstimates: Record<string, number>;
}

export function useObjectiveAggregates(objectiveId: string) {
  return useQuery({
    queryKey: ['objectives', objectiveId, 'aggregates'],
    queryFn: async (): Promise<ObjectiveAggregates> => {
      const response = await api.get<ObjectiveAggregates>(`/objectives/${objectiveId}/aggregates`);
      return response.data;
    },
    enabled: !!objectiveId,
  });
}
