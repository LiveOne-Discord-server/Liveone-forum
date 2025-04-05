
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FollowButtonProps {
  userId: string;
  onToggle?: (isFollowing: boolean) => void;
  className?: string;
}

const FollowButton = ({ userId, onToggle, className = '' }: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.id || !userId) {
        setIsChecking(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking follow status:', error);
        }
        
        setIsFollowing(!!data);
      } catch (error) {
        console.error('Exception checking follow status:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkFollowStatus();
  }, [user?.id, userId]);

  const handleToggleFollow = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to follow users');
      return;
    }
    
    if (user.id === userId) {
      toast.error('You cannot follow yourself');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        setIsFollowing(false);
        if (onToggle) onToggle(false);
        toast.success('Unfollowed user');
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        if (onToggle) onToggle(true);
        toast.success('Now following user');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button variant="outline" size="sm" className={className} disabled>
        <div className="w-4 h-4 border-2 border-t-blue-500 border-b-blue-700 rounded-full animate-spin mr-2"></div>
        Loading...
      </Button>
    );
  }

  return (
    <Button 
      variant={isFollowing ? "outline" : "default"}
      size="sm" 
      onClick={handleToggleFollow}
      disabled={isLoading || !user || user.id === userId}
      className={className}
    >
      {isFollowing ? (
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
