
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PostEditor from '@/components/posts/PostEditor';
import { Tag } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { cleanUnusedTags } from '@/utils/tagUtils';

const EditPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [post, setPost] = useState<{
    title: string;
    content: string;
    authorId: string;
    tags: Tag[];
    mediaUrls: string[];
  } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || !user) return;

      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('title, content, author_id')
          .eq('id', postId)
          .single();

        if (postError) throw postError;

        if (postData.author_id !== user.id) {
          toast.error(t.posts?.notAuthorized || "You're not authorized to edit this post");
          navigate('/');
          return;
        }

        // Get tags for this post
        const { data: tagsData, error: tagsError } = await supabase
          .from('post_tags')
          .select('tags(id, name, color)')
          .eq('post_id', postId);

        if (tagsError) throw tagsError;

        let postTags: Tag[] = [];
        if (tagsData) {
          postTags = tagsData
            .map(item => item.tags)
            .filter(Boolean)
            .map(tag => ({
              id: tag.id,
              name: tag.name,
              color: tag.color
            }));
        }

        // Get media for this post
        const { data: mediaData, error: mediaError } = await supabase
          .from('post_media')
          .select('url')
          .eq('post_id', postId);

        if (mediaError) throw mediaError;

        const mediaUrls = mediaData ? mediaData.map(item => item.url) : [];

        setPost({
          title: postData.title,
          content: postData.content,
          authorId: postData.author_id,
          tags: postTags,
          mediaUrls,
        });

      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error(t.common?.errorOccurred || 'An error occurred');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, user, navigate, t]);

  const handleSave = async (content: string, title: string, tags: Tag[], mediaFiles: File[], existingMedia: string[] = []) => {
    if (!user || !postId) return;

    setIsSubmitting(true);

    try {
      // Check total size of new files
      if (mediaFiles.length > 0) {
        const totalSize = mediaFiles.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 100 * 1024 * 1024) {
          throw new Error('Total file size exceeds 100MB limit');
        }
      }
      
      // 1. Update the post
      const { error: postError } = await supabase
        .from('posts')
        .update({ title, content })
        .eq('id', postId);

      if (postError) throw postError;

      // 2. Handle tags: first remove all existing tags for this post
      const { error: deleteTagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      if (deleteTagsError) throw deleteTagsError;

      // 3. Add new tags
      for (const tag of tags) {
        // Check if tag exists
        const { data: existingTagData, error: tagCheckError } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tag.name)
          .maybeSingle();

        if (tagCheckError) throw tagCheckError;

        let tagId = existingTagData?.id;

        // If tag doesn't exist, create it
        if (!tagId) {
          const { data: newTagData, error: tagCreationError } = await supabase
            .from('tags')
            .insert({ name: tag.name, color: tag.color })
            .select()
            .single();

          if (tagCreationError) throw tagCreationError;
          tagId = newTagData.id;
        }

        // Link tag to post
        const { error: linkTagError } = await supabase
          .from('post_tags')
          .insert({ post_id: postId, tag_id: tagId });

        if (linkTagError) throw linkTagError;
      }

      // 4. Handle existing media: delete ones that are no longer included
      const { data: currentMedia, error: mediaQueryError } = await supabase
        .from('post_media')
        .select('id, url')
        .eq('post_id', postId);

      if (mediaQueryError) throw mediaQueryError;

      const mediaToDelete = currentMedia?.filter(media => !existingMedia.includes(media.url)) || [];

      for (const media of mediaToDelete) {
        // Delete from database
        const { error: mediaDeleteError } = await supabase
          .from('post_media')
          .delete()
          .eq('id', media.id);

        if (mediaDeleteError) throw mediaDeleteError;
      }

      // 5. Upload new media files
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const filePath = `post-media/${postId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
          
          const { error: uploadError } = await supabase
            .storage
            .from('post-media')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          const { data: mediaUrl } = supabase
            .storage
            .from('post-media')
            .getPublicUrl(filePath);
            
          // Link media to post
          const { error: linkMediaError } = await supabase
            .from('post_media')
            .insert({
              post_id: postId,
              url: mediaUrl.publicUrl,
              media_type: file.type
            });
            
          if (linkMediaError) throw linkMediaError;
        }
      }

      // 6. Clean up unused tags
      await cleanUnusedTags();

      toast.success(t.posts?.postUpdated || 'Post updated successfully');
      navigate(`/post/${postId}`);
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(t.common?.errorOccurred || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-10">
        <p>Post not found or you don't have permission to edit it.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <Button
        variant="outline"
        onClick={() => navigate(`/post/${postId}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">{t.posts?.editPost || 'Edit Post'}</h1>
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
        <PostEditor
          initialTitle={post.title}
          initialContent={post.content}
          initialTags={post.tags}
          initialMediaUrls={post.mediaUrls}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          onCancel={() => navigate(`/post/${postId}`)}
        />
      </div>
    </div>
  );
};

export default EditPost;
