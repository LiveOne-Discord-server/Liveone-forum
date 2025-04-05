
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface VoteButtonsProps {
  postId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote: 'up' | 'down' | null;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({ 
  postId, 
  initialUpvotes, 
  initialDownvotes, 
  userVote: initialUserVote 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [vote, setVote] = useState<'up' | 'down' | null>(initialUserVote || null);
  const [voteCount, setVoteCount] = useState({
    up: initialUpvotes,
    down: initialDownvotes
  });
  const queryClient = useQueryClient();

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast.error("You need to sign in to vote");
      return;
    }

    try {
      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user!.id)
        .eq('post_id', postId)
        .single();
      
      if (existingVote) {
        // User has already voted, so update or delete the vote
        if (existingVote.vote_type === voteType) {
          // Remove the vote if clicking the same button
          await supabase
            .from('votes')
            .delete()
            .eq('user_id', user!.id)
            .eq('post_id', postId);
            
          setVote(null);
          setVoteCount(prev => ({
            ...prev,
            [voteType]: prev[voteType] - 1
          }));
        } else {
          // Change the vote type
          await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('user_id', user!.id)
            .eq('post_id', postId);
            
          setVote(voteType);
          setVoteCount(prev => ({
            up: voteType === 'up' ? prev.up + 1 : prev.up - (existingVote.vote_type === 'up' ? 1 : 0),
            down: voteType === 'down' ? prev.down + 1 : prev.down - (existingVote.vote_type === 'down' ? 1 : 0)
          }));
        }
      } else {
        // Insert a new vote
        await supabase
          .from('votes')
          .insert({
            user_id: user!.id,
            post_id: postId,
            vote_type: voteType
          });
          
        setVote(voteType);
        setVoteCount(prev => ({
          ...prev,
          [voteType]: prev[voteType] + 1
        }));
      }

      // Invalidate posts query to update UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to register your vote');
    }
  };

  return (
    <div className="flex items-center">
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn(
          "px-2",
          vote === 'up' && "text-neon-orange"
        )}
        onClick={() => handleVote('up')}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        <span>{voteCount.up}</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn(
          "px-2",
          vote === 'down' && "text-destructive"
        )}
        onClick={() => handleVote('down')}
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        <span>{voteCount.down}</span>
      </Button>
    </div>
  );
};

export default VoteButtons;
