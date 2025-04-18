
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Users } from 'lucide-react';
import FollowButton from './FollowButton';
import UserStatus from '@/components/auth/UserStatus';
import { supabase } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';
import RoleBadge from './RoleBadge';

interface UserProfileCardProps {
  user: User;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

const UserProfileCard = ({
  user,
  isFollowing = false,
  followerCount = 0,
  followingCount = 0,
  onFollow,
  onUnfollow,
}: UserProfileCardProps) => {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isCurrentUser = appUser?.id === user.id;
  
  const bannerStyle = user.banner_url 
    ? { backgroundImage: `url(${user.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
    : user.banner_color 
      ? { backgroundColor: user.banner_color } 
      : { background: 'linear-gradient(to right, #f97316, #ef4444)' }; // Orange gradient

  const avatarBorderClass = user.role === 'admin' 
    ? 'border-orange-500 shadow-lg shadow-orange-500/30' 
    : user.role === 'moderator' 
      ? 'border-purple-500 shadow-md shadow-purple-500/20' 
      : 'border-background';

  const startChat = async () => {
    if (!appUser) {
      toast.error("You need to be logged in to send messages");
      return;
    }
    
    setLoading(true);
    try {
      navigate(`/messages/${user.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error("Could not start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div 
        className="h-32 w-full" 
        style={bannerStyle}
      />
      
      <CardHeader className="-mt-12 flex flex-col items-center">
        <Avatar className={`h-24 w-24 border-4 ${avatarBorderClass}`}>
          <AvatarImage src={user.avatar || undefined} alt={user.username} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{user.username}</h2>
            <UserStatus status={user.status} />
          </div>
          
          {user.role && (user.role === 'admin' || user.role === 'moderator') && (
            <RoleBadge role={user.role} />
          )}
          
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{followerCount} Followers</span>
            </div>
            <div>•</div>
            <div>{followingCount} Following</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex justify-center gap-2">
        {!isCurrentUser && appUser && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={startChat}
              disabled={loading}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            
            <FollowButton
              targetUserId={user.id}
              isFollowing={isFollowing}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
            />
          </>
        )}
        
        {isCurrentUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile/edit')}
          >
            Edit Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
