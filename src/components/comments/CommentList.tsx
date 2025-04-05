
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { isUserAdmin } from '@/utils/admin';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { useComments } from './useComments';

interface CommentListProps {
  postId: string;
  commentsEnabled: boolean;
}

const CommentList = ({ postId, commentsEnabled }: CommentListProps) => {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  
  const { comments, isLoading, refetchComments } = useComments(postId);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await isUserAdmin(user.id);
        setIsAdmin(adminStatus);
      }
    };
    
    checkAdmin();
  }, [user]);
  
  const handleSubmitComment = async (content: string) => {
    if (!isAuthenticated) {
      toast.error('You need to be logged in to comment');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: content.trim(),
          post_id: postId,
          user_id: user!.id
        });
        
      if (error) throw error;
      
      toast.success('Comment added successfully');
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      refetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!isAuthenticated) {
      toast.error('You need to be logged in to delete comments');
      return;
    }
    
    // Check if user can delete (either admin or comment author)
    if (!isAdmin && user?.id !== commentUserId) {
      toast.error('You can only delete your own comments');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
        
      if (error) throw error;
      
      toast.success('Comment deleted successfully');
      refetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };
  
  if (!commentsEnabled) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Comments are disabled for this post.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <h3 className="text-xl font-semibold">Comments</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated && (
          <CommentForm 
            onSubmit={handleSubmitComment}
            isSubmitting={isSubmitting}
          />
        )}
        
        {!isAuthenticated && (
          <div className="text-center text-muted-foreground py-4">
            You need to be logged in to comment.
          </div>
        )}
        
        <div className="space-y-4 mt-6">
          {isLoading ? (
            <CommentSkeleton />
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                isAdmin={isAdmin}
                userId={user?.id} 
                onDelete={handleDeleteComment}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CommentSkeleton = () => (
  <>
    {Array(3).fill(0).map((_, i) => (
      <div key={i} className="border border-gray-800 rounded-lg p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-800"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-1/4"></div>
            <div className="h-3 bg-gray-800 rounded w-full"></div>
            <div className="h-3 bg-gray-800 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ))}
  </>
);

export default CommentList;
