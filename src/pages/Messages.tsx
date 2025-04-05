
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at: string | null;
  sender?: {
    username: string;
    avatar_url: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
}

const Messages = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, appUser, isAuthenticated } = useAuth();
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error(t.auth?.pleaseSignIn || 'Please sign in to view messages');
      navigate('/');
      return;
    }

    if (!userId) {
      return;
    }

    const loadRecipient = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setRecipient(data);
      } catch (error) {
        console.error('Error loading recipient:', error);
        toast.error(t.messages?.recipientNotFound || 'Could not find recipient');
        navigate('/');
      }
    };

    const loadMessages = async () => {
      if (!user) return;
      
      try {
        // First, get all messages between these two users
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Filter messages to only include conversation between these two users
        const conversationMessages = data.filter(
          message => 
            (message.sender_id === user.id && message.recipient_id === userId) || 
            (message.sender_id === userId && message.recipient_id === user.id)
        );

        // Get sender info for each message
        const messageWithSenders: Message[] = await Promise.all(
          conversationMessages.map(async (message) => {
            if (message.sender_id === user.id) {
              // Current user is the sender
              return {
                ...message,
                sender: {
                  username: appUser?.username || 'You',
                  avatar_url: appUser?.avatar || ''
                }
              };
            } else {
              // Get sender info from profiles
              const { data: senderData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', message.sender_id)
                .single();
                
              return {
                ...message,
                sender: {
                  username: senderData?.username || 'Unknown',
                  avatar_url: senderData?.avatar_url || ''
                }
              };
            }
          })
        );
        
        setMessages(messageWithSenders);
        
        // Mark unread messages as read
        const unreadMessages = conversationMessages.filter(
          message => message.recipient_id === user.id && !message.read_at
        );
        
        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(msg => msg.id);
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error(t.messages?.loadError || 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipient();
    loadMessages();
    
    // Set up subscription to listen for new messages
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // Only handle messages from this conversation
          if (payload.new && payload.new.sender_id === userId) {
            loadMessages();
            
            // Show notification
            if (appUser) {
              toast.success(t.messages?.newMessage || 'New message', {
                description: `${recipient?.username || 'Someone'} sent you a message`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userId, navigate, t, isAuthenticated, appUser]);

  const sendMessage = async () => {
    if (!user || !recipient || !messageContent.trim()) return;
    
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: messageContent.trim(),
          sender_id: user.id,
          recipient_id: recipient.id
        });

      if (error) throw error;
      
      setMessageContent('');
      toast.success(t.messages?.sendSuccess || 'Message sent', {
        description: 'Your message has been sent successfully'
      });
      
      // Add the new message to the state
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(), // temporary ID until the page refreshes
          content: messageContent.trim(),
          sender_id: user.id,
          recipient_id: recipient.id,
          created_at: new Date().toISOString(),
          read_at: null,
          sender: {
            username: appUser?.username || 'You',
            avatar_url: appUser?.avatar || ''
          }
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t.messages?.sendError || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`container ${isMobile ? 'px-4' : 'max-w-3xl'} mx-auto py-6`}>
        <div className="flex flex-col items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300"></div>
          <p className="mt-4 text-sm text-gray-400">{t.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className={`container ${isMobile ? 'px-4' : 'max-w-3xl'} mx-auto py-6`}>
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t.common?.back || 'Back'}
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-400">{t.messages?.userNotFound || 'User not found'}</p>
              <Button
                variant="default"
                className="mt-4"
                onClick={() => navigate('/')}
              >
                {t.common?.goHome || 'Go Home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`container ${isMobile ? 'px-4' : 'max-w-3xl'} mx-auto py-6`}>
      <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>
      
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={recipient.avatar_url} alt={recipient.username} />
              <AvatarFallback>{recipient.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle>{recipient.username}</CardTitle>
          </div>
        </CardHeader>
      </Card>
      
      <div className="bg-gray-900 border border-gray-800 rounded-lg min-h-[400px] max-h-[500px] overflow-y-auto p-4 mb-4">
        <div className="flex flex-col space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">{t.messages?.noMessages || 'No messages yet'}</p>
              <p className="text-sm text-gray-500 mt-2">
                {t.messages?.startConversation || 'Send a message to start the conversation'}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user.id;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.username} />
                        <AvatarFallback>{message.sender?.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`
                      rounded-lg px-4 py-2 ${isOwnMessage 
                        ? 'bg-blue-600 text-white mr-2' 
                        : 'bg-gray-800 text-gray-100'
                      }
                    `}>
                      <p className="break-words">{message.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {format(new Date(message.created_at), 'HH:mm, MMM d')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Textarea
          placeholder={t.messages?.typeSomething || 'Type a message...'}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          className="bg-gray-900 border-gray-800 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button 
          onClick={sendMessage}
          disabled={!messageContent.trim() || isSending}
          className="h-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Messages;
