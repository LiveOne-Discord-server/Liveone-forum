
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

// Function to clean up unused tags
export const cleanUnusedTags = async (): Promise<boolean> => {
  try {
    // Call the server-side function to clean up tags
    const { error } = await supabase.rpc('cleanup_unused_tags');
    
    if (error) {
      console.error('Error cleaning up unused tags:', error);
      throw error;
    }
    
    // Clear any local storage cache for tags
    try {
      localStorage.removeItem('cached_tags');
      localStorage.removeItem('tag_filters');
    } catch (e) {
      console.error('Error clearing tag cache:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to clean up tags:', error);
    return false;
  }
};

// Function to delete a specific tag by ID
export const deleteTag = async (tagId: string): Promise<boolean> => {
  try {
    console.log('Attempting to delete tag with ID:', tagId);
    
    // First, remove all associations with posts
    const { error: postTagError } = await supabase
      .from('post_tags')
      .delete()
      .eq('tag_id', tagId);
      
    if (postTagError) {
      console.error('Error removing tag from posts:', postTagError);
      throw postTagError;
    }
    
    // Then delete the tag itself
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);
      
    if (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
    
    // Clear any tag-related localStorage caches
    try {
      localStorage.removeItem('cached_tags');
      localStorage.removeItem('tag_filters');
    } catch (e) {
      console.error('Failed to clear tag cache:', e);
    }
    
    console.log('Tag deleted successfully');
    toast.success('Tag deleted successfully');
    return true;
  } catch (error) {
    console.error('Failed to delete tag:', error);
    toast.error('Failed to delete tag');
    return false;
  }
};
