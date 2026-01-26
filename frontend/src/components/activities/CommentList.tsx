import { useComments } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { LoadingState } from '../ui/loading-state';
import { MessageSquare } from 'lucide-react';
import { useMemo } from 'react';

interface CommentListProps {
  activityId: string;
}

export function CommentList({ activityId }: CommentListProps) {
  const { data: comments, isLoading, isError } = useComments(activityId);

  // Group comments into threads (one level of nesting for now)
  const threadedComments = useMemo(() => {
    if (!comments) return [];

    const topLevel = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => !!c.parentId);

    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentId === comment.id)
    }));
  }, [comments]);

  if (isLoading) {
    return <LoadingState message="Loading comments..." />;
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load comments.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-3">Leave a comment</h4>
        <CommentForm activityId={activityId} />
      </div>

      <div className="space-y-1 divide-y divide-border/40">
        {threadedComments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          threadedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={comment.replies}
            />
          ))
        )}
      </div>
    </div>
  );
}
