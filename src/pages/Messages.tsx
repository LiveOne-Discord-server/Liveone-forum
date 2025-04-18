
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowDown, Send, Paperclip, X } from 'lucide-react';
import { VoiceMessageRecorder } from '@/components/chat/VoiceMessageRecorder';
import AudioMessage from '@/components/chat/AudioMessage';
import MediaMessage from '@/components/chat/MediaMessage';
import MediaUploader from '@/components/chat/MediaUploader';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// Message type definition
interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  media_url?: string;
  media_type?: string;
  file_name?: string;
}

// Message group by date
interface MessageGroup {
  date: string;
  messages: Message[];
}

export function Messages() {
  const { user } = useAuth();
  const { userId } = useParams();
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [recipient, setRecipient] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [content, setContent] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sendMediaMessage = async (mediaUrl: string, mediaType: string, fileName?: string) => {
    if (!user || !recipient) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: mediaType === 'image' ? 'Image' : 
                  mediaType === 'video' ? 'Video' : 
                  mediaType === 'voice' ? 'Voice message' : 'File',
          sender_id: user.id,
          recipient_id: recipient.id,
          media_url: mediaUrl,
          media_type: mediaType,
          file_name: fileName
        });

      if (error) throw error;
      
      toast.success(t.messages?.sendSuccess || 'Media sent');
      
      loadMessages();
    } catch (error) {
      console.error('Error sending media message:', error);
      toast.error(t.messages?.sendError || 'Failed to send media');
    }
  };

  const loadMessages = async () => {
    if (!user || !userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Group messages by date
      groupMessagesByDate(data || []);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error(t.messages?.loadError || 'Failed to load messages');
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};
    
    messages.forEach(message => {
      try {
        // Make sure the date is valid before processing
        const messageDate = parseISO(message.created_at);
        if (!isValid(messageDate)) {
          console.error('Invalid date:', message.created_at);
          return;
        }
        
        const date = messageDate.toLocaleDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      } catch (error) {
        console.error('Error parsing date:', message.created_at, error);
        // Skip messages with invalid dates
      }
    });
    
    const groupArray = Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
    
    setMessageGroups(groupArray);
  };

  const loadRecipient = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setRecipient(data);
    } catch (error) {
      console.error('Error loading recipient:', error);
      toast.error(t.messages?.recipientLoadError || 'Failed to load recipient');
    }
  };

  useEffect(() => {
    loadMessages();
    loadRecipient();

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user?.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user?.id}))`,
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, user]);

  const sendMessage = async () => {
    if (!user || !recipient || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          recipient_id: recipient.id,
        });

      if (error) throw error;
      setContent('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t.messages?.sendError || 'Failed to send message');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isNotAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredMessages = messages.filter(msg => 
    msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageDate = (dateString: string) => {
    try {
      const messageDate = parseISO(dateString);
      if (!isValid(messageDate)) {
        return 'Unknown date';
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (messageDate.toDateString() === today.toDateString()) {
        return t.messages?.today || 'Today';
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return t.messages?.yesterday || 'Yesterday';
      } else {
        return format(messageDate, 'EEEE, d MMMM', { locale: ru });
      }
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Unknown date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return '--:--';
      }
      return format(date, 'HH:mm', { locale: ru });
    } catch (error) {
      console.error('Error formatting time:', dateString, error);
      return '--:--';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {recipient && (
        <div className="p-3 border-b flex items-center gap-2 bg-card/50">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {recipient.avatar_url ? (
              <img 
                src={recipient.avatar_url} 
                alt={recipient.username} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium">{recipient.username?.[0]}</span>
            )}
          </div>
          <div>
            <h2 className="font-medium">{recipient.username}</h2>
            <p className="text-xs text-muted-foreground">
              {recipient.status === 'online' ? 'Online' : 'Offline'}
            </p>
          </div>
          
          {showSearch ? (
            <div className="ml-auto flex items-center gap-2">
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.messages?.searchPlaceholder || "Search messages..."}
                className="w-48"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-background/50 to-background"
      >
        {messageGroups.map((group) => (
          <div key={group.date} className="space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative bg-background px-4 text-xs text-muted-foreground">
                {formatMessageDate(group.date)}
              </div>
            </div>
            
            {group.messages.map((message) => (
              <div key={message.id}>
                {message.media_type === 'voice' ? (
                  <AudioMessage 
                    url={message.media_url || ''}
                    timestamp={message.created_at}
                    isOutgoing={message.sender_id === user?.id}
                    sender={message.sender_id !== user?.id ? {
                      avatar: recipient?.avatar_url,
                      name: recipient?.username || 'User'
                    } : undefined}
                  />
                ) : message.media_url ? (
                  <MediaMessage 
                    url={message.media_url}
                    mediaType={message.media_type || 'file'}
                    fileName={message.file_name}
                    timestamp={message.created_at}
                    isOutgoing={message.sender_id === user?.id}
                    content={message.content}
                    sender={message.sender_id !== user?.id ? {
                      avatar: recipient?.avatar_url,
                      name: recipient?.username || 'User'
                    } : undefined}
                  />
                ) : (
                  <div className={`flex mb-2 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    {message.sender_id !== user?.id && (
                      <div className="h-8 w-8 rounded-full mr-2 bg-muted flex items-center justify-center overflow-hidden">
                        {recipient?.avatar_url ? (
                          <img 
                            src={recipient.avatar_url} 
                            alt={recipient.username} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{recipient?.username?.[0]}</span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col max-w-[75%]">
                      <div className={`rounded-xl p-3 ${
                        message.sender_id === user?.id 
                          ? 'bg-primary/10 text-primary-foreground ml-auto border border-primary/10' 
                          : 'bg-muted border border-muted/50'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <span className={`text-xs text-muted-foreground mt-1 ${
                        message.sender_id === user?.id ? 'ml-auto mr-1' : 'ml-1'
                      }`}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        
        {messageGroups.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Send className="h-8 w-8 opacity-50" />
              </div>
              <h3 className="font-medium mb-1">{t.messages?.noMessages || 'No messages yet'}</h3>
              <p className="text-sm">{t.messages?.startConversation || 'Start the conversation!'}</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-20 right-4 rounded-full shadow-lg z-10"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}

      <div className="border-t p-3 bg-card/50">
        <div className="flex items-end gap-2">
          <div className="relative flex-1 rounded-md border border-input bg-background overflow-hidden">
            <Input
              placeholder={t.messages?.placeholder || 'Type a message...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="absolute bottom-0 right-0 p-2 flex items-center gap-1">
              <MediaUploader onSend={sendMediaMessage} />
            </div>
          </div>
          <VoiceMessageRecorder onSend={sendMediaMessage} />
          <Button 
            onClick={sendMessage} 
            disabled={!content.trim()} 
            size="icon"
            className="rounded-full h-10 w-10 bg-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
