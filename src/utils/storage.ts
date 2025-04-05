
import { supabase } from '@/integrations/supabase/client';

// Create or verify bucket existence
export const ensureBucketExists = async (bucketName: string, isPublic: boolean = false) => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
      
    if (listError) {
      console.error(`Error checking for bucket ${bucketName}:`, listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    // If the bucket doesn't exist, create it
    if (!bucketExists) {
      const { error: createError } = await supabase
        .storage
        .createBucket(bucketName, {
          public: isPublic
        });
        
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        return false;
      }
      
      console.log(`Bucket ${bucketName} created successfully`);
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
    
    return true;
  } catch (error) {
    console.error(`Unexpected error working with bucket ${bucketName}:`, error);
    return false;
  }
};

// Initialize all required storage buckets
export const initializeStorage = async () => {
  try {
    const buckets = [
      { name: 'avatars', isPublic: true },
      { name: 'post-media', isPublic: true }
    ];
    
    let allSuccessful = true;
    
    for (const bucket of buckets) {
      const success = await ensureBucketExists(bucket.name, bucket.isPublic);
      if (!success) {
        allSuccessful = false;
      }
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Check if a specific bucket exists
export const checkBucketExists = async (bucketName: string) => {
  try {
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();
      
    if (error) {
      console.error('Error checking bucket existence:', error);
      return false;
    }
    
    return buckets.some(bucket => bucket.name === bucketName);
  } catch (error) {
    console.error('Error checking bucket existence:', error);
    return false;
  }
};

// Upload file to a specific bucket
export const uploadFile = async (
  file: File, 
  bucketName: string, 
  filePath: string,
  progressCallback?: (progress: number) => void
) => {
  try {
    // Ensure bucket exists
    const bucketExists = await ensureBucketExists(bucketName, true);
    if (!bucketExists) {
      throw new Error(`Bucket ${bucketName} could not be created or accessed`);
    }
    
    // Create options object
    const options: {
      cacheControl: string;
      upsert: boolean;
      contentType?: string;
    } = {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    };

    // Upload with progress tracking
    const uploadPromise = supabase.storage
      .from(bucketName)
      .upload(filePath, file, options);
    
    // Handle progress separately if callback provided
    if (progressCallback) {
      let lastProgress = 0;
      const checkProgress = setInterval(() => {
        // Increment slightly to show activity
        lastProgress += 5; 
        if (lastProgress > 95) lastProgress = 95;
        progressCallback(lastProgress);
      }, 300);
      
      // Clear the interval when upload completes
      uploadPromise.then(() => {
        clearInterval(checkProgress);
        progressCallback(100);
      }).catch(() => {
        clearInterval(checkProgress);
      });
    }
    
    const { data, error } = await uploadPromise;
      
    if (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadFile:`, error);
    throw error;
  }
};

// Delete file from a bucket
export const deleteFile = async (bucketName: string, filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
      
    if (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in deleteFile:`, error);
    return false;
  }
};

// List files in a bucket with a specific prefix
export const listFiles = async (bucketName: string, prefix?: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(prefix || '');
      
    if (error) {
      console.error(`Error listing files in ${bucketName}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error in listFiles:`, error);
    return [];
  }
};
