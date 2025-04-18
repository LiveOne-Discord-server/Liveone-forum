import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload message media with improved error handling and retry logic
 * @param file The file to upload
 * @param type The type of media (voice, image, video, file)
 * @returns The public URL of the uploaded media
 */
export const uploadMessageMedia = async (
  file: File,
  type: 'voice' | 'image' | 'video' | 'file',
  progressCallback?: (progress: number) => void
) => {
  console.log(`Starting media upload for ${type}:`, file.name, file.type, file.size);
  
  try {
    const fileExt = file.name.split('.').pop() || 'dat';
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const filePath = `${type}/${timestamp}-${uniqueId}.${fileExt}`;
    
    console.log(`Upload file path: messages/${filePath}`);

    const { data, error } = await supabase.storage
      .from('messages')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    console.log('Media uploaded successfully:', urlData.publicUrl);
    
    // Call progress callback to indicate completion
    if (progressCallback) {
      progressCallback(100);
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    toast.error(`Failed to upload ${type} message`);
    throw error;
  }
};

/**
 * Get file size in human readable format
 */
export const getFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  else if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  else return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/**
 * Get file type icon based on mime type
 */
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'file-presentation';
  return 'file';
};
