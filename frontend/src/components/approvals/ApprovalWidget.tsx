import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import {
  useApprovals,
  useSubmitApproval,
  useFinanceApprove,
  useCommitteeApprove,
  useRejectApproval,
  ApprovalState,
} from "../../hooks/useApprovals";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface ApprovalWidgetProps {
  activityId: string;
  oldValue?: number;
  newValue?: number;
  onApprovalComplete?: () => void;
}

export function ApprovalWidget({
  activityId,
  oldValue,
  newValue,
  onApprovalComplete,
}: ApprovalWidgetProps) {
  const { user } = useAuthStore();
  const { data: approvals } = useApprovals({ targetId: activityId });
  const submitMutation = useSubmitApproval();
  const financeApproveMutation = useFinanceApprove();
  const committeeApproveMutation = useCommitteeApprove();
  const rejectMutation = useRejectApproval();

  const [comment, setComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Get the latest approval for this activity
  const latestApproval = approvals?.[0];

  const handleSubmitApproval = async () => {
    try {
      await submitMutation.mutateAsync({
        targetType: "EstimateChange",
        targetId: activityId,
        oldValue,
        newValue,
        comment,
      });
      setComment("");
      onApprovalComplete?.();
    } catch (error) {
      console.error("Failed to submit approval:", error);
    }
  };

  const handleFinanceApprove = async () => {
    if (!latestApproval) return;
    try {
      await financeApproveMutation.mutateAsync({
        approvalId: latestApproval.id,
        data: { comment },
      });
      setComment("");
      onApprovalComplete?.();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleCommitteeApprove = async () => {
    if (!latestApproval) return;
    try {
      await committeeApproveMutation.mutateAsync({
        approvalId: latestApproval.id,
        data: { comment },
      });
      setComment("");
      onApprovalComplete?.();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleReject = async () => {
    if (!latestApproval || !rejectionReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({
        approvalId: latestApproval.id,
        data: { reason: rejectionReason },
      });
      setRejectionReason("");
      setShowRejectForm(false);
      onApprovalComplete?.();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const canSubmit = user?.role === "ProjectManager" || user?.role === "Admin";
  const canFinanceApprove =
    (user?.role === "Finance" || user?.role === "Admin") &&
    latestApproval?.currentState === "Submitted";
  const canCommitteeApprove =
    (user?.role === "CommitteeMember" || user?.role === "Admin") &&
    latestApproval?.currentState === "FinanceApproved";
  const canReject =
    (user?.role === "Finance" ||
      user?.role === "CommitteeMember" ||
      user?.role === "Admin") &&
    latestApproval &&
    ["Submitted", "FinanceApproved"].includes(latestApproval.currentState);

  const getStateBadge = (state: ApprovalState) => {
    const badges = {
      Draft: { bg: "bg-slate-100", text: "text-slate-700", label: "Draft" },
      Submitted: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Pending Finance",
      },
      FinanceApproved: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Pending Committee",
      },
      CommitteeApproved: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Approved",
      },
      Rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
    };

    const badge = badges[state];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  if (!latestApproval) {
    // No approval yet - show submit button if PM
    if (!canSubmit) return null;

    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        <h3 className="text-sm font-medium text-slate-900 mb-3">
          Approval Required
        </h3>
        <div className="mb-3">
          <Label htmlFor="submit-comment">Comment (optional)</Label>
          <Textarea
            id="submit-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment about this change..."
            className="mt-1"
            rows={2}
          />
        </div>
        <Button
          onClick={handleSubmitApproval}
          disabled={submitMutation.isPending}
          className="w-full"
        >
          Submit for Approval
        </Button>
      </div>
    );
  }

  // Show approval status and action buttons
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-900">Approval Status</h3>
        {getStateBadge(latestApproval.currentState)}
      </div>

      {/* Approval timeline */}
      <div className="space-y-2 mb-4 text-xs text-slate-600">
        {latestApproval.submittedAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              Submitted by {latestApproval.submittedBy?.fullName} on{" "}
              {new Date(latestApproval.submittedAt).toLocaleDateString()}
            </span>
          </div>
        )}
        {latestApproval.financeApprovedAt && (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span>
              Finance approved by {latestApproval.financeApprovedBy?.fullName}{" "}
              on{" "}
              {new Date(latestApproval.financeApprovedAt).toLocaleDateString()}
            </span>
          </div>
        )}
        {latestApproval.committeeApprovedAt && (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span>
              Committee approved by{" "}
              {latestApproval.committeeApprovedBy?.fullName} on{" "}
              {new Date(
                latestApproval.committeeApprovedAt,
              ).toLocaleDateString()}
            </span>
          </div>
        )}
        {latestApproval.rejectedAt && (
          <div className="flex items-center gap-2">
            <XCircle className="h-3 w-3 text-red-600" />
            <span>
              Rejected by {latestApproval.rejectedBy?.fullName} on{" "}
              {new Date(latestApproval.rejectedAt).toLocaleDateString()}
            </span>
            {latestApproval.rejectionReason && (
              <p className="text-red-600 mt-1">
                Reason: {latestApproval.rejectionReason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(canFinanceApprove || canCommitteeApprove || canReject) &&
        !showRejectForm && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="action-comment">Comment (optional)</Label>
              <Textarea
                id="action-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              {canFinanceApprove && (
                <Button
                  onClick={handleFinanceApprove}
                  disabled={financeApproveMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Finance Approve
                </Button>
              )}
              {canCommitteeApprove && (
                <Button
                  onClick={handleCommitteeApprove}
                  disabled={committeeApproveMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Committee Approve
                </Button>
              )}
              {canReject && (
                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Rejection form */}
      {showRejectForm && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please explain why you are rejecting this change..."
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Confirm Rejection
            </Button>
            <Button
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
