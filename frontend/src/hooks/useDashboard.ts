import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface DashboardKPIs {
  totalEstimated: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  activeActivities: number;
  completedActivities: number;
  plannedActivities: number;
  pendingApprovals: number;
  overBudgetCount: number;
}

interface SpendByYear {
  year: number;
  estimated: number;
  actual: number;
  variance: number;
}

interface VarianceAlert {
  activityId: string;
  activitySn: string;
  activityTitle: string;
  estimated: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

interface GanttActivity {
  id: string;
  sn: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  objectiveTitle: string;
}

export interface SpendAnalysis {
  byRegion: { name: string; estimated: number; actual: number }[];
  byStatus: { name: string; estimated: number; actual: number }[];
  byCategory: { name: string; value: number }[];
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const response = await api.get<DashboardKPIs>("/dashboard/kpis");
      return response.data;
    },
    refetchInterval: 60000,
  });
}

export function useSpendByYear() {
  return useQuery({
    queryKey: ["spend-by-year"],
    queryFn: async () => {
      const response = await api.get<SpendByYear[]>("/dashboard/spend-by-year");
      return response.data;
    },
  });
}

export function useVarianceAlerts(limit: number = 5) {
  return useQuery({
    queryKey: ["variance-alerts", limit],
    queryFn: async () => {
      const response = await api.get<VarianceAlert[]>(
        `/dashboard/variance-alerts?limit=${limit}`
      );
      return response.data;
    },
  });
}

export function useGanttData(filters?: {
  startYear?: number;
  endYear?: number;
}) {
  return useQuery({
    queryKey: ["gantt-data", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startYear) params.append("startYear", String(filters.startYear));
      if (filters?.endYear) params.append("endYear", String(filters.endYear));
      const response = await api.get<GanttActivity[]>(
        `/dashboard/gantt?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useSpendAnalysis() {
  return useQuery({
    queryKey: ["spend-analysis"],
    queryFn: async () => {
      const response = await api.get<SpendAnalysis>("/dashboard/spend-analysis");
      return response.data;
    },
  });
}

