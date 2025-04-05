
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface FollowersListProps {
  userId: string;
  followerCount: number;
  followingCount: number;
  trigger?: React.ReactNode;
}

interface FollowUser {
  id: string;
  username: string;
  avatar_url: string | null;
  status: string | null;
}

const FollowersList: React.FC<FollowersListProps> = ({ userId, followerCount, followingCount, trigger }) => {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [open, userId]);

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    try {
      // Get user IDs of followers
      const { data: followerData, error: followerError } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', userId);
      
      if (followerError) throw followerError;
      
      if (followerData && followerData.length > 0) {
        const followerIds = followerData.map(f => f.follower_id);
        
        // Get profile data for these followers
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, status')
          .in('id', followerIds);
          
        if (profileError) throw profileError;
        setFollowers(profileData || []);
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    try {
      // Get user IDs of following
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (followingError) throw followingError;
      
      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(f => f.following_id);
        
        // Get profile data for these following
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, status')
          .in('id', followingIds);
          
        if (profileError) throw profileError;
        setFollowing(profileData || []);
      } else {
        setFollowing([]);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
    setOpen(false);
  };

  const renderUserList = (users: FollowUser[], loading: boolean) => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    
    if (users.length === 0) {
      return (
        <div className="py-6 text-center text-muted-foreground">
          {t.profile?.noUsers || 'No users found'}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {users.map(user => (
          <div 
            key={user.id} 
            className="flex items-center p-3 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => handleUserClick(user.id)}
          >
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <p className="font-medium">{user.username}</p>
            </div>
            
            <Badge variant={user.status === 'online' ? 'default' : 'outline'} className="ml-2">
              {user.status || 'offline'}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">View Connections</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.profile?.connections || 'Connections'}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="followers" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="followers">
              {t.profile?.followers || 'Followers'} ({followerCount})
            </TabsTrigger>
            <TabsTrigger value="following">
              {t.profile?.following || 'Following'} ({followingCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-4">
            {renderUserList(followers, loadingFollowers)}
          </TabsContent>
          
          <TabsContent value="following" className="mt-4">
            {renderUserList(following, loadingFollowing)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersList;
