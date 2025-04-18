
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';

interface PostReactionsProps {
  postId: string;
}

// Common emojis used for reactions
const availableEmojis = ["❤️", "👍", "👏", "🎉", "🔥", "😂", "🤔", "😢"];

const PostReactions = ({ postId }: PostReactionsProps) => {
  const { user, isAuthenticated } = useAuth();
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      // Get all reactions for this post
      const { data: allReactions, error } = await supabase
        .from('post_reactions')
        .select('emoji')
        .eq('post_id', postId);

      if (error) throw error;

      // Count reactions
      const counts: Record<string, number> = {};
      if (allReactions) {
        allReactions.forEach((reaction) => {
          counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
        });
      }
      setReactions(counts);

      // If user is authenticated, get their reactions
      if (isAuthenticated && user) {
        const { data: userReactionData, error: userError } = await supabase
          .from('post_reactions')
          .select('emoji')
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (userError) throw userError;

        setUserReactions(userReactionData?.map(r => r.emoji) || []);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchReactions();
    }
    
    // Set up realtime subscription for reactions
    const channel = supabase
      .channel(`post-reactions-${postId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` },
        () => {
          fetchReactions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, isAuthenticated, user?.id]);

  const toggleReaction = async (emoji: string) => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to react to posts");
      return;
    }

    try {
      if (userReactions.includes(emoji)) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id)
          .eq('emoji', emoji);

        if (error) throw error;

        toast.success(`You removed your ${emoji} reaction`);
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user!.id,
            emoji
          });

        if (error) throw error;

        toast.success(`You reacted with ${emoji}`);
      }

      // Update UI immediately
      fetchReactions();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error("Failed to update reaction");
    }
  };

  // Display reactions
  const renderReactionBadges = () => {
    return Object.entries(reactions)
      .sort((a, b) => b[1] - a[1]) // Sort by count, highest first
      .map(([emoji, count]) => (
        <Button
          key={emoji}
          variant="ghost" 
          size="sm"
          className={`px-2 py-1 h-auto rounded-full border ${
            userReactions.includes(emoji) 
              ? 'border-orange-500 bg-orange-500/10' 
              : 'border-gray-800'
          }`}
          onClick={() => toggleReaction(emoji)}
          disabled={!isAuthenticated}
        >
          <span className="mr-1">{emoji}</span>
          <span>{count}</span>
        </Button>
      ));
  };

  if (loading) {
    return <div className="h-8 my-2 flex gap-2 animate-pulse">
      <div className="h-8 w-16 bg-gray-800 rounded-full"></div>
      <div className="h-8 w-16 bg-gray-800 rounded-full"></div>
    </div>;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 items-center">
        {renderReactionBadges()}
        
        {isAuthenticated && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Smile className="h-4 w-4" />
                React
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-wrap gap-2">
                {availableEmojis.map(emoji => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className={`text-xl p-2 ${userReactions.includes(emoji) ? 'bg-orange-500/20' : ''}`}
                    onClick={() => toggleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default PostReactions;
