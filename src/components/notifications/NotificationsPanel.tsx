
import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/utils/supabase';

export type Notification = {
  id: string;
  user_id: string;
  sender_id: string | null;
  sender_name?: string;
  sender_avatar?: string;
  type: 'mention' | 'comment' | 'like' | 'follow' | 'system' | 'message';
  content: string;
  read_at: string | null;
  created_at: string;
  target_id?: string;
  target_type?: 'post' | 'comment' | 'user';
};

// Custom hook to manage notifications
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      // Get messages as notifications
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (messagesError) throw messagesError;
      
      // Create a set of unique sender IDs to fetch profiles
      const senderIds = new Set<string>();
      messagesData?.forEach(message => {
        if (message.sender_id) {
          senderIds.add(message.sender_id);
        }
      });
      
      // Fetch profiles for all senders in one go
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(senderIds));
      
      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
        // Continue anyway, we'll use fallback names/avatars
      }
      
      // Create a map of sender IDs to their profile data
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Transform messages into notifications format
      const transformedNotifications: Notification[] = (messagesData || []).map(message => {
        const senderProfile = message.sender_id ? profileMap.get(message.sender_id) : null;
        
        return {
          id: message.id,
          user_id: message.recipient_id,
          sender_id: message.sender_id,
          sender_name: senderProfile?.username || 'Unknown User',
          sender_avatar: senderProfile?.avatar_url || '',
          type: 'message',
          content: `New message: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
          read_at: message.read_at,
          created_at: message.created_at,
          target_id: message.sender_id,
          target_type: 'user'
        };
      });
      
      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show toast here to avoid continuous error toasts
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      
      // Set up realtime subscription for new messages (as notifications)
      const channel = supabase
        .channel('messages-notifications')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  return { notifications, unreadCount, loading, fetchNotifications };
};

const NotificationsPanel = () => {
  const { notifications, unreadCount, loading, fetchNotifications } = useNotifications();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [markingAsRead, setMarkingAsRead] = useState(false);

  if (!user) {
    return (
      <div className="p-4 text-center">
        {t.notifications?.loginRequired || 'Please log in to see notifications'}
      </div>
    );
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || markingAsRead) return;
    
    setMarkingAsRead(true);
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null);
      
      if (error) throw error;
      
      fetchNotifications();
      toast.success(t.notifications?.allMarkedAsRead || 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setMarkingAsRead(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="font-medium">
          {t.notifications?.title || 'Notifications'}
        </h3>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAsRead}
          >
            {t.notifications?.markAllAsRead || 'Mark all as read'}
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="rounded-full bg-gray-800 h-10 w-10"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-10 w-10 text-gray-500 mb-2" />
            <p>{t.notifications?.noNotifications || 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex items-start p-3 hover:bg-gray-800/50 ${notification.read_at ? '' : 'bg-gray-800/30'}`}
              >
                <Avatar className="h-8 w-8 mr-3">
                  {notification.sender_avatar ? (
                    <AvatarImage src={notification.sender_avatar} alt={notification.sender_name || 'User'} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{notification.content}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
                
                {!notification.read_at && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2 h-6 w-6"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationsPanel;
