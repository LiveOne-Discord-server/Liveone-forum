
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Upload, Loader2, Link as LinkIcon, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/utils/supabase';
import { uploadAvatarImage } from '@/utils/avatarStorage';

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  username?: string;
  onAvatarChange?: (url: string | null) => void;
}

const AvatarUploader = ({ currentAvatarUrl, username, onAvatarChange }: AvatarUploaderProps) => {
  const { appUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();
  const dropzoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update avatar URL if the currentAvatarUrl prop changes
    if (currentAvatarUrl) {
      setAvatarUrl(currentAvatarUrl);
    }
  }, [currentAvatarUrl]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          handleAvatarUpload(file);
        } else {
          toast.error("Please upload an image file.");
        }
      }
    };

    const dropzone = dropzoneRef.current;
    if (dropzone) {
      dropzone.addEventListener('dragenter', handleDragEnter);
      dropzone.addEventListener('dragleave', handleDragLeave);
      dropzone.addEventListener('dragover', handleDragOver);
      dropzone.addEventListener('drop', handleDrop);
    }

    return () => {
      if (dropzone) {
        dropzone.removeEventListener('dragenter', handleDragEnter);
        dropzone.removeEventListener('dragleave', handleDragLeave);
        dropzone.removeEventListener('dragover', handleDragOver);
        dropzone.removeEventListener('drop', handleDrop);
      }
    };
  }, []);

  // Handle file upload from computer
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    const file = event.target.files[0];
    handleAvatarUpload(file);
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Check if user is authenticated
      if (!appUser || !appUser.id) {
        throw new Error('You need to be logged in to update your avatar');
      }
      
      // Upload the avatar using our utility function
      const newAvatarUrl = await uploadAvatarImage(file, appUser.id, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      // Update state and callback
      setAvatarUrl(newAvatarUrl);
      setPreviewUrl(null);
      
      // Auto-save the profile with the new avatar
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', appUser.id);
          
        if (error) throw error;
        
        console.log('Avatar updated and saved to profile');
        
        if (onAvatarChange) {
          onAvatarChange(newAvatarUrl);
        }
        
        toast.success('Avatar updated successfully');
      } catch (saveError) {
        console.error('Error saving avatar to profile:', saveError);
        toast.error('Avatar uploaded but profile not updated. Please try saving your profile.');
        
        if (onAvatarChange) {
          onAvatarChange(newAvatarUrl);
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update avatar'
      );
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle URL upload with auto-save
  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Check if user is authenticated
      if (!appUser || !appUser.id) {
        throw new Error('You need to be logged in to update your avatar');
      }
      
      // Fetch the image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }
      
      const blob = await response.blob();
      const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const file = new File([blob], fileName, { type: blob.type });
      
      // Use the same upload function we use for direct file uploads
      const newAvatarUrl = await uploadAvatarImage(file, appUser.id);
      
      // Auto-save the profile with the new avatar
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', appUser.id);
          
        if (error) throw error;
        
        console.log('Avatar updated and saved to profile');
        
        // Update state and callback
        setAvatarUrl(newAvatarUrl);
        setImageUrl('');
        
        if (onAvatarChange) {
          onAvatarChange(newAvatarUrl);
        }
        
        toast.success('Avatar updated successfully');
      } catch (saveError) {
        console.error('Error saving avatar to profile:', saveError);
        toast.error('Avatar uploaded but profile not updated. Please try saving your profile.');
        
        // Update state and callback
        setAvatarUrl(newAvatarUrl);
        setImageUrl('');
        
        if (onAvatarChange) {
          onAvatarChange(newAvatarUrl);
        }
      }
    } catch (error) {
      console.error('Error uploading avatar from URL:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update avatar'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Preview URL before upload
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setPreviewUrl(e.target.value.trim() ? e.target.value : null);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div 
        ref={dropzoneRef}
        className={`relative cursor-pointer transition-all ${
          isDragging 
            ? 'scale-110 ring-4 ring-primary ring-offset-2 ring-offset-background' 
            : ''
        }`}
        onClick={() => document.getElementById('avatar-upload')?.click()}
      >
        <Avatar className="h-24 w-24 border-2 border-primary/30">
          {(previewUrl || avatarUrl) ? (
            <AvatarImage src={previewUrl || avatarUrl} alt={username || 'User'} className="object-cover" />
          ) : (
            <AvatarFallback className="text-xl bg-primary/10">
              {username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          )}
        </Avatar>
        
        {!isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="h-8 w-8 text-white" />
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="w-full max-w-xs">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <Camera className="mr-2 h-4 w-4" />
              From Device
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="mr-2 h-4 w-4" />
              From URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-center">
                <label htmlFor="avatar-upload" className="cursor-pointer w-full">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full cursor-pointer flex items-center justify-center"
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Select an image from your device (JPG, PNG) or drag and drop an image onto the avatar
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder="Enter image URL"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  disabled={isUploading}
                  className="flex-1"
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isUploading || !imageUrl.trim()}
                onClick={handleUrlUpload}
                className="w-full"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Use URL
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AvatarUploader;
