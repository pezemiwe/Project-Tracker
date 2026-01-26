import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type ApprovalState = 'Draft' | 'Submitted' | 'FinanceApproved' | 'CommitteeApproved' | 'Rejected';
export type ApprovalTargetType = 'EstimateChange' | 'ActualEntry' | 'StatusChange';

export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface Approval {
  id: string;
  targetType: ApprovalTargetType;
  targetId: string;
  currentState: ApprovalState;
  submittedBy?: User;
  submittedById?: string;
  submittedAt?: string;
  financeApprovedBy?: User;
  financeApprovedById?: string;
  financeApprovedAt?: string;
  financeComment?: string;
  committeeApprovedBy?: User;
  committeeApprovedById?: string;
  committeeApprovedAt?: string;
  committeeComment?: string;
  rejectedBy?: User;
  rejectedById?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  history: StateTransition[];
  createdAt: string;
  updatedAt: string;
}

export interface StateTransition {
  state: ApprovalState;
  actorId: string;
  timestamp: string;
  comment?: string;
}

export interface SubmitApprovalData {
  targetType: ApprovalTargetType;
  targetId: string;
  oldValue?: number;
  newValue?: number;
  comment?: string;
}

export interface ApprovalActionData {
  comment?: string;
}

export interface RejectApprovalData {
  reason: string;
}

/**
 * Get all approvals with optional filters
 */
export function useApprovals(filters?: {
  state?: ApprovalState;
  targetType?: ApprovalTargetType;
  targetId?: string;
  submittedById?: string;
}) {
  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.state) params.append('state', filters.state);
      if (filters?.targetType) params.append('targetType', filters.targetType);
      if (filters?.targetId) params.append('targetId', filters.targetId);
      if (filters?.submittedById) params.append('submittedById', filters.submittedById);

      const response = await api.get(`/approvals?${params.toString()}`);
      return response.data as Approval[];
    },
  });
}

/**
 * Get single approval by ID
 */
export function useApproval(approvalId: string | undefined) {
  return useQuery({
    queryKey: ['approvals', approvalId],
    queryFn: async () => {
      const response = await api.get(`/approvals/${approvalId}`);
      return response.data as Approval;
    },
    enabled: !!approvalId,
  });
}

/**
 * Get pending approvals for current user
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const response = await api.get('/approvals/pending');
      return response.data as Approval[];
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

/**
 * Submit approval
 */
export function useSubmitApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitApprovalData) => {
      const response = await api.post('/approvals', data);
      return response.data as Approval;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

/**
 * Finance approve
 */
export function useFinanceApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, data }: { approvalId: string; data: ApprovalActionData }) => {
      const response = await api.post(`/approvals/${approvalId}/finance-approve`, data);
      return response.data as Approval;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals', variables.approvalId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Committee approve
 */
export function useCommitteeApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, data }: { approvalId: string; data: ApprovalActionData }) => {
      const response = await api.post(`/approvals/${approvalId}/committee-approve`, data);
      return response.data as Approval;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals', variables.approvalId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Reject approval
 */
export function useRejectApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, data }: { approvalId: string; data: RejectApprovalData }) => {
      const response = await api.post(`/approvals/${approvalId}/reject`, data);
      return response.data as Approval;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals', variables.approvalId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
