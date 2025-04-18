
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Use the Supabase client from the integrations folder which already has the correct configuration
export const supabase = supabaseClient;

export const initializeStorage = async () => {
  try {
    // Create buckets if they don't exist
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('profiles');
    if (!bucketData && bucketError) {
      const { error } = await supabase.storage.createBucket('profiles', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
      });
      if (error) throw error;
      console.log('Created profiles bucket');
    }
    
    const { data: messagesBucketData, error: messagesBucketError } = await supabase.storage.getBucket('messages');
    if (!messagesBucketData && messagesBucketError) {
      const { error } = await supabase.storage.createBucket('messages', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10 // 10MB limit for voice messages
      });
      if (error) throw error;
      console.log('Created messages bucket');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

export const getAllTags = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

export const cleanupOldTags = async (daysOld: number) => {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Use the cleanup_unused_tags function instead of get_unused_tags
    const { error: cleanupError } = await supabase.rpc('cleanup_unused_tags');
    
    if (cleanupError) {
      console.error('Error cleaning up tags:', cleanupError);
      return false;
    }
    
    console.log(`Successfully cleaned up old tags.`);
    return true;
  } catch (error) {
    console.error('Error during tag cleanup:', error);
    return false;
  }
};
