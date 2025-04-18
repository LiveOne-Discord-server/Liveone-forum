
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface FollowButtonProps {
  targetUserId: string;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

const FollowButton = ({ 
  targetUserId, 
  isFollowing = false,
  onFollow,
  onUnfollow
}: FollowButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const { user, isAuthenticated } = useAuth();
  
  const handleFollow = async () => {
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to follow users");
      return;
    }
    
    setLoading(true);
    
    try {
      if (following) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
          
        if (error) throw error;
        
        setFollowing(false);
        if (onUnfollow) onUnfollow();
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
          
        if (error) throw error;
        
        setFollowing(true);
        if (onFollow) onFollow();
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      toast.error("Failed to follow/unfollow. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      onClick={handleFollow}
      disabled={loading || !isAuthenticated}
    >
      {following ? (
        <>
          <UserCheck className="mr-2 h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
