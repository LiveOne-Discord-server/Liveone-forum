import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, MessageSquare, UserCheck, UserPlus, Calendar, Clock, Send, FileText, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/hooks/useLanguage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import PostCard from '@/components/posts/PostCard';
import { Post } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import VoiceMessageRecorder from '@/components/chat/VoiceMessageRecorder';
import FollowersList from '@/components/users/FollowersList';

interface ProfileData {
  id: string;
  username: string;
  avatar_url?: string;
  status?: string;
  created_at?: string;
  postCount?: number;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  banner_color?: string;
  banner_url?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at?: string;
  voice_url?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [bannerColor, setBannerColor] = useState<string>('#4f46e5');
  const [customBannerUrl, setCustomBannerUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          upvotes,
          downvotes,
          author_id
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching user posts:', error);
        return [];
      }
      
      const postsWithMedia = await Promise.all(data.map(async (postItem) => {
        const { data: mediaData } = await supabase
          .from('post_media')
          .select('url')
          .eq('post_id', postItem.id)
          .order('created_at', { ascending: true })
          .limit(1);
          
        const { data: tagsData } = await supabase
          .from('post_tags')
          .select(`
            tag_id,
            tags:tag_id (
              id,
              name,
              color
            )
          `)
          .eq('post_id', postItem.id);
          
        const tags = tagsData?.map(tagRelation => tagRelation.tags) || [];
        
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('username, avatar_url, role')
          .eq('id', postItem.author_id)
          .single();
          
        if (authorError) {
          console.error('Error fetching author:', authorError);
        }
        
        let userVote = null;
        if (user?.id) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('post_id', postItem.id)
            .eq('user_id', user.id)
            .single();
            
          if (voteData) {
            userVote = voteData.vote_type;
          }
        }
        
        const formattedPost: Post = {
          id: postItem.id,
          title: postItem.title,
          content: postItem.content,
          authorId: postItem.author_id,
          createdAt: postItem.created_at,
          upvotes: postItem.upvotes || 0,
          downvotes: postItem.downvotes || 0,
          userVote: userVote,
          tags: tags || [],
          mediaUrls: mediaData ? mediaData.map(m => m.url) : [],
          author: {
            id: postItem.author_id,
            username: authorData?.username || 'Unknown User',
            avatar: authorData?.avatar_url || null,
            role: authorData?.role || 'user',
            provider: 'github',
            status: 'online'
          }
        };
        
        return formattedPost;
      }));
      
      return postsWithMedia;
    },
    enabled: !!userId,
  });
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userId);
          
        let isFollowing = false;
        if (user?.id) {
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', userId);
            
          isFollowing = followData && followData.length > 0;
        }
        
        const { count: followerCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
          
        const { count: followingCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
          
        if (profileData && 'banner_color' in profileData) {
          setBannerColor(profileData.banner_color || '#4f46e5');
        }
        
        if (profileData && 'banner_url' in profileData) {
          setCustomBannerUrl(profileData.banner_url || null);
        }
        
        setProfile({
          ...profileData,
          postCount: postCount || 0,
          isFollowing,
          followerCount: followerCount || 0,
          followingCount: followingCount || 0
        });
        
        setIsFollowing(isFollowing);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId, user?.id]);
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${userId})`)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setMessages(data || []);
        
        const unreadMessages = data?.filter(msg => 
          msg.recipient_id === user.id && 
          msg.sender_id === userId && 
          !msg.read_at
        ) || [];
        
        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(msg => msg.id);
          
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    if (userId && user?.id) {
      const subscription = supabase
        .channel('messages-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId},recipient_id=eq.${user.id}`
        }, (payload) => {
          setMessages(prev => [payload.new as Message, ...prev]);
          
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', payload.new.id);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userId, user?.id]);
  
  useEffect(() => {
    if (userId && appUser && user && userId !== user.id) {
      const channel = supabase.channel('profile-views');
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'profile-view',
            payload: {
              profileId: userId,
              viewerId: user.id,
              viewerUsername: appUser.username,
              viewerAvatar: appUser.avatar,
              timestamp: new Date().toISOString()
            }
          });
        }
      });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, user, appUser]);
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !userId) return;
    
    setIsSendingMessage(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: userId,
          content: messageText.trim()
        });
        
      if (error) throw error;
      
      const newMessage = {
        id: Date.now().toString(),
        content: messageText.trim(),
        sender_id: user.id,
        created_at: new Date().toISOString(),
        read_at: null
      };
      
      setMessages(prev => [newMessage, ...prev]);
      setMessageText('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  const handleToggleFollow = async () => {
    if (!user || !userId) {
      toast.error('You must be logged in to follow users');
      return;
    }
    
    setIsUpdatingFollow(true);
    
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        setIsFollowing(false);
        setProfile(prev => prev ? {
          ...prev,
          isFollowing: false,
          followerCount: (prev.followerCount || 0) - 1
        } : null);
        
        toast.success('Unfollowed user');
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        setProfile(prev => prev ? {
          ...prev,
          isFollowing: true,
          followerCount: (prev.followerCount || 0) + 1
        } : null);
        
        toast.success('Now following user');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsUpdatingFollow(false);
    }
  };
  
  const handleBannerColorChange = async (color: string) => {
    if (!user || user.id !== userId) return;
    
    setBannerColor(color);
    try {
      const updates: Record<string, any> = {
        banner_color: color
      };
      
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      toast.success('Banner color updated');
    } catch (error) {
      console.error('Error updating banner color:', error);
      toast.error('Failed to update banner color');
    }
  };
  
  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || user.id !== userId || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `banner/${user.id}/banner.${fileExt}`;
    
    try {
      const { error: uploadError } = await supabase
        .storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = await supabase
        .storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      if (!urlData) throw new Error('Failed to get public URL');
      
      const updates: Record<string, any> = {
        banner_url: urlData.publicUrl
      };
      
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      setCustomBannerUrl(urlData.publicUrl);
      toast.success('Banner updated');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner image');
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t.common?.back || 'Back'}
        </Button>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-4">User not found</h2>
            <p className="text-muted-foreground mb-6">This user profile doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>
      
      <Card className="mb-8 overflow-hidden">
        {customBannerUrl ? (
          <div 
            className="h-32 bg-center bg-cover" 
            style={{ backgroundImage: `url(${customBannerUrl})` }}
          ></div>
        ) : (
          <div 
            className="h-32"
            style={{ background: bannerColor || 'linear-gradient(to right, #4f46e5, #7c3aed)' }}
          ></div>
        )}
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-12 mb-4 relative z-10">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-background">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="mt-4 md:mt-0 md:ml-6 flex-grow">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <div className="flex items-center mt-1">
                    <Badge variant={profile.status === 'online' ? 'default' : 'outline'} className="text-xs">
                      {profile.status === 'online' ? 'Online' : profile.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3 md:mt-0 ml-auto">
                  {user && userId !== user.id && (
                    <>
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        size="sm" 
                        onClick={handleToggleFollow}
                        disabled={isUpdatingFollow}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate(`/messages/${userId}`)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-6 text-center">
            <div>
              <div className="text-2xl font-bold">{profile.postCount}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="cursor-pointer" onClick={(e) => e.preventDefault()}>
              <FollowersList 
                userId={userId}
                followerCount={profile.followerCount || 0}
                followingCount={profile.followingCount || 0}
                trigger={
                  <div>
                    <div className="text-2xl font-bold">{profile.followerCount}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                }
              />
            </div>
            <div className="cursor-pointer" onClick={(e) => e.preventDefault()}>
              <FollowersList 
                userId={userId}
                followerCount={profile.followerCount || 0}
                followingCount={profile.followingCount || 0}
                trigger={
                  <div>
                    <div className="text-2xl font-bold">{profile.followingCount}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                }
              />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {profile.created_at ? formatDistanceToNow(new Date(profile.created_at)) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Member for</div>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Joined {profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last seen {profile.status === 'online' ? 'just now' : 'recently'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Latest activity {profile.postCount ? 'posting content' : 'no recent activity'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
              >
                <FollowersList 
                  userId={userId}
                  followerCount={profile.followerCount || 0}
                  followingCount={profile.followingCount || 0}
                  trigger={<span>View followers and following</span>}
                />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <Tabs defaultValue="posts">
        <TabsList className="w-full">
          <TabsTrigger id="posts-tab" value="posts" className="flex-1">Posts</TabsTrigger>
          {user && userId !== user.id && (
            <TabsTrigger id="messages-tab" value="messages" className="flex-1">Messages</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="posts" className="mt-6 space-y-6">
          {postsLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground text-center">
                  This user hasn't published any posts yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {user && userId !== user.id && (
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages with {profile?.username}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col-reverse space-y-reverse space-y-4 h-[400px] overflow-y-auto mb-4 p-2">
                  {messages.length > 0 ? (
                    messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender_id === user.id 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-800 border border-gray-700'
                          }`}
                        >
                          {message.voice_url ? (
                            <div className="flex flex-col gap-2">
                              <div className="text-sm">{message.content}</div>
                              <audio controls src={message.voice_url} className="max-w-full" />
                            </div>
                          ) : (
                            <div className="text-sm">{message.content}</div>
                          )}
                          <div className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!messageText.trim() || isSendingMessage}
                    className="flex-none"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <VoiceMessageRecorder 
                    recipientId={userId}
                    userId={user.id}
                    onMessageSent={() => {
                      const fetchMessages = async () => {
                        if (!userId || !user) return;
                        try {
                          const { data, error } = await supabase
                            .from('messages')
                            .select('*')
                            .or(`and(sender_id.eq.${userId},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${userId})`)
                            .order('created_at', { ascending: false });
                            
                          if (error) throw error;
                          setMessages(data || []);
                        } catch (error) {
                          console.error('Error fetching messages:', error);
                        }
                      };
                      
                      fetchMessages();
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default UserProfile;
