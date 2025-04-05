
import { supabase } from '@/integrations/supabase/client';

const createBucketIfNotExists = async (bucketName: string, isPublic: boolean = false) => {
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
      
      // Set CORS policy - Note: This operation is now done through Supabase dashboard
      // The updateBucketCors method doesn't exist in the current version
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

export const initializeStorage = async () => {
  try {
    const buckets = [
      { name: 'avatars', isPublic: true },
      { name: 'post-media', isPublic: true }
    ];
    
    let allSuccessful = true;
    
    for (const bucket of buckets) {
      const success = await createBucketIfNotExists(bucket.name, bucket.isPublic);
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
