import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

interface AuditLog {
  id: string;
  timestamp: string;
  actor: { fullName: string; email: string } | null;
  actorRole: string | null;
  action: string;
  objectType: string;
  objectId: string;
  previousValues: any;
  newValues: any;
  comment?: string;
  ipAddress?: string;
}

interface AuditFilters {
  objectType?: string;
  objectId?: string;
  actorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface ValueChange {
  timestamp: string;
  actor: string;
  actorRole: string | null;
  previousValue: any;
  newValue: any;
  comment?: string;
  action: string;
}

export interface FeedItem {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  objectType: string;
  objectId: string;
  description: string;
}

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
      const response = await api.get<{
        logs: AuditLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/audit/logs?${params.toString()}`);
      return response.data;
    },
  });
}

export function useValueHistory(
  objectType: string,
  objectId: string,
  field: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["value-history", objectType, objectId, field],
    queryFn: async () => {
      const response = await api.get<ValueChange[]>(
        `/audit/value-history/${objectType}/${objectId}/${field}`
      );
      return response.data;
    },
    enabled: enabled && !!objectType && !!objectId && !!field,
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async (filters: AuditFilters) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
      const response = await api.get(`/audit/export?${params.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useActivityFeed(limit: number = 20) {
  return useQuery({
    queryKey: ["activity-feed", limit],
    queryFn: async () => {
      const response = await api.get<FeedItem[]>(`/audit/feed?limit=${limit}`);
      return response.data;
    },
    refetchInterval: 60000,
  });
}
