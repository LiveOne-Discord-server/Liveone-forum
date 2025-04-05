import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Post, User } from '@/types';
import { Crown, ChevronLeft } from 'lucide-react';
import CommentList from '@/components/comments/CommentList';
import PostActions from '@/components/posts/PostActions';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import PostMedia from '@/components/posts/PostMedia';
import TagBadge from '@/components/posts/TagBadge';

const PostView = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('id, title, content, created_at, upvotes, downvotes, author_id')
        .eq('id', postId)
        .single();
        
        if (postError) {
          console.error('Error fetching post:', postError);
          setError(postError.message);
          setIsLoading(false);
          return;
        }
        
        if (!postData) {
          setError('Post not found');
          setIsLoading(false);
          return;
        }
        
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, role')
          .eq('id', postData.author_id)
          .single();
          
        if (authorError) throw authorError;
        
        const { data: tagsData, error: tagsError } = await supabase
          .from('post_tags')
          .select('tags(id, name, color)')
          .eq('post_id', postId);
          
        if (tagsError) {
          console.error('Error fetching tags:', tagsError);
          // Continue without tags
        }
        
        let formattedTags = [];
        if (tagsData && !tagsError) {
          const tags = tagsData.map(tagData => tagData.tags).filter(Boolean);
          formattedTags = tags.map(tag => ({
            id: tag?.id || '',
            name: tag?.name || '',
            color: tag?.color || '#3b82f6'
          }));
        }
        
        const { data: mediaData, error: mediaError } = await supabase
          .from('post_media')
          .select('url')
          .eq('post_id', postId);
          
        if (mediaError) throw mediaError;
        
        const mediaUrls = mediaData.map(media => media.url);
        
        const { data: settingsData, error: settingsError } = await supabase
          .from('post_settings')
          .select('comments_enabled, is_pinned')
          .eq('post_id', postId)
          .single();
          
        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
        
        setCommentsEnabled(settingsData?.comments_enabled ?? true);
        
        const author: User = {
          id: authorData.id,
          username: authorData.username,
          avatar: authorData.avatar_url,
          provider: 'github',
          role: authorData.role || 'user',
          status: 'online'
        };
        
        const fullPost: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          authorId: postData.author_id,
          author: author,
          createdAt: postData.created_at,
          tags: formattedTags,
          upvotes: postData.upvotes || 0,
          downvotes: postData.downvotes || 0,
          mediaUrls: mediaUrls,
          isPinned: settingsData?.is_pinned || false
        };
        
        setPost(fullPost);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPost();
  }, [postId, navigate]);
  
  const renderMedia = (url: string) => {
    if (!url) return null;
    return <PostMedia url={url} />;
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-800 rounded w-3/4"></div>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-800 h-12 w-12"></div>
            <div className="h-4 bg-gray-800 rounded w-1/4"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded w-full"></div>
            <div className="h-4 bg-gray-800 rounded w-full"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          </div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container max-w-4xl mx-auto py-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{error || "Post not found"}</h2>
          <Button onClick={() => navigate('/')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-10">
      <Link to="/">
        <Button variant="outline" className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Posts
        </Button>
      </Link>
      
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={post.author.avatar} alt={post.author.username} />
                  <AvatarFallback>{post.author.username?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex items-center">
                  <span className="font-medium">{post.author.username}</span>
                  {post.author.role === 'admin' && (
                    <Crown className="h-4 w-4 ml-1 text-amber-500" />
                  )}
                </div>
              </div>
              <span className="text-muted-foreground">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
          
          <PostActions post={post} />
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="prose prose-gray dark:prose-invert max-w-none text-left">
            <div className="whitespace-pre-line text-lg text-left">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
            
            {post.mediaUrls?.map((url, index) => (
              <div key={index} className="my-6">
                {renderMedia(url)}
              </div>
            ))}
            
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {post.tags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>
          
          {postId && <CommentList postId={postId} commentsEnabled={commentsEnabled} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostView;
