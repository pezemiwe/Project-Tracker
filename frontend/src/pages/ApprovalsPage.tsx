import { useState } from 'react';
import { useApprovals, Approval, ApprovalState } from '../hooks/useApprovals';
import { useFinanceApprove, useCommitteeApprove, useRejectApproval } from '../hooks/useApprovals';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { LoadingState } from '../components/ui/loading-state';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from '../hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '../components/ui/dialog';
import { CheckCircle, XCircle, Clock, ClipboardCheck, FileX, AlertTriangle, Loader2 } from 'lucide-react';

type TabType = 'pending' | 'approved' | 'rejected';

export function ApprovalsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalToReject, setApprovalToReject] = useState<Approval | null>(null);

  // Queries
  const { data: pendingApprovals, isLoading: pendingLoading } = useApprovals({
    state: 'Submitted' as ApprovalState,
  });
  const { data: financeApprovedApprovals, isLoading: financeLoading } = useApprovals({
    state: 'FinanceApproved' as ApprovalState,
  });
  const { data: approvedApprovals, isLoading: approvedLoading } = useApprovals({
    state: 'CommitteeApproved' as ApprovalState,
  });
  const { data: rejectedApprovals, isLoading: rejectedLoading } = useApprovals({
    state: 'Rejected' as ApprovalState,
  });

  // Mutations
  const financeApproveMutation = useFinanceApprove();
  const committeeApproveMutation = useCommitteeApprove();
  const rejectMutation = useRejectApproval();

  const handleFinanceApprove = async (approvalId: string) => {
    try {
      await financeApproveMutation.mutateAsync({
        approvalId,
        data: { comment },
      });
      toast({
        variant: "success",
        title: "Approval Successful",
        description: "Finance approval has been recorded",
      });
      setComment('');
      setSelectedApproval(null);
    } catch (error) {
      toast({
        variant: "error",
        title: "Approval Failed",
        description: "Failed to record finance approval",
      });
      console.error('Failed to approve:', error);
    }
  };

  const handleCommitteeApprove = async (approvalId: string) => {
    try {
      await committeeApproveMutation.mutateAsync({
        approvalId,
        data: { comment },
      });
      toast({
        variant: "success",
        title: "Approval Successful",
        description: "Committee approval has been recorded",
      });
      setComment('');
      setSelectedApproval(null);
    } catch (error) {
      toast({
        variant: "error",
        title: "Approval Failed",
        description: "Failed to record committee approval",
      });
      console.error('Failed to approve:', error);
    }
  };

  const handleOpenRejectDialog = (approval: Approval) => {
    setApprovalToReject(approval);
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || !approvalToReject) return;
    try {
      await rejectMutation.mutateAsync({
        approvalId: approvalToReject.id,
        data: { reason: rejectionReason },
      });
      toast({
        variant: "warning",
        title: "Approval Rejected",
        description: "The approval has been rejected",
      });
      setRejectionReason('');
      setShowRejectDialog(false);
      setApprovalToReject(null);
      setSelectedApproval(null);
    } catch (error) {
      toast({
        variant: "error",
        title: "Rejection Failed",
        description: "Failed to reject approval",
      });
      console.error('Failed to reject:', error);
    }
  };

  const handleCloseRejectDialog = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
    setApprovalToReject(null);
  };

  const getApprovalsByTab = () => {
    switch (activeTab) {
      case 'pending':
        return [...(pendingApprovals || []), ...(financeApprovedApprovals || [])];
      case 'approved':
        return approvedApprovals || [];
      case 'rejected':
        return rejectedApprovals || [];
      default:
        return [];
    }
  };

  const approvals = getApprovalsByTab();
  const isLoading = pendingLoading || financeLoading || approvedLoading || rejectedLoading;

  const canApprove = (approval: Approval) => {
    const isFinance = user?.role === 'Finance' || user?.role === 'Admin';
    const isCommittee = user?.role === 'CommitteeMember' || user?.role === 'Admin';

    if (approval.currentState === 'Submitted' && isFinance) return 'finance';
    if (approval.currentState === 'FinanceApproved' && isCommittee) return 'committee';
    return null;
  };

  const getStateBadge = (state: ApprovalState) => {
    const badges = {
      Draft: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        label: 'Draft'
      },
      Submitted: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/50',
        label: 'Pending Finance'
      },
      FinanceApproved: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
        label: 'Pending Committee',
      },
      CommitteeApproved: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        label: 'Approved'
      },
      Rejected: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800/50',
        label: 'Rejected'
      },
    };

    const badge = badges[state];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState size="lg" message="Loading approvals..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="font-semibold text-2xl text-foreground mb-1">
            Approval Workflow
          </h1>
          <p className="text-muted-foreground text-sm">
            Review and manage budget change approvals
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="border-b border-border/40 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'pending'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="inline-block h-4 w-4 mr-2 mb-0.5" />
              Pending
              {(pendingApprovals?.length || 0) + (financeApprovedApprovals?.length || 0) > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-mono">
                  {(pendingApprovals?.length || 0) + (financeApprovedApprovals?.length || 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'approved'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClipboardCheck className="inline-block h-4 w-4 mr-2 mb-0.5" />
              Approved
              {(approvedApprovals?.length || 0) > 0 && (
                <span className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-mono">
                  {approvedApprovals?.length || 0}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'rejected'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileX className="inline-block h-4 w-4 mr-2 mb-0.5" />
              Rejected
              {(rejectedApprovals?.length || 0) > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-mono">
                  {rejectedApprovals?.length || 0}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Approvals list */}
        {approvals.length === 0 ? (
          <EmptyState
            variant={activeTab === 'pending' ? 'no-data' : 'no-results'}
            icon={activeTab === 'pending' ? Clock : activeTab === 'approved' ? ClipboardCheck : FileX}
            title={`No ${activeTab} approvals`}
            description={`There are no ${activeTab} approvals at this time`}
          />
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => {
              const approvalType = canApprove(approval);
              const isSelected = selectedApproval?.id === approval.id;

              return (
                <Card key={approval.id} className="p-6 bg-card border-border/40 transition-all duration-200 hover:border-primary/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {approval.targetType} - {approval.targetId}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        Submitted by <span className="text-foreground font-medium">{approval.submittedBy?.fullName}</span> on{' '}
                        {approval.submittedAt
                          ? new Date(approval.submittedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                    {getStateBadge(approval.currentState)}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3 mb-4 text-sm">
                    {approval.financeApprovedAt && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-md border border-emerald-100 dark:border-emerald-800/20">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground font-mono">
                          Finance approved by <span className="text-foreground font-medium">{approval.financeApprovedBy?.fullName}</span> on{' '}
                          {new Date(approval.financeApprovedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {approval.committeeApprovedAt && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-md border border-emerald-100 dark:border-emerald-800/20">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground font-mono">
                          Committee approved by <span className="text-foreground font-medium">{approval.committeeApprovedBy?.fullName}</span> on{' '}
                          {new Date(approval.committeeApprovedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {approval.rejectedAt && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-800/20">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground font-mono">
                            Rejected by <span className="text-foreground font-medium">{approval.rejectedBy?.fullName}</span> on{' '}
                            {new Date(approval.rejectedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {approval.rejectionReason && (
                          <p className="text-red-600 mt-2 ml-7 font-mono text-sm">
                            <span className="font-semibold">Reason:</span> {approval.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {approvalType && (
                    <div className="border-t border-border/40 pt-4">
                      {!isSelected ? (
                        <Button
                          onClick={() => setSelectedApproval(approval)}
                          variant="outline"
                          size="sm"
                        >
                          Review
                        </Button>
                      ) : (
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/40">
                          <div>
                            <Label htmlFor="action-comment" className="text-xs">Comment (optional)</Label>
                            <Textarea
                              id="action-comment"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="mt-2"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                approvalType === 'finance'
                                  ? handleFinanceApprove(approval.id)
                                  : handleCommitteeApprove(approval.id)
                              }
                              disabled={
                                financeApproveMutation.isPending ||
                                committeeApproveMutation.isPending
                              }
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleOpenRejectDialog(approval)}
                              variant="outline"
                              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => setSelectedApproval(null)}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={handleCloseRejectDialog}>
        <DialogContent
          className="max-w-md"
          closeOnEscape={!rejectMutation.isPending}
          closeOnBackdrop={!rejectMutation.isPending}
          loading={rejectMutation.isPending}
        >
          <DialogHeader className="border-l-4 border-critical-red/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <AlertTriangle className="h-6 w-6 text-critical-red" />
              </div>
              <div className="flex-1 space-y-2">
                <DialogTitle>Reject Approval</DialogTitle>
                <DialogDescription>
                  {approvalToReject && `Reject ${approvalToReject.targetType} approval (${approvalToReject.targetId})? This action cannot be undone.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="uppercase tracking-wider text-xs">
                Rejection Reason <span className="text-critical-red">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you are rejecting this approval..."
                rows={4}
                disabled={rejectMutation.isPending}
                className="font-mono text-sm"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseRejectDialog}
              disabled={rejectMutation.isPending}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="min-w-[100px]"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Reject Approval'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
