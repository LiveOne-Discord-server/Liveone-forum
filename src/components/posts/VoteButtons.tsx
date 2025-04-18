
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';
import toast from '@/hooks/use-toast';
import { applyVoteAnimation } from '@/lib/utils';

interface VoteButtonsProps {
  postId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote?: "up" | "down" | null;
}

const VoteButtons = ({ postId, initialUpvotes, initialDownvotes, userVote = null }: VoteButtonsProps) => {
  const { user, isAuthenticated } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(userVote);
  const [isVoting, setIsVoting] = useState(false);
  
  const handleVote = async (voteType: "up" | "down") => {
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to vote.");
      return;
    }
    
    if (isVoting) return;
    setIsVoting(true);
    
    const isUpvote = voteType === "up";
    const isDownvote = voteType === "down";
    
    const elementId = isUpvote ? `upvote-button-${postId}` : `downvote-button-${postId}`;
    const element = document.getElementById(elementId);
    
    if (element) {
      // Convert "up" to "like" and "down" to "dislike" for the animation function
      const animationType = voteType === "up" ? "like" : "dislike";
      applyVoteAnimation(element, animationType);
    }
    
    try {
      // Optimistically update the vote count
      if (currentVote === "up" && voteType === "down") {
        setUpvotes(prev => Math.max(0, prev - 1));
        setDownvotes(prev => prev + 1);
      } else if (currentVote === "down" && voteType === "up") {
        setDownvotes(prev => Math.max(0, prev - 1));
        setUpvotes(prev => prev + 1);
      } else if (currentVote === "up" && voteType === "up") {
        setUpvotes(prev => Math.max(0, prev - 1));
      } else if (currentVote === "down" && voteType === "down") {
        setDownvotes(prev => Math.max(0, prev - 1));
      } else if (currentVote === null && voteType === "up") {
        setUpvotes(prev => prev + 1);
      } else if (currentVote === null && voteType === "down") {
        setDownvotes(prev => prev + 1);
      }
      
      // Determine the new vote state
      const newVote = currentVote === voteType ? null : voteType;
      setCurrentVote(newVote);
      
      // Use a direct query instead of RPC function
      if (newVote === null) {
        // Remove the vote
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) throw error;
      } else if (currentVote === null) {
        // Insert new vote
        const { error } = await supabase
          .from('votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: newVote
          });
          
        if (error) throw error;
      } else {
        // Update existing vote
        const { error } = await supabase
          .from('votes')
          .update({ vote_type: newVote })
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error voting:", error);
      toast.error("Failed to register vote: " + error.message);
      
      // Revert optimistic update on error
      setUpvotes(initialUpvotes);
      setDownvotes(initialDownvotes);
      setCurrentVote(userVote);
    } finally {
      setIsVoting(false);
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Button
        id={`upvote-button-${postId}`}
        variant="outline"
        size="sm"
        className={`flex items-center ${currentVote === "up" ? 'text-green-500' : ''}`}
        onClick={() => handleVote("up")}
        disabled={isVoting}
      >
        <ThumbsUp className="mr-2 h-4 w-4" />
        <span>{upvotes}</span>
      </Button>
      <Button
        id={`downvote-button-${postId}`}
        variant="outline"
        size="sm"
        className={`flex items-center ${currentVote === "down" ? 'text-red-500' : ''}`}
        onClick={() => handleVote("down")}
        disabled={isVoting}
      >
        <ThumbsDown className="mr-2 h-4 w-4" />
        <span>{downvotes}</span>
      </Button>
    </div>
  );
};

export default VoteButtons;
export type { VoteButtonsProps };
