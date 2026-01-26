import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface ExportFilters {
  objectiveId?: string;
  status?: string;
  lead?: string;
  startYear?: number;
  endYear?: number;
}

export function useExportActivities() {
  return useMutation({
    mutationFn: async (filters?: ExportFilters): Promise<void> => {
      const params = new URLSearchParams();
      if (filters?.objectiveId) params.append('objectiveId', filters.objectiveId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.lead) params.append('lead', filters.lead);
      if (filters?.startYear) params.append('startYear', String(filters.startYear));
      if (filters?.endYear) params.append('endYear', String(filters.endYear));

      const response = await api.get(`/export/activities?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activities-export-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportActuals() {
  return useMutation({
    mutationFn: async (activityId?: string): Promise<void> => {
      const params = activityId ? `?activityId=${activityId}` : '';
      const response = await api.get(`/export/actuals${params}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `actuals-export-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportFinancialReport() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await api.get('/export/financial-report', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportPDFReport() {
  return useMutation({
    mutationFn: async (objectiveId?: string): Promise<void> => {
      const params = objectiveId ? `?objectiveId=${objectiveId}` : '';
      const response = await api.get(`/export/pdf-report${params}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portfolio-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
