import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import PostCard from './PostCard';
import { Post, Tag, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import PostFilter from './PostFilter';

export const PostList = () => {
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data: tagsData, error } = await supabase
          .from('tags')
          .select('id, name, color');
          
        if (error) {
          console.error('Error fetching tags:', error);
          toast.error('Failed to load tags');
          return;
        }
        
        if (tagsData) {
          const formattedTags: Tag[] = tagsData.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color || '#3b82f6'
          }));
          setAvailableTags(formattedTags);
        }
      } catch (err) {
        console.error('Exception fetching tags:', err);
        toast.error('Failed to load tags');
      }
    };
    
    fetchTags();
  }, []);

  const fetchPosts = async () => {
    console.log('Fetching posts, authenticated:', isAuthenticated, 'user:', user?.id);
    
    try {
      const { data: postSettingsData, error: settingsError } = await supabase
        .from('post_settings')
        .select('post_id')
        .eq('is_pinned', true);
        
      if (settingsError) {
        console.error('Error fetching pinned posts:', settingsError);
        throw settingsError;
      }
      
      const pinnedPostIds = postSettingsData.map(setting => setting.post_id);
      console.log('Pinned post IDs:', pinnedPostIds);

      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          upvotes,
          downvotes,
          author_id
        `);
        
      if (activeTag) {
        console.log('Filtering by tag ID:', activeTag);
        const { data: taggedPostIds, error: tagError } = await supabase
          .from('post_tags')
          .select('post_id')
          .eq('tag_id', activeTag);
          
        if (tagError) {
          console.error('Error fetching tagged posts:', tagError);
          throw tagError;
        }
        
        if (taggedPostIds && taggedPostIds.length > 0) {
          const postIds = taggedPostIds.map(item => item.post_id);
          console.log('Found posts with tag:', postIds);
          query = query.in('id', postIds);
        } else {
          console.log('No posts found with selected tag');
          return [];
        }
      }
      
      if (searchTerm) {
        console.log('Filtering by search term:', searchTerm);
        query = query.ilike('title', `%${searchTerm}%`);
      }
      
      const { data: postsData, error: postsError } = await query
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      console.log('Fetched posts:', postsData?.length);
      
      if (!postsData || postsData.length === 0) {
        return [];
      }

      const authorIds = [...new Set(postsData.map(post => post.author_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', authorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      const profilesMap = {};
      profilesData.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      const { data: postTagsData, error: postTagsError } = await supabase
        .from('post_tags')
        .select('post_id, tags(id, name)')
        .in('post_id', postsData.map(post => post.id));
        
      if (postTagsError) {
        console.error('Error fetching post tags:', postTagsError);
        throw postTagsError;
      }
      
      const postTagsMap = {};
      postTagsData.forEach(postTag => {
        if (!postTagsMap[postTag.post_id]) {
          postTagsMap[postTag.post_id] = [];
        }
        if (postTag.tags) {
          postTagsMap[postTag.post_id].push(postTag.tags);
        }
      });

      const { data: mediaData, error: mediaError } = await supabase
        .from('post_media')
        .select('post_id, url')
        .in('post_id', postsData.map(post => post.id));
        
      if (mediaError) {
        console.error('Error fetching post media:', mediaError);
        throw mediaError;
      }
      
      const mediaMap = {};
      mediaData.forEach(media => {
        if (!mediaMap[media.post_id]) {
          mediaMap[media.post_id] = [];
        }
        const isFullUrl = media.url.startsWith('http://') || media.url.startsWith('https://');
        const mediaUrl = isFullUrl ? media.url : supabase.storage.from('post-media').getPublicUrl(media.url).data.publicUrl;
        mediaMap[media.post_id].push(mediaUrl);
      });

      const transformedPosts = postsData.map(post => {
        const author: User = {
          id: post.author_id,
          username: profilesMap[post.author_id]?.username || 'Unknown User',
          avatar: profilesMap[post.author_id]?.avatar_url,
          provider: 'github',
          role: profilesMap[post.author_id]?.role || 'user',
          status: 'online'
        };
        
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.author_id,
          author: author,
          createdAt: post.created_at,
          tags: postTagsMap[post.id] || [],
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          mediaUrls: mediaMap[post.id] || [],
          isPinned: pinnedPostIds.includes(post.id)
        } as Post;
      });

      console.log('Transformed posts:', transformedPosts.length);

      return transformedPosts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      toast.error(t.posts.loadError || 'Не удалось загрузить посты');
      return [];
    }
  };

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['posts', activeTag, searchTerm, isAuthenticated, user?.id],
    queryFn: fetchPosts,
    enabled: true,
    staleTime: 60000,
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Post change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['posts', activeTag] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, activeTag]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-gray-800 p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-gray-800 h-10 w-10 animate-pulse" />
              <div className="space-y-3 w-full">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-800 rounded animate-pulse w-1/4" />
                <div className="h-3 bg-gray-800 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-800 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-800 rounded animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 p-4 text-red-500 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>
          {t.posts.loadError || 'Ошибка при загрузке постов. Пожалуйста, попробуйте позже.'}
        </span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 p-6 text-center">
        <p className="text-muted-foreground">
          {activeTag 
            ? (t.posts.noPostsWithTag || "Нет постов с выбранным тегом.") 
            : (t.posts.noPosts || "Пока нет постов. Будьте первым, кто создаст пост!")}
        </p>
        {activeTag && (
          <button 
            onClick={() => setActiveTag(null)}
            className="mt-4 text-neon-orange hover:underline"
          >
            {t.posts.clearFilter || "Очистить фильтр"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="mb-6">
        <PostFilter 
          onFilterChange={(newSearchTerm, newTagId) => {
            setSearchTerm(newSearchTerm);
            setActiveTag(newTagId);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
          }} 
          initialSearchTerm={searchTerm}
          initialTagId={activeTag}
        />
      </div>
      
      {(activeTag || searchTerm) && (
        <div className="bg-gray-800/50 p-3 rounded-md mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">
                {t.posts.filterApplied || 'Применены фильтры'}: 
                {searchTerm && <span className="ml-1 font-medium">"{searchTerm}"</span>}
              </span>
            </div>
            <button 
              onClick={() => {
                setSearchTerm('');
                setActiveTag(null);
                queryClient.invalidateQueries({ queryKey: ['posts'] });
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {t.common.reset || 'Сбросить'}
            </button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        {posts.map((post, index) => (
          <div 
            key={post.id} 
            className="animate-fadeIn" 
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <PostCard post={post} isPinned={post.isPinned} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostList;
