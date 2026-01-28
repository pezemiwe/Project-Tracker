import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface SystemSetting {
  key: string;
  value: any;
  description: string;
  updatedById?: string;
  updatedAt: string;
  updatedBy?: {
    fullName: string;
  };
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await api.get<SystemSetting[]>("/settings");
      return response.data;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      value,
      description,
    }: {
      key: string;
      value: any;
      description?: string;
    }) => {
      const response = await api.put(`/settings/${key}`, {
        value,
        description,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useTestEmail() {
  return useMutation({
    mutationFn: async (testEmail: string) => {
      const response = await api.post("/settings/test-email", { testEmail });
      return response.data;
    },
  });
}

export function useSeedSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/settings/seed");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
