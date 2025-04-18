
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

/**
 * Ensures that the profiles bucket exists and has proper RLS policies
 */
export const ensureProfilesBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'profiles');
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      await supabase.storage.createBucket('profiles', {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      });
      console.log('Created profiles bucket');
      
      // Instead of using an RPC that may not exist in the TypeScript types,
      // we'll log that we can't set the policy automatically
      // The SQL migrations should have already set up the policies correctly
      console.log('Storage bucket created. Policies should be set by migrations.');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring profiles bucket exists:', error);
    return false;
  }
};

/**
 * Uploads a banner image to the profiles bucket
 * @param file The file to upload
 * @param userId The user ID to use in the file path
 * @param progressCallback Optional callback for upload progress
 * @returns The public URL of the uploaded banner
 */
export const uploadBannerImage = async (
  file: File,
  userId: string,
  progressCallback?: (progress: number) => void
) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!userId) {
    throw new Error('No user ID provided');
  }

  console.log('Starting banner upload with file:', file.name, file.type, file.size);
  
  // Create a fresh File object from the blob to avoid any potential issues
  const fileBlob = file.slice(0, file.size, file.type);
  
  // Sanitize the filename and determine the extension
  const fileName = file.name.toLowerCase();
  
  // Get file extension from mime type if possible, or from filename as fallback
  let fileExt = '';
  
  if (file.type.startsWith('image/')) {
    fileExt = file.type.split('/')[1];
    if (fileExt === 'jpeg') fileExt = 'jpg';
  } else {
    // Fallback to filename extension
    fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  }
  
  // Safety check for extension
  if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
    fileExt = 'jpg'; // Default fallback
    console.log('Using fallback extension: jpg');
  }
  
  console.log(`Processed file details - name: ${fileName}, type: ${file.type}, extension: ${fileExt}`);
  
  try {
    // Try uploading to user-content bucket first (which has proper RLS policies)
    let bucket = 'user-content';
    // Using a simplified path structure with just the user ID as folder
    let filePath = `${userId}/banners/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    
    console.log(`Attempting upload to ${bucket} bucket at path: ${filePath}`);
    
    // Create a fresh File object for upload
    const sanitizedFile = new File([fileBlob], `banner.${fileExt}`, { 
      type: file.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
    });
    
    console.log(`Prepared sanitized file for upload: ${sanitizedFile.name} (${sanitizedFile.type}, ${sanitizedFile.size} bytes)`);
    
    // Upload options
    const uploadOptions: any = {
      cacheControl: '3600',
      upsert: true
    };
    
    if (progressCallback) {
      uploadOptions.onUploadProgress = (progress: { percent?: number }) => {
        const percent = progress?.percent || 0;
        progressCallback(percent);
        console.log(`Upload progress: ${percent.toFixed(2)}%`);
      };
    }
    
    // Try uploading to user-content bucket
    let result = await supabase.storage
      .from(bucket)
      .upload(filePath, sanitizedFile, uploadOptions);
      
    // If that fails, fall back to profiles bucket
    if (result.error) {
      console.warn(`Upload to ${bucket} failed:`, result.error);
      
      // Ensure profiles bucket exists
      const bucketReady = await ensureProfilesBucket();
      if (!bucketReady) {
        throw new Error('Failed to ensure profiles bucket exists');
      }
      
      bucket = 'profiles';
      // Using a simplified path structure here as well
      filePath = `${userId}/banners/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      
      console.log(`Falling back to ${bucket} bucket at path: ${filePath}`);
      
      // Try upload again
      result = await supabase.storage
        .from(bucket)
        .upload(filePath, sanitizedFile, uploadOptions);
        
      if (result.error) {
        console.error('Banner upload failed on both buckets:', result.error);
        throw result.error;
      }
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }
    
    console.log('Banner uploaded successfully, URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error in uploadBannerImage:', error);
    
    // Provide a more helpful error message
    if (error.message?.includes('storage/object_too_large')) {
      throw new Error('Image file is too large. Maximum size is 10MB.');
    } else if (error.statusCode === 400 || error.statusCode === 413) {
      throw new Error('Upload failed: File may be too large or in an invalid format.');
    } else if (error.statusCode === 403) {
      throw new Error('Permission denied. Please log out and log back in to refresh your session.');
    } else if (error.statusCode >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(`Failed to upload banner: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Upload banner from URL
 * @param url The URL of the banner to upload
 * @param userId The user ID to use in the file path
 * @returns The public URL of the uploaded banner
 */
export const uploadBannerFromUrl = async (url: string, userId: string) => {
  try {
    // Validate URL format
    if (!url.match(/^https?:\/\/.+/i)) {
      throw new Error('Invalid URL format');
    }
    
    // Ensure profile bucket exists
    await ensureProfilesBucket();
    
    console.log('Fetching image from URL:', url);
    
    // Fetch the image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'image/*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Verify content type is an image
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error(`URL does not point to an image (got ${contentType})`);
      }
      
      console.log(`Retrieved image from URL with content type: ${contentType}`);
      
      const blob = await response.blob();
      
      // Ensure reasonable size (10MB max)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('Image is too large (max 10MB)');
      }
      
      // Get extension from content type
      let fileExt = contentType.split('/')[1]?.toLowerCase() || 'jpg';
      if (fileExt === 'jpeg') fileExt = 'jpg';
      
      const fileName = `banner-from-url-${Date.now()}.${fileExt}`;
      
      // Create a file object from the blob with proper MIME type
      const file = new File([blob], fileName, { 
        type: contentType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` 
      });
      
      console.log(`Created file for upload: ${file.name} (${file.type}, ${file.size} bytes)`);
      
      // Upload the file
      return await uploadBannerImage(file, userId);
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('Error fetching image from URL:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Please try a different URL or upload a file directly.');
      }
      
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error('Error in uploadBannerFromUrl:', error);
    throw error;
  }
};
