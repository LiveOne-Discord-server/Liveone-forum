
import { supabase } from '@/utils/supabase';

/**
 * Cleans up unused tags in the database
 * An unused tag is one that is not associated with any posts
 * 
 * @returns Promise<boolean> - true if successful, false if there was an error
 */
export const cleanUnusedTags = async (): Promise<boolean> => {
  try {
    // Find all tags that are not associated with any posts
    const { data: unusedTags, error: unusedTagsError } = await supabase
      .from('tags')
      .select('id')
      .not('id', 'in', (subQuery) => {
        return subQuery
          .from('post_tags')
          .select('tag_id');
      });
      
    if (unusedTagsError) throw unusedTagsError;
    
    if (!unusedTags || unusedTags.length === 0) {
      console.log('No unused tags found');
      return true;
    }
    
    // Delete the unused tags
    const unusedTagIds = unusedTags.map(tag => tag.id);
    
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .in('id', unusedTagIds);
      
    if (deleteError) throw deleteError;
    
    console.log(`Successfully deleted ${unusedTagIds.length} unused tags`);
    return true;
  } catch (error) {
    console.error('Error cleaning up unused tags:', error);
    return false;
  }
};
