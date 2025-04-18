import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { Post, User, Tag } from '@/types';
import PostHeader from '@/components/posts/PostHeader';
import PostContent from '@/components/posts/PostContent';
import CommentList from '@/components/comments/CommentList';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import VoteButtons from '@/components/posts/VoteButtons';
import PostMedia from '@/components/posts/PostMedia';
import TagBadge from '@/components/posts/TagBadge';
import { toast } from '@/hooks/use-toast';
import { isUserAdmin } from '@/utils/admin';
import { useAuth } from '@/hooks/useAuth';
import PostActions from '@/components/posts/PostActions';
import PinnedBadge from '@/components/posts/PinnedBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PostReactions from '@/components/posts/PostReactions';
import { Author } from '@/components/comments/types';

const PostView = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('id, title, content, created_at, last_edited_at, author_id, upvotes, downvotes')
          .eq('id', postId)
          .single();
          
        if (postError) {
          throw postError;
        }
        
        if (!postData) {
          toast.error('This post may have been deleted or does not exist.');
          navigate('/');
          return;
        }
        
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, role, status')
          .eq('id', postData.author_id)
          .single();
          
        if (authorError) {
          console.error('Error fetching author data:', authorError);
        }
        
        const { data: tagsData, error: tagsError } = await supabase
          .from('post_tags')
          .select('tags:tag_id(id, name, color)')
          .eq('post_id', postId);
          
        if (tagsError) {
          console.error('Error fetching post tags:', tagsError);
        }
        
        const tags = tagsData 
          ? tagsData.map(item => item.tags as Tag).filter(Boolean)
          : [];
        
        const { data: mediaData, error: mediaError } = await supabase
          .from('post_media')
          .select('url, media_type')
          .eq('post_id', postId);
          
        if (mediaError) {
          console.error('Error fetching media:', mediaError);
        }
        
        const { data: settingsData, error: settingsError } = await supabase
          .from('post_settings')
          .select('comments_enabled, is_pinned')
          .eq('post_id', postId)
          .single();
          
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error fetching post settings:', settingsError);
        }
        
        let userVote = null;
        if (user) {
          const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();
            
          if (!voteError && voteData) {
            userVote = voteData.vote_type;
          }
        }
        
        const comments_enabled = settingsData ? settingsData.comments_enabled : true;
        setCommentsEnabled(comments_enabled);
        
        const authorRole = authorData?.role || 'user';
        const safeRole = ['admin', 'moderator', 'user'].includes(authorRole) ? authorRole as 'admin' | 'moderator' | 'user' : 'user';
        
        const formattedPost: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          authorId: postData.author_id,
          createdAt: postData.created_at,
          lastEdited: postData.last_edited_at,
          upvotes: postData.upvotes || 0,
          downvotes: postData.downvotes || 0,
          userVote,
          tags,
          mediaUrls: mediaData ? mediaData.map(m => m.url) : [],
          isPinned: settingsData ? settingsData.is_pinned : false,
          author: {
            id: authorData?.id || postData.author_id,
            username: authorData?.username || 'Unknown User',
            avatar: authorData?.avatar_url || null,
            role: safeRole,
            status: authorData?.status as 'online' | 'offline' | 'dnd' | 'idle' || 'offline',
            provider: 'github'
          }
        };
        
        setPost(formattedPost);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('There was an error loading this post.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [postId]);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await isUserAdmin(user.id);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [user]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg mb-6" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Post not found or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const postAuthor: Author = {
    id: post.author.id,
    username: post.author.username,
    avatar_url: post.author.avatar || '',
    role: post.author.role,
    status: post.author.status || 'offline'
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {post.isPinned && <PinnedBadge />}
            </div>
            {(isAdmin || post.authorId === user?.id) && (
              <PostActions 
                post={post}
                onSettingsChanged={(settings) => {
                  setCommentsEnabled(settings.commentsEnabled);
                  setPost(prev => prev ? {
                    ...prev,
                    isPinned: settings.isPinned
                  } : null);
                }}
              />
            )}
          </div>
          
          <PostHeader 
            postId={post.id}
            title={post.title}
            author={postAuthor}
            createdAt={post.createdAt}
            lastEditedAt={post.lastEdited}
          />
          
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="my-4">
              <PostMedia urls={post.mediaUrls} />
            </div>
          )}
          
          <div className="my-6">
            <PostContent 
              content={post.content}
              createdAt={post.createdAt}
              lastEdited={post.lastEdited}
              tags={post.tags}
            />
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <TagBadge 
                  key={tag.id} 
                  tag={tag}
                />
              ))}
            </div>
          )}

          <PostReactions postId={post.id} />
        </CardContent>
        
        <CardFooter className="border-t border-gray-800 pt-4">
          <VoteButtons 
            postId={post.id}
            initialUpvotes={post.upvotes}
            initialDownvotes={post.downvotes}
            userVote={post.userVote}
          />
        </CardFooter>
      </Card>
      
      <CommentList 
        postId={post.id}
        commentsEnabled={commentsEnabled}
      />
    </div>
  );
};

export default PostView;
