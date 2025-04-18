
import { supabase } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';

/**
 * Ensures that the avatars bucket exists before uploading
 */
export const ensureAvatarBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'avatars');
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880 // 5MB limit
      });
      console.log('Created avatars bucket');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring avatar bucket exists:', error);
    return false;
  }
};

/**
 * Uploads an avatar image to the avatars bucket
 * @param file The file to upload
 * @param userId The user ID to use in the file path
 * @param progressCallback Optional callback for upload progress
 * @returns The public URL of the uploaded avatar
 */
export const uploadAvatarImage = async (
  file: File,
  userId: string,
  progressCallback?: (progress: number) => void
) => {
  try {
    // Ensure avatar bucket exists
    await ensureAvatarBucket();
    
    // Create a unique file path
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
    
    // Upload with retries
    let retries = 3;
    let error = null;
    
    while (retries > 0) {
      try {
        // Upload the file to the avatars bucket
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
            ...(progressCallback && { 
              onUploadProgress: (progress) => {
                progressCallback(progress.percent || 0);
              }
            })
          });
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.path);
        
        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get public URL');
        }
        
        console.log('Avatar upload successful:', urlData.publicUrl);
        return urlData.publicUrl;
      } catch (err) {
        console.error('Avatar upload attempt failed:', err);
        error = err;
        retries--;
        
        if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`Retrying avatar upload, attempts left: ${retries}`);
        }
      }
    }
    
    throw error || new Error('Failed to upload avatar after multiple attempts');
  } catch (error) {
    console.error('Error in uploadAvatarImage:', error);
    throw error;
  }
};

/**
 * Upload avatar from URL
 * @param url The URL of the avatar to upload
 * @param userId The user ID to use in the file path
 * @returns The public URL of the uploaded avatar
 */
export const uploadAvatarFromUrl = async (url: string, userId: string) => {
  try {
    // Ensure avatar bucket exists
    await ensureAvatarBucket();
    
    // Fetch the image from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const fileExt = url.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const file = new File([blob], fileName, { type: blob.type });
    
    // Upload the file to the avatars bucket
    return await uploadAvatarImage(file, userId);
  } catch (error) {
    console.error('Error in uploadAvatarFromUrl:', error);
    throw error;
  }
};

/**
 * Upload avatar using the unified API
 * @param file The file to upload
 * @param userId The user ID to use in the file path
 * @param progressCallback Optional callback for upload progress
 * @returns The public URL of the uploaded avatar
 */
export const uploadAvatar = async (
  file: File,
  userId: string,
  progressCallback?: (progress: number) => void
) => {
  return await uploadAvatarImage(file, userId, progressCallback);
};

/**
 * Deletes an avatar image from the avatars bucket
 * @param filePath The path of the file to delete
 * @returns True if the deletion was successful
 */
export const deleteAvatarImage = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteAvatarImage:', error);
    return false;
  }
};

/**
 * Extracts the file path from an avatar URL
 * @param avatarUrl The full URL of the avatar
 * @returns The file path portion of the URL
 */
export const getAvatarPathFromUrl = (avatarUrl: string) => {
  try {
    if (!avatarUrl) return null;
    
    // Extract the path after the bucket name
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length < 2) return null;
    
    return urlParts[1];
  } catch (error) {
    console.error('Error extracting avatar path:', error);
    return null;
  }
};
