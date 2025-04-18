
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

/**
 * Check if a user has admin privileges
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking if user is admin:', error);
    return false;
  }
};

/**
 * Check if a user has moderator privileges
 */
export const isUserModerator = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return data?.role === 'moderator';
  } catch (error) {
    console.error('Error checking if user is moderator:', error);
    return false;
  }
};

/**
 * Check if a user has admin or moderator privileges
 */
export const isUserAdminOrMod = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return data?.role === 'admin' || data?.role === 'moderator';
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

/**
 * Get user's posts
 */
export const getUserPosts = async (userId: string) => {
  try {
    // First, let's get all posts by this user
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });
    
    if (postError) throw postError;
    if (!postData) return [];

    // Then, get the author details separately
    const { data: authorData, error: authorError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, role, status')
      .eq('id', userId)
      .single();
    
    if (authorError) {
      console.error('Error fetching author data:', authorError);
    }

    // Define valid status values to ensure type safety
    const validStatus = ['online', 'offline', 'dnd', 'idle'] as const;
    
    // Helper function to validate status
    const validateStatus = (status: string | null | undefined): 'online' | 'offline' | 'dnd' | 'idle' => {
      if (!status || !validStatus.includes(status as any)) {
        return 'offline';
      }
      return status as 'online' | 'offline' | 'dnd' | 'idle';
    };

    // Helper function to validate role
    const validateRole = (role: string | null | undefined): 'user' | 'admin' | 'moderator' => {
      if (role === 'admin') return 'admin';
      if (role === 'moderator') return 'moderator';
      return 'user'; // Default to 'user' for any other value
    };

    // Transform the data to match the expected Post type
    const posts = postData.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author_id,
      author: {
        id: authorData?.id || userId,
        username: authorData?.username || 'Unknown',
        avatar: authorData?.avatar_url,
        role: validateRole(authorData?.role),
        provider: 'unknown', // Default value as we don't have this info
        status: validateStatus(authorData?.status)
      },
      createdAt: post.created_at,
      lastEdited: post.last_edited_at,
      tags: [], // Will be populated later
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      isPinned: false, // Default value, will be updated if settings exist
      userVote: null,
      mediaUrls: [] // Initialize empty array for media URLs
    }));
    
    // Get post settings for each post
    for (const post of posts) {
      const { data: settingsData } = await supabase
        .from('post_settings')
        .select('*')
        .eq('post_id', post.id)
        .single();
        
      if (settingsData) {
        post.isPinned = settingsData.is_pinned;
      }
    }
    
    // Get tags for each post
    for (const post of posts) {
      const { data: tagData, error: tagError } = await supabase
        .from('post_tags')
        .select('tags(*)')
        .eq('post_id', post.id);
        
      if (!tagError && tagData) {
        post.tags = tagData.map(item => item.tags);
      }
    }

    // Get media for each post
    for (const post of posts) {
      const { data: mediaData, error: mediaError } = await supabase
        .from('post_media')
        .select('url')
        .eq('post_id', post.id);
        
      if (!mediaError && mediaData) {
        post.mediaUrls = mediaData.map(item => item.url);
      }
    }
    
    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
};

/**
 * Ban a user
 */
export const banUser = async (
  adminId: string, 
  userToBanId: string, 
  reason: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // First check if requester is admin or mod
    const isAdminOrMod = await isUserAdminOrMod(adminId);
    
    if (!isAdminOrMod) {
      return { 
        success: false, 
        message: 'You do not have permission to ban users' 
      };
    }
    
    // Then check if user to ban exists
    const { data: userToBan, error: userCheckError } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', userToBanId)
      .single();
      
    if (userCheckError) {
      return { 
        success: false, 
        message: 'User not found' 
      };
    }
    
    // Cannot ban admins or moderators
    if (userToBan.role === 'admin' || userToBan.role === 'moderator') {
      return { 
        success: false, 
        message: 'Cannot ban administrators or moderators' 
      };
    }
    
    // Call the ban_user function (this will need to be created on the Supabase end)
    const { data, error } = await supabase.functions.invoke('ban_user', {
      body: {
        admin_id: adminId,
        user_id: userToBanId,
        reason
      }
    });
    
    if (error) {
      console.error('Error banning user:', error);
      return { 
        success: false, 
        message: error.message || 'Error banning user' 
      };
    }
    
    return { 
      success: true, 
      message: `User ${userToBan.username} has been banned` 
    };
  } catch (error) {
    console.error('Error in banUser function:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred' 
    };
  }
};

/**
 * Unban a user
 */
export const unbanUser = async (
  adminId: string, 
  userToUnbanId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // First check if requester is admin or mod
    const isAdminOrMod = await isUserAdminOrMod(adminId);
    
    if (!isAdminOrMod) {
      return { 
        success: false, 
        message: 'You do not have permission to unban users' 
      };
    }
    
    // Call the unban_user function
    const { data, error } = await supabase.functions.invoke('unban_user', {
      body: {
        admin_id: adminId,
        user_id: userToUnbanId
      }
    });
    
    if (error) {
      console.error('Error unbanning user:', error);
      return { 
        success: false, 
        message: error.message || 'Error unbanning user' 
      };
    }
    
    return { 
      success: true, 
      message: 'User has been unbanned' 
    };
  } catch (error) {
    console.error('Error in unbanUser function:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred' 
    };
  }
};

/**
 * Check if a user is banned
 */
export const isUserBanned = async (userId: string): Promise<boolean> => {
  try {
    // Using the ban_user edge function to check if user is banned
    const { data, error } = await supabase.functions.invoke('check_ban_status', {
      body: { user_id: userId }
    });
      
    if (error) {
      throw error;
    }
    
    return data?.is_banned || false;
  } catch (error) {
    console.error('Error checking if user is banned:', error);
    return false;
  }
};

/**
 * Get ban info for a user
 */
export const getUserBanInfo = async (userId: string) => {
  try {
    // Using the get_ban_info edge function to retrieve ban information
    const { data, error } = await supabase.functions.invoke('get_ban_info', {
      body: { user_id: userId }
    });
      
    if (error) {
      throw error;
    }
    
    return data?.ban_info || null;
  } catch (error) {
    console.error('Error getting user ban info:', error);
    return null;
  }
};

/**
 * Get banned users
 */
export const getBannedUsers = async () => {
  try {
    // Using the get_banned_users edge function to list all banned users
    const { data, error } = await supabase.functions.invoke('get_banned_users');
      
    if (error) {
      throw error;
    }
    
    return data?.banned_users || [];
  } catch (error) {
    console.error('Error getting banned users:', error);
    return [];
  }
};
