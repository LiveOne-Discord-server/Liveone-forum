
import { supabase } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export async function fetchAllTags() {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
      
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('Error fetching tags:', err);
    return [];
  }
}

export async function createTag(name: string, color: string = '#1e88e5') {
  // Validate the tag name
  if (!name.trim()) {
    throw new Error('Tag name cannot be empty');
  }
  
  try {
    // Check if tag already exists
    const { data: existingTags, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingTags) {
      toast.error(`Tag "${name}" already exists`);
      return null;
    }
    
    // Insert the new tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: name.trim(),
        color
      })
      .select()
      .single();
      
    if (error) throw error;
    
    toast.success(`Tag "${name}" created successfully`);
    return data;
  } catch (err) {
    console.error('Error creating tag:', err);
    toast.error('Failed to create tag');
    return null;
  }
}

/**
 * Deletes a tag by ID with improved deletion persistence
 * @param tagId The ID of the tag to delete
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteTag(tagId: string) {
  try {
    console.log(`Attempting to delete tag with ID: ${tagId}`);
    
    // First, remove any post-tag associations
    const { error: relationsError } = await supabase
      .from('post_tags')
      .delete()
      .eq('tag_id', tagId);
    
    if (relationsError) {
      console.error('Error removing tag relations:', relationsError);
      throw relationsError;
    }
    
    // Then delete the tag itself
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);
    
    if (deleteError) {
      console.error('Error deleting tag:', deleteError);
      throw deleteError;
    }
    
    console.log(`Successfully deleted tag with ID: ${tagId}`);
    
    // Force cache busting by adding a timestamp to invalidate browser cache
    try {
      // Clear any tag-related localStorage caches
      localStorage.removeItem('cached_tags');
      localStorage.removeItem('tag_filters');
      
      // Add timestamp to force refresh
      localStorage.setItem('tags_last_updated', Date.now().toString());
      
      toast.success('Tag deleted successfully');
    } catch (e) {
      console.error('Failed to clear tag cache:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteTag:', error);
    toast.error('Failed to delete tag');
    return false;
  }
}

/**
 * Cleans up tags that are not associated with any posts
 * This function is called periodically to remove unused tags
 */
export async function cleanUnusedTags() {
  try {
    console.log('Starting tag cleanup');
    
    // First, get all tags that are not associated with any posts
    const { data: unusedTags, error: queryError } = await supabase
      .from('tags')
      .select('id')
      .not('id', 'in', 
        supabase
          .from('post_tags')
          .select('tag_id')
      );
    
    if (queryError) {
      console.error('Error finding unused tags:', queryError);
      return false;
    }
    
    if (!unusedTags || unusedTags.length === 0) {
      console.log('No unused tags found');
      return true;
    }
    
    console.log(`Found ${unusedTags.length} unused tags to delete`);
    
    // Delete each unused tag
    for (const tag of unusedTags) {
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tag.id);
      
      if (deleteError) {
        console.error(`Error deleting unused tag ${tag.id}:`, deleteError);
      } else {
        console.log(`Successfully deleted unused tag ${tag.id}`);
        // Clear local storage cache
        try {
          localStorage.removeItem('cached_tags');
          localStorage.removeItem('tag_filters');
          localStorage.setItem('tags_last_updated', Date.now().toString());
        } catch (e) {
          console.error('Error clearing tag cache:', e);
        }
      }
    }
    
    console.log('Successfully cleaned up unused tags');
    return true;
  } catch (error) {
    console.error('Error during tag cleanup:', error);
    return false;
  }
}
