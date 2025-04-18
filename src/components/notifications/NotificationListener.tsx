
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useNotificationsStore } from '@/hooks/useNotificationsStore';
import { v4 as uuidv4 } from 'uuid';

const NotificationListener = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotificationsStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log("Setting up notification listeners for user:", user.id);

    // Create channels
    try {
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
            console.log("Received vote notification:", payload);
            if (payload.new && payload.new.vote_type === 'up' && payload.new.user_id !== user.id) {
              // Fetch user info who voted
              const { data: voterData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', payload.new.user_id)
                .single();
                
              if (voterData) {
                toast({
                  title: "New like on your post",
                  description: `${voterData.username} liked your post`
                });
                
                // Add to notifications store
                addNotification({
                  id: uuidv4(),
                  user_id: user.id,
                  sender_id: payload.new.user_id,
                  sender_name: voterData.username,
                  sender_avatar: voterData.avatar_url,
                  message: `${voterData.username} liked your post`,
                  action_type: 'post_like',
                  action_id: payload.new.post_id,
                  created_at: new Date().toISOString(),
                  is_read: false
                });
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
            console.log("Received profile view notification:", payload);
            if (payload.payload && payload.payload.profileId === user.id && payload.payload.viewerId !== user.id) {
              // Show notification for profile view
              if (payload.payload.viewerUsername) {
                toast({
                  title: "Profile viewed",
                  description: `${payload.payload.viewerUsername} viewed your profile`
                });
                
                // Add to notifications store
                addNotification({
                  id: uuidv4(),
                  user_id: user.id,
                  sender_id: payload.payload.viewerId,
                  sender_name: payload.payload.viewerUsername,
                  sender_avatar: payload.payload.viewerAvatar,
                  message: `${payload.payload.viewerUsername} viewed your profile`,
                  action_type: 'profile_view',
                  action_id: user.id,
                  created_at: new Date().toISOString(),
                  is_read: false
                });
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
            console.log("Received message notification:", payload);
            if (payload.new && payload.new.sender_id !== user.id) {
              // Fetch sender info
              const { data: senderData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', payload.new.sender_id)
                .single();
                
              if (senderData) {
                toast({
                  title: "New message",
                  description: `${senderData.username} sent you a message`
                });
                
                // Add to notifications store
                addNotification({
                  id: uuidv4(),
                  user_id: user.id,
                  sender_id: payload.new.sender_id,
                  sender_name: senderData.username,
                  sender_avatar: senderData.avatar_url,
                  message: `${senderData.username} sent you a message`,
                  action_type: 'new_message',
                  action_id: payload.new.sender_id,
                  created_at: new Date().toISOString(),
                  is_read: false
                });
              }
            }
          }
        );

      // Subscribe to all channels
      votesChannel.subscribe((status) => {
        console.log(`Votes channel status: ${status}`);
      });
      
      profileViewsChannel.subscribe((status) => {
        console.log(`Profile views channel status: ${status}`);
      });
      
      messagesChannel.subscribe((status) => {
        console.log(`Messages channel status: ${status}`);
      });

      return () => {
        console.log("Cleaning up notification listeners");
        supabase.removeChannel(votesChannel);
        supabase.removeChannel(profileViewsChannel);
        supabase.removeChannel(messagesChannel);
      };
    } catch (error) {
      console.error("Error setting up notification listeners:", error);
    }
  }, [user, isAuthenticated, navigate, addNotification]);

  return null; // This is a background component with no UI
};

export default NotificationListener;
