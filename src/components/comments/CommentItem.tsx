
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from './types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import CommentReactions from './CommentReactions';
import { Link } from 'react-router-dom';

interface CommentItemProps {
  comment: Comment;
  isAdmin: boolean;
  userId?: string;
  onDelete: (commentId: string, commentUserId: string) => Promise<void>;
}

const CommentItem = ({ comment, isAdmin, userId, onDelete }: CommentItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);
  const { user } = useAuth();
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [isModerator, setIsModerator] = useState(false);
  
  const emojis = ["🤣", "🙄", "❤", "🧨", "🗿"];
  
  // Check if the current user is a moderator
  useEffect(() => {
    const checkModeratorStatus = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsModerator(data?.role === 'moderator' || data?.role === 'admin');
      } catch (err) {
        console.error('Error checking moderator status:', err);
      }
    };
    
    checkModeratorStatus();
  }, [user?.id]);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(comment.id, comment.user_id);
    setIsDeleting(false);
  };

  const loadReactions = async () => {
    if (!comment.id) return;
    
    setIsLoadingReactions(true);
    try {
      // Get reactions for this comment directly from database
      const { data: reactionsData, error } = await supabase
        .from('comment_reactions')
        .select('emoji')
        .eq('comment_id', comment.id);
        
      if (error) throw error;
      
      // Create reaction counts
      const counts: Record<string, number> = {};
      if (reactionsData) {
        reactionsData.forEach((item) => {
          counts[item.emoji] = (counts[item.emoji] || 0) + 1;
        });
      }
      
      setReactions(counts);
      
      // Get user's reactions
      if (user) {
        const { data: userReactionsData, error: userError } = await supabase
          .from('comment_reactions')
          .select('emoji')
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
          
        if (userError) throw userError;
        
        setUserReactions(userReactionsData?.map((r) => r.emoji) || []);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setIsLoadingReactions(false);
    }
  };
  
  const toggleReaction = async (emoji: string) => {
    if (!user) {
      toast.error("You must be logged in to react to comments");
      return;
    }
    
    try {
      if (userReactions.includes(emoji)) {
        // Remove reaction directly from the database
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
          
        if (error) throw error;
        
        setUserReactions(prev => prev.filter(e => e !== emoji));
        setReactions(prev => ({
          ...prev,
          [emoji]: Math.max(0, (prev[emoji] || 0) - 1)
        }));
      } else {
        // Add reaction directly to the database
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: comment.id,
            user_id: user.id,
            emoji: emoji
          });
        
        if (error) throw error;
        
        setUserReactions(prev => [...prev, emoji]);
        setReactions(prev => ({
          ...prev,
          [emoji]: (prev[emoji] || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error("Failed to add reaction");
    }
  };
  
  // Load reactions when component mounts
  useEffect(() => {
    loadReactions();
  }, [comment.id]);
  
  // Moderators or admins can delete any comment, users can only delete their own
  const canDelete = isAdmin || isModerator || userId === comment.user_id;
  
  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link to={`/user/${comment.user_id}`}>
            <Avatar>
              <AvatarImage src={comment.author.avatar_url} alt={comment.author.username} />
              <AvatarFallback>
                {comment.author.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center">
              <Link to={`/user/${comment.user_id}`} className="font-semibold hover:underline">
                {comment.author.username}
              </Link>
              {comment.author.role === 'admin' && (
                <span className="ml-2 text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded border border-amber-500/30">Admin</span>
              )}
              {comment.author.role === 'moderator' && (
                <span className="ml-2 text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded border border-blue-500/30">Mod</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </div>
            <div className="mt-2 whitespace-pre-line">
              {comment.content}
            </div>
            
            {/* Reactions display */}
            <CommentReactions 
              reactions={reactions}
              userReactions={userReactions}
              onReactionClick={toggleReaction}
              isLoggedIn={!!user}
            />
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300">
                  <Smile size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex gap-2">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className={`text-xl p-1 ${userReactions.includes(emoji) ? 'bg-secondary' : ''}`}
                      onClick={() => toggleReaction(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
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
    </div>
  );
};

export default CommentItem;
