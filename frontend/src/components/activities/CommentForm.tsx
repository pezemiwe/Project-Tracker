import { useState } from 'react';
import { useCreateComment } from '../../hooks/useComments';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send } from 'lucide-react';

interface CommentFormProps {
  activityId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ activityId, parentId, onSuccess, onCancel, autoFocus }: CommentFormProps) {
  const [content, setContent] = useState('');
  const createComment = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || createComment.isPending) return;

    try {
      await createComment.mutateAsync({
        activityId,
        content: content.trim(),
        parentId,
      });
      setContent('');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Add a comment..."}
        className="min-h-[80px] resize-none"
        autoFocus={autoFocus}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || createComment.isPending}
          className="gap-2"
        >
          {createComment.isPending ? (
            'Posting...'
          ) : (
            <>
              <Send className="h-4 w-4" />
              {parentId ? 'Reply' : 'Comment'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
