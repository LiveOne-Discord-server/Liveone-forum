
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import toast from '@/hooks/use-toast';

interface PostVoteButtonsProps {
  postId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: 'up' | 'down' | null;
  size?: 'sm' | 'md' | 'lg';
  onVoteChange?: (upvotes: number, downvotes: number) => void;
}

const PostVoteButtons = ({
  postId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialUserVote = null,
  size = 'md',
  onVoteChange,
}: PostVoteButtonsProps) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const votePost = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in to vote on posts');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      // If user clicked the same vote type again, remove their vote
      if (userVote === voteType) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;

        // Update state
        if (voteType === 'up') {
          setUpvotes(prev => prev - 1);
        } else {
          setDownvotes(prev => prev - 1);
        }
        setUserVote(null);
      } 
      // If user is changing their vote
      else if (userVote !== null) {
        const { error } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;

        // Update state
        if (voteType === 'up') {
          setUpvotes(prev => prev + 1);
          setDownvotes(prev => prev - 1);
        } else {
          setUpvotes(prev => prev - 1);
          setDownvotes(prev => prev + 1);
        }
        setUserVote(voteType);
      } 
      // If user is voting for the first time
      else {
        const { error } = await supabase
          .from('votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          });
          
        if (error) throw error;

        // Update state
        if (voteType === 'up') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }
        setUserVote(voteType);
      }

      // Notify parent component of vote change
      if (onVoteChange) {
        onVoteChange(
          voteType === 'up' 
            ? userVote === 'up' ? upvotes - 1 : userVote === 'down' ? upvotes + 1 : upvotes + 1
            : userVote === 'up' ? upvotes - 1 : upvotes,
          voteType === 'down'
            ? userVote === 'down' ? downvotes - 1 : userVote === 'up' ? downvotes + 1 : downvotes + 1
            : userVote === 'down' ? downvotes - 1 : downvotes
        );
      }
    } catch (error) {
      console.error('Error voting on post:', error);
      toast.error('Failed to register your vote');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={`${sizeClasses[size]} ${userVote === 'up' ? 'text-green-500' : ''}`}
        onClick={() => votePost('up')}
        disabled={isVoting}
      >
        <ThumbsUp className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'} />
        <span className="sr-only">Upvote</span>
      </Button>
      
      <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
        {upvotes - downvotes}
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        className={`${sizeClasses[size]} ${userVote === 'down' ? 'text-red-500' : ''}`}
        onClick={() => votePost('down')}
        disabled={isVoting}
      >
        <ThumbsDown className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'} />
        <span className="sr-only">Downvote</span>
      </Button>
    </div>
  );
};

export default PostVoteButtons;
