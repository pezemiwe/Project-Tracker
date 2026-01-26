import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  preview?: any[];
}

export function useImportPreview() {
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ImportResult>('/import/activities/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  });
}

export function useImportActivities() {
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ImportResult>('/import/activities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  });
}

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await api.get('/import/template', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'activity-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
