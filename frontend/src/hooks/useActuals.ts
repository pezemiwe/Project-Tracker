import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface Actual {
  id: string;
  activityId: string;
  entryDate: string;
  amountUsd: number;
  category: string;
  description?: string;
  createdBy: {
    id: string;
    fullName: string;
  };
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  virusScanStatus: string;
  uploadedAt: string;
}

export interface CreateActualData {
  activityId: string;
  entryDate: string;
  amountUsd: number;
  category: string;
  description?: string;
}

export interface UpdateActualData {
  entryDate?: string;
  amountUsd?: number;
  category?: string;
  description?: string;
}

export function useActuals(activityId: string) {
  return useQuery({
    queryKey: ["actuals", activityId],
    queryFn: async (): Promise<Actual[]> => {
      const response = await api.get<Actual[]>(
        `/actuals?activityId=${activityId}`,
      );
      return response.data;
    },
    enabled: !!activityId,
  });
}

export function useCreateActual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateActualData): Promise<Actual> => {
      const response = await api.post<Actual>("/actuals", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["actuals", variables.activityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.activityId],
      });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateActual(actualId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateActualData): Promise<Actual> => {
      const response = await api.patch<Actual>(`/actuals/${actualId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["actuals", data.activityId] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data.activityId],
      });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteActual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actualId,
      activityId: _activityId,
    }: {
      actualId: string;
      activityId: string;
    }): Promise<void> => {
      await api.delete(`/actuals/${actualId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["actuals", variables.activityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.activityId],
      });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actualId,
      file,
    }: {
      actualId: string;
      file: File;
    }): Promise<Attachment> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("actualId", actualId);

      const response = await api.post<Attachment>("/attachments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actuals"] });
    },
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async (attachmentId: string): Promise<string> => {
      const response = await api.get<{ url: string }>(
        `/attachments/${attachmentId}/download`,
      );
      return response.data.url;
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string): Promise<void> => {
      await api.delete(`/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actuals"] });
    },
  });
}
