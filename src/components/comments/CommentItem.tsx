
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from './types';

interface CommentItemProps {
  comment: Comment;
  isAdmin: boolean;
  userId?: string;
  onDelete: (commentId: string, commentUserId: string) => Promise<void>;
}

const CommentItem = ({ comment, isAdmin, userId, onDelete }: CommentItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(comment.id, comment.user_id);
    setIsDeleting(false);
  };
  
  const canDelete = isAdmin || userId === comment.user_id;
  
  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={comment.author.avatar_url} alt={comment.author.username} />
            <AvatarFallback>
              {comment.author.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <span className="font-semibold">{comment.author.username}</span>
              {comment.author.role === 'admin' && (
                <span className="ml-2 text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded">Admin</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </div>
            <div className="mt-2 whitespace-pre-line">
              {comment.content}
            </div>
          </div>
        </div>
        
        {canDelete && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
