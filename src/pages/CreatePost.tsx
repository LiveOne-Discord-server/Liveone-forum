
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import PostEditor from '@/components/posts/PostEditor';
import { Tag } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { cleanUnusedTags } from '@/utils/tagUtils';

const CreatePost = () => {
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSave = async (content: string, title: string, tags: Tag[], mediaFiles: File[]) => {
    if (!user) {
      toast.error(t.auth?.loginRequired || 'Please log in to create a post');
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          author_id: user.id,
        })
        .select()
        .single();

      if (postError) throw postError;
      const postId = postData.id;

      // 2. Save all tags to the database
      for (const tag of tags) {
        // Check if tag exists by name
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
            .insert({
              name: tag.name,
              color: tag.color
            })
            .select()
            .single();
            
          if (tagCreationError) throw tagCreationError;
          tagId = newTagData.id;
        }

        // Add tag to post
        const { error: postTagError } = await supabase
          .from('post_tags')
          .insert({
            post_id: postId,
            tag_id: tagId
          });
          
        if (postTagError) throw postTagError;
      }

      // 3. Upload media files
      if (mediaFiles.length > 0) {
        // Check total size
        const totalSize = mediaFiles.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 100 * 1024 * 1024) {
          throw new Error('Total file size exceeds 100MB limit');
        }
        
        for (const file of mediaFiles) {
          const filePath = `post-media/${postId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
          
          const { error: uploadError } = await supabase
            .storage
            .from('post-media')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          // Get the public URL for the file
          const { data: mediaUrl } = supabase
            .storage
            .from('post-media')
            .getPublicUrl(filePath);
            
          // Save media reference in post_media table
          const { error: mediaLinkError } = await supabase
            .from('post_media')
            .insert({
              post_id: postId,
              url: mediaUrl.publicUrl,
              media_type: file.type
            });
            
          if (mediaLinkError) throw mediaLinkError;
        }
      }

      // 4. Create post settings
      const { error: settingsError } = await supabase
        .from('post_settings')
        .insert({
          post_id: postId,
          comments_enabled: true,
          is_pinned: false
        });
        
      if (settingsError) throw settingsError;

      // 5. Clean up unused tags
      await cleanUnusedTags();

      toast.success(t.posts?.postCreated || 'Post created successfully!');
      navigate(`/post/${postId}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(t.common?.errorOccurred || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-6">{t.posts?.createPost || 'Create Post'}</h1>
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
        <PostEditor onSave={handleSave} isSubmitting={isSubmitting} onCancel={() => navigate('/')} />
      </div>
    </div>
  );
};

export default CreatePost;
