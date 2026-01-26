import { useState } from 'react';
import { Comment, useUpdateComment, useDeleteComment } from '../../hooks/useComments';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { CommentForm } from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Reply, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

interface CommentItemProps {
  comment: Comment;
  replies?: Comment[];
  isReply?: boolean;
}

export function CommentItem({ comment, replies = [], isReply = false }: CommentItemProps) {
  const { user } = useAuthStore();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const isAuthor = user?.id === comment.userId;
  const isAdmin = user?.role === 'Admin';

  const handleUpdate = async () => {
    if (!editContent.trim() || updateComment.isPending) return;
    try {
      await updateComment.mutateAsync({
        id: comment.id,
        activityId: comment.activityId,
        data: { content: editContent.trim() },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment.mutateAsync({
        id: comment.id,
        activityId: comment.activityId,
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className={cn("group py-3", isReply ? "ml-8 border-l border-border/40 pl-4" : "")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground">
              {comment.user.fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.user.role === 'Admin' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2 mt-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdate} disabled={updateComment.isPending}>
                  {updateComment.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              {!isReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
              {(isAuthor || isAdmin) && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isReplying && (
        <div className="mt-4 ml-4">
          <CommentForm
            activityId={comment.activityId}
            parentId={comment.id}
            onSuccess={() => setIsReplying(false)}
            onCancel={() => setIsReplying(false)}
            autoFocus
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-2 space-y-1">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );
}
