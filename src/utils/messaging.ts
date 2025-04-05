
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Message data structure
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

// Get conversations for the current user
export const getUserConversations = async (userId: string) => {
  try {
    console.log('Fetching conversations for user:', userId);
    
    // Get all messages where the user is either sender or recipient
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
    
    // Group messages by conversation (the other user's ID)
    const conversations: Record<string, Message[]> = {};
    
    data?.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.recipient_id : message.sender_id;
      
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = [];
      }
      
      conversations[otherUserId].push(message);
    });
    
    console.log('Fetched conversations:', Object.keys(conversations).length);
    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    toast.error('Failed to load your conversations');
    return {};
  }
};

// Get conversation with a specific user
export const getConversationWithUser = async (currentUserId: string, otherUserId: string) => {
  try {
    console.log('Fetching conversation between', currentUserId, 'and', otherUserId);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
    
    console.log('Fetched messages:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error fetching conversation:', error);
    toast.error('Failed to load conversation');
    return [];
  }
};

// Send a message
export const sendMessage = async (senderId: string, recipientId: string, content: string) => {
  try {
    console.log('Sending message from', senderId, 'to', recipientId);
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
    
    console.log('Message sent successfully');
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (messageIds: string[]) => {
  try {
    if (!messageIds.length) return true;
    
    console.log('Marking messages as read:', messageIds);
    
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);
      
    if (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
    
    console.log('Messages marked as read');
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
};

// Subscribe to new messages
export const subscribeToMessages = (
  userId: string, 
  onNewMessage: (message: Message) => void
) => {
  console.log('Subscribing to messages for user:', userId);
  
  return supabase
    .channel('messages-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${userId}`
    }, (payload) => {
      console.log('New message received:', payload);
      onNewMessage(payload.new as Message);
    })
    .subscribe();
};
