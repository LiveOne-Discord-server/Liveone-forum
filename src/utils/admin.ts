
import { supabase } from "@/integrations/supabase/client";

// Check if the current user is an admin
export const isUserAdmin = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;
  
  // Special case for our specific admin account
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profileError || !profile) return false;
  
  // Check if this is our special admin email
  if (profile.email === 'baneronetwo@memeware.net') {
    // If it's our special admin, update their role to admin if not already
    if (profile.role !== 'admin') {
      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
    }
    return true;
  }
  
  return profile.role === 'admin';
};

// Function to get user posts
export const getUserPosts = async (userId: string) => {
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
    
  if (error || !data) return [];
  
  // Get the author profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .eq('id', userId)
    .single();
    
  // Get post tags
  const { data: postTagsData } = await supabase
    .from('post_tags')
    .select('post_id, tags(id, name)')
    .in('post_id', data.map(post => post.id));
    
  // Create a lookup for post tags
  const postTagsMap = {};
  postTagsData?.forEach(postTag => {
    if (!postTagsMap[postTag.post_id]) {
      postTagsMap[postTag.post_id] = [];
    }
    if (postTag.tags) {
      postTagsMap[postTag.post_id].push(postTag.tags);
    }
  });
  
  // Get post media
  const { data: mediaData } = await supabase
    .from('post_media')
    .select('post_id, url')
    .in('post_id', data.map(post => post.id));
    
  // Create a lookup for post media
  const mediaMap = {};
  mediaData?.forEach(media => {
    if (!mediaMap[media.post_id]) {
      mediaMap[media.post_id] = [];
    }
    mediaMap[media.post_id].push(media.url);
  });
  
  // Get post settings for pinned status
  const { data: settingsData } = await supabase
    .from('post_settings')
    .select('post_id, is_pinned')
    .in('post_id', data.map(post => post.id));
    
  const pinnedMap = {};
  settingsData?.forEach(setting => {
    pinnedMap[setting.post_id] = setting.is_pinned;
  });
  
  return data.map(post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    authorId: post.author_id,
    author: {
      id: userId,
      username: profile?.username || 'Unknown User',
      avatar: profile?.avatar_url,
      provider: 'github' as 'github' | 'discord' | 'email',
      role: profile?.role || 'user',
      status: 'online'
    },
    createdAt: post.created_at,
    tags: postTagsMap[post.id] || [],
    upvotes: post.upvotes || 0,
    downvotes: post.downvotes || 0,
    mediaUrls: mediaMap[post.id] || [],
    isPinned: pinnedMap[post.id] || false
  }));
};
