
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ThumbsUp, Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationListener = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Listen for likes
    const votesChannel = supabase
      .channel('votes-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `post_id=in.(select id from posts where author_id=eq.${user.id})`
        },
        async (payload) => {
          if (payload.new && payload.new.vote_type === 'up' && payload.new.user_id !== user.id) {
            // Fetch user info who voted
            const { data: voterData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', payload.new.user_id)
              .single();
              
            if (voterData) {
              toast(
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <span>New like on your post</span>
                </div>,
                {
                  description: (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                      // Fetch the post to navigate to it
                      supabase
                        .from('posts')
                        .select('id')
                        .eq('id', payload.new.post_id)
                        .single()
                        .then(({ data }) => {
                          if (data) {
                            navigate(`/post/${data.id}`);
                          }
                        });
                    }}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={voterData.avatar_url} alt={voterData.username} />
                        <AvatarFallback>{voterData.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{voterData.username} liked your post</span>
                    </div>
                  ),
                  duration: 5000,
                }
              );
            }
          }
        }
      );
      
    // Listen for profile views
    const profileViewsChannel = supabase
      .channel('profile-views')
      .on(
        'broadcast',
        { event: 'profile-view' },
        (payload) => {
          if (payload.payload && payload.payload.profileId === user.id && payload.payload.viewerId !== user.id) {
            // Show notification for profile view
            if (payload.payload.viewerUsername) {
              toast(
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span>Profile viewed</span>
                </div>,
                {
                  description: (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                      navigate(`/user/${payload.payload.viewerId}`);
                    }}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={payload.payload.viewerAvatar} alt={payload.payload.viewerUsername} />
                        <AvatarFallback>{payload.payload.viewerUsername[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{payload.payload.viewerUsername} viewed your profile</span>
                    </div>
                  ),
                  duration: 5000,
                }
              );
            }
          }
        }
      );
      
    // Listen for new messages
    const messagesChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.new && payload.new.sender_id !== user.id) {
            // Fetch sender info
            const { data: senderData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();
              
            if (senderData) {
              toast(
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span>New message</span>
                </div>,
                {
                  description: (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                      navigate(`/messages/${payload.new.sender_id}`);
                    }}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={senderData.avatar_url} alt={senderData.username} />
                        <AvatarFallback>{senderData.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{senderData.username} sent you a message</span>
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{payload.new.content}</p>
                    </div>
                  ),
                  duration: 5000,
                }
              );
            }
          }
        }
      );

    // Subscribe to all channels
    votesChannel.subscribe();
    profileViewsChannel.subscribe();
    messagesChannel.subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(profileViewsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, isAuthenticated, navigate]);

  return null; // This is a background component with no UI
};

export default NotificationListener;
