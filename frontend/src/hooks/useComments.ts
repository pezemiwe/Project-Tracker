import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Comment {
  id: string;
  activityId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface CreateCommentData {
  activityId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export function useComments(activityId: string) {
  return useQuery({
    queryKey: ['comments', activityId],
    queryFn: async (): Promise<Comment[]> => {
      const response = await api.get<Comment[]>(`/comments/activity/${activityId}`);
      return response.data;
    },
    enabled: !!activityId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentData): Promise<Comment> => {
      const response = await api.post<Comment>('/comments', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.activityId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCommentData; activityId: string }): Promise<Comment> => {
      const response = await api.put<Comment>(`/comments/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.activityId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; activityId: string }): Promise<void> => {
      await api.delete(`/comments/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.activityId] });
    },
  });
}
