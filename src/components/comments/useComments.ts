
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Comment, Author } from './types';

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchComments = async () => {
    setIsLoading(true);
    
    try {
      // Use a simpler query without the relation syntax to avoid type errors
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching comments:', error);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        setComments([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch profiles separately for each comment
      const formattedComments = await Promise.all(data.map(async (comment) => {
        // Get profile data for the comment author
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url, role, id, status')
          .eq('id', comment.user_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        const author: Author = {
          username: profileData?.username || 'Unknown User',
          avatar_url: profileData?.avatar_url || '',
          role: profileData?.role as 'admin' | 'moderator' | 'user' | undefined,
          id: profileData?.id || comment.user_id,
          status: (profileData?.status as 'online' | 'offline' | 'dnd' | 'idle') || 'online'
        };
        
        return {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          post_id: comment.post_id,
          author
        };
      }));
      
      setComments(formattedComments);
    } catch (err) {
      console.error('Error in comment fetching process:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchComments();
    
    // Subscribe to new comments
    const channel = supabase
      .channel('comments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          // Refetch comments when there's a change
          fetchComments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);
  
  return { comments, isLoading, refetchComments: fetchComments };
};
