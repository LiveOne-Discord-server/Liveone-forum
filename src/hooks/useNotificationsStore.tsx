
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  action_type: string;
  action_id?: string;
  created_at: string;
  is_read: boolean;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (notificationId: string) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification: Notification) => 
        set((state) => {
          // Check if notification with same ID already exists
          if (state.notifications.some(n => n.id === notification.id)) {
            return state;
          }
          
          const newNotifications = [notification, ...state.notifications];
          const newUnreadCount = newNotifications.filter(n => !n.is_read).length;
          
          return { 
            notifications: newNotifications,
            unreadCount: newUnreadCount
          };
        }),
      markAsRead: (notificationId: string) => 
        set((state) => {
          const updatedNotifications = state.notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          );
          
          return { 
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.is_read).length
          };
        }),
      markAllAsRead: () => 
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0
        })),
      clearNotifications: () => 
        set({ notifications: [], unreadCount: 0 }),
      removeNotification: (notificationId: string) =>
        set((state) => {
          const updatedNotifications = state.notifications.filter(n => n.id !== notificationId);
          const newUnreadCount = updatedNotifications.filter(n => !n.is_read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount: newUnreadCount
          };
        })
    }),
    {
      name: 'notifications-storage',
    }
  )
);
