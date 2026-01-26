import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApprovalWidget } from '../ApprovalWidget';
import { useAuthStore } from '../../../stores/authStore';
import {
  useApprovals,
  useSubmitApproval,
  useFinanceApprove,
  useCommitteeApprove,
  useRejectApproval,
} from '../../../hooks/useApprovals';

// Mock dependencies
vi.mock('../../../stores/authStore');
vi.mock('../../../hooks/useApprovals');

describe('ApprovalWidget', () => {
  const mockOnApprovalComplete = vi.fn();

  const mockSubmitMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockFinanceApproveMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockCommitteeApproveMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockRejectMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(useSubmitApproval).mockReturnValue(mockSubmitMutation as any);
    vi.mocked(useFinanceApprove).mockReturnValue(mockFinanceApproveMutation as any);
    vi.mocked(useCommitteeApprove).mockReturnValue(mockCommitteeApproveMutation as any);
    vi.mocked(useRejectApproval).mockReturnValue(mockRejectMutation as any);
  });

  describe('No Approval State', () => {
    it('should show submit button for Project Manager when no approval exists', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'ProjectManager', fullName: 'PM User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [] } as any);

      render(
        <ApprovalWidget
          activityId="activity-1"
          oldValue={50000}
          newValue={60000}
          onApprovalComplete={mockOnApprovalComplete}
        />
      );

      expect(screen.getByText('Approval Required')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit for approval/i })).toBeInTheDocument();
    });

    it('should not render for non-PM users when no approval exists', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [] } as any);

      const { container } = render(
        <ApprovalWidget
          activityId="activity-1"
          oldValue={50000}
          newValue={60000}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should submit approval with comment', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'ProjectManager', fullName: 'PM User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [] } as any);

      mockSubmitMutation.mutateAsync.mockResolvedValue({});

      render(
        <ApprovalWidget
          activityId="activity-1"
          oldValue={50000}
          newValue={60000}
          onApprovalComplete={mockOnApprovalComplete}
        />
      );

      const commentInput = screen.getByPlaceholderText(/add a comment about this change/i);
      fireEvent.change(commentInput, { target: { value: 'Budget increase needed' } });

      const submitButton = screen.getByRole('button', { name: /submit for approval/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitMutation.mutateAsync).toHaveBeenCalledWith({
          targetType: 'EstimateChange',
          targetId: 'activity-1',
          oldValue: 50000,
          newValue: 60000,
          comment: 'Budget increase needed',
        });
      });

      expect(mockOnApprovalComplete).toHaveBeenCalled();
    });
  });

  describe('Submitted State', () => {
    const submittedApproval = {
      id: 'approval-1',
      currentState: 'Submitted',
      submittedAt: '2024-01-15T10:00:00Z',
      submittedBy: { fullName: 'PM User' },
      financeApprovedAt: null,
      committeeApprovedAt: null,
      rejectedAt: null,
    };

    it('should show pending finance badge', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText('Pending Finance')).toBeInTheDocument();
    });

    it('should show finance approve button for Finance role', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByRole('button', { name: /finance approve/i })).toBeInTheDocument();
    });

    it('should show reject button for Finance role', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('should handle finance approval', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      mockFinanceApproveMutation.mutateAsync.mockResolvedValue({});

      render(
        <ApprovalWidget
          activityId="activity-1"
          onApprovalComplete={mockOnApprovalComplete}
        />
      );

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { target: { value: 'Looks good' } });

      const approveButton = screen.getByRole('button', { name: /finance approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockFinanceApproveMutation.mutateAsync).toHaveBeenCalledWith({
          approvalId: 'approval-1',
          data: { comment: 'Looks good' },
        });
      });

      expect(mockOnApprovalComplete).toHaveBeenCalled();
    });
  });

  describe('Finance Approved State', () => {
    const financeApprovedApproval = {
      id: 'approval-1',
      currentState: 'FinanceApproved',
      submittedAt: '2024-01-15T10:00:00Z',
      submittedBy: { fullName: 'PM User' },
      financeApprovedAt: '2024-01-16T11:00:00Z',
      financeApprovedBy: { fullName: 'Finance User' },
      committeeApprovedAt: null,
      rejectedAt: null,
    };

    it('should show pending committee badge', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'CommitteeMember', fullName: 'Committee User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [financeApprovedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText('Pending Committee')).toBeInTheDocument();
    });

    it('should show committee approve button for Committee role', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'CommitteeMember', fullName: 'Committee User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [financeApprovedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByRole('button', { name: /committee approve/i })).toBeInTheDocument();
    });

    it('should handle committee approval', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'CommitteeMember', fullName: 'Committee User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [financeApprovedApproval] } as any);

      mockCommitteeApproveMutation.mutateAsync.mockResolvedValue({});

      render(
        <ApprovalWidget
          activityId="activity-1"
          onApprovalComplete={mockOnApprovalComplete}
        />
      );

      const approveButton = screen.getByRole('button', { name: /committee approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockCommitteeApproveMutation.mutateAsync).toHaveBeenCalledWith({
          approvalId: 'approval-1',
          data: { comment: '' },
        });
      });

      expect(mockOnApprovalComplete).toHaveBeenCalled();
    });

    it('should show approval timeline with finance approval', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'CommitteeMember', fullName: 'Committee User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [financeApprovedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText(/submitted by pm user/i)).toBeInTheDocument();
      expect(screen.getByText(/finance approved by finance user/i)).toBeInTheDocument();
    });
  });

  describe('Committee Approved State', () => {
    const committeeApprovedApproval = {
      id: 'approval-1',
      currentState: 'CommitteeApproved',
      submittedAt: '2024-01-15T10:00:00Z',
      submittedBy: { fullName: 'PM User' },
      financeApprovedAt: '2024-01-16T11:00:00Z',
      financeApprovedBy: { fullName: 'Finance User' },
      committeeApprovedAt: '2024-01-17T14:00:00Z',
      committeeApprovedBy: { fullName: 'Committee User' },
      rejectedAt: null,
    };

    it('should show approved badge', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Viewer', fullName: 'Viewer User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [committeeApprovedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should show complete approval timeline', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Viewer', fullName: 'Viewer User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [committeeApprovedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText(/submitted by pm user/i)).toBeInTheDocument();
      expect(screen.getByText(/finance approved by finance user/i)).toBeInTheDocument();
      expect(screen.getByText(/committee approved by committee user/i)).toBeInTheDocument();
    });

    it('should not show action buttons when fully approved', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [committeeApprovedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    });
  });

  describe('Rejected State', () => {
    const rejectedApproval = {
      id: 'approval-1',
      currentState: 'Rejected',
      submittedAt: '2024-01-15T10:00:00Z',
      submittedBy: { fullName: 'PM User' },
      financeApprovedAt: null,
      committeeApprovedAt: null,
      rejectedAt: '2024-01-16T11:00:00Z',
      rejectedBy: { fullName: 'Finance User' },
      rejectionReason: 'Insufficient justification',
    };

    it('should show rejected badge', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Viewer', fullName: 'Viewer User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [rejectedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should show rejection reason', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Viewer', fullName: 'Viewer User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [rejectedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText(/reason: insufficient justification/i)).toBeInTheDocument();
    });

    it('should show rejection timeline', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Viewer', fullName: 'Viewer User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [rejectedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByText(/rejected by finance user/i)).toBeInTheDocument();
    });
  });

  describe('Rejection Flow', () => {
    const submittedApproval = {
      id: 'approval-1',
      currentState: 'Submitted',
      submittedAt: '2024-01-15T10:00:00Z',
      submittedBy: { fullName: 'PM User' },
      financeApprovedAt: null,
      committeeApprovedAt: null,
      rejectedAt: null,
    };

    it('should show rejection form when reject button clicked', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      const rejectButton = screen.getByRole('button', { name: /^reject$/i });
      fireEvent.click(rejectButton);

      expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm rejection/i })).toBeInTheDocument();
    });

    it('should require rejection reason', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      const rejectButton = screen.getByRole('button', { name: /^reject$/i });
      fireEvent.click(rejectButton);

      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should handle rejection with reason', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      mockRejectMutation.mutateAsync.mockResolvedValue({});

      render(
        <ApprovalWidget
          activityId="activity-1"
          onApprovalComplete={mockOnApprovalComplete}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /^reject$/i });
      fireEvent.click(rejectButton);

      const reasonInput = screen.getByLabelText(/rejection reason/i);
      fireEvent.change(reasonInput, { target: { value: 'Need more details' } });

      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRejectMutation.mutateAsync).toHaveBeenCalledWith({
          approvalId: 'approval-1',
          data: { reason: 'Need more details' },
        });
      });

      expect(mockOnApprovalComplete).toHaveBeenCalled();
    });

    it('should cancel rejection form', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Finance', fullName: 'Finance User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [submittedApproval] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      const rejectButton = screen.getByRole('button', { name: /^reject$/i });
      fireEvent.click(rejectButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByLabelText(/rejection reason/i)).not.toBeInTheDocument();
    });
  });

  describe('Admin Role', () => {
    it('should allow admin to submit approval', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Admin', fullName: 'Admin User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({ data: [] } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByRole('button', { name: /submit for approval/i })).toBeInTheDocument();
    });

    it('should allow admin to finance approve', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Admin', fullName: 'Admin User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({
        data: [{
          id: 'approval-1',
          currentState: 'Submitted',
          submittedAt: '2024-01-15T10:00:00Z',
          submittedBy: { fullName: 'PM User' },
        }],
      } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByRole('button', { name: /finance approve/i })).toBeInTheDocument();
    });

    it('should allow admin to committee approve', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: '1', role: 'Admin', fullName: 'Admin User' },
      } as any);
      vi.mocked(useApprovals).mockReturnValue({
        data: [{
          id: 'approval-1',
          currentState: 'FinanceApproved',
          submittedAt: '2024-01-15T10:00:00Z',
          submittedBy: { fullName: 'PM User' },
          financeApprovedAt: '2024-01-16T11:00:00Z',
          financeApprovedBy: { fullName: 'Finance User' },
        }],
      } as any);

      render(<ApprovalWidget activityId="activity-1" />);

      expect(screen.getByRole('button', { name: /committee approve/i })).toBeInTheDocument();
    });
  });
});
