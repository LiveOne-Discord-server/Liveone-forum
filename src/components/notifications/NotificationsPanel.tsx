
import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, User, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Notification, useNotificationsStore } from '@/hooks/useNotificationsStore';

export const useNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useNotificationsStore();

  const fetchNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching notifications for user:', user.id);
      
      // This is now just a placeholder function since we're using local storage
      // In a real application, you might want to fetch notifications from an API or database
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');
      toast({
        title: 'Error',
        variant: 'destructive',
        content: 'Failed to load notifications'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a test notification (for development purposes)
  const createTestNotification = () => {
    if (!user) return;
    
    const newNotification: Notification = {
      id: uuidv4(),
      user_id: user.id,
      message: 'This is a test notification',
      action_type: 'test',
      created_at: new Date().toISOString(),
      is_read: false,
      sender_name: 'System',
    };
    
    addNotification(newNotification);
    toast({
      title: 'Success',
      content: 'Test notification created'
    });
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification
  };
};

const NotificationsPanel = () => {
  const { notifications, unreadCount, isLoading, error, fetchNotifications, markAsRead, markAllAsRead, createTestNotification } = useNotifications();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-gray-500">Please sign in to view notifications</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            className="text-xs h-7"
            title="Refresh notifications"
          >
            <RefreshCw size={16} />
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={createTestNotification}
              className="text-xs h-7"
              title="Create test notification"
            >
              +
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 p-4">
            <p className="text-red-400 text-center mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchNotifications}>
              Try Again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 p-4">
            <Bell className="h-8 w-8 text-gray-500 mb-2" />
            <p className="text-gray-500 text-center">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 hover:bg-gray-800/50 transition-colors ${!notification.is_read ? 'bg-gray-800/20' : ''}`}
              >
                <div className="flex gap-3">
                  {notification.sender_avatar ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.sender_avatar} alt={notification.sender_name || 'User'} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationsPanel;
