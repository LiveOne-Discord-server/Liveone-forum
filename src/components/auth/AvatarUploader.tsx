
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { uploadAvatar, uploadAvatarFromUrl, ensureAvatarBucket } from '@/utils/avatarStorage';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Upload, Loader2, Link, Image, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  username?: string;
  onAvatarChange?: (url: string) => void;
}

const AvatarUploader = ({ currentAvatarUrl, username, onAvatarChange }: AvatarUploaderProps) => {
  const { user, updateUserProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // Ensure the avatar bucket exists when the component mounts
    const initBucket = async () => {
      await ensureAvatarBucket();
    };
    
    initBucket();
  }, []);

  useEffect(() => {
    if (currentAvatarUrl) {
      setAvatarUrl(currentAvatarUrl);
    }
  }, [currentAvatarUrl]);

  // Общая функция для обновления аватара
  const updateAvatar = async (newAvatarUrl: string) => {
    try {
      // Обновляем URL аватара в контексте авторизации
      console.log('Updating profile with new avatar URL:', newAvatarUrl);
      const success = await updateUserProfile({ avatar: newAvatarUrl });
      
      if (!success) {
        throw new Error(t.profile?.avatarUpdateFailed || 'Failed to update avatar');
      }
      
      console.log('Profile updated with new avatar');
      
      // Обновляем локальное состояние
      setAvatarUrl(newAvatarUrl);
      if (onAvatarChange) {
        onAvatarChange(newAvatarUrl);
      }
      
      toast.success(t.profile?.avatarUpdated || 'Avatar updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : t.profile?.avatarUpdateFailed || 'Failed to update avatar'
      );
      return false;
    } finally {
      setPreviewUrl(null);
    }
  };

  // Handle file preview before upload
  const handleFilePreview = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setPreviewUrl(e.target.result);
      }
    };
    
    reader.readAsDataURL(file);
  };

  // Обработчик загрузки файла с компьютера
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    setIsUploading(true);
    
    try {
      // Проверяем, что пользователь авторизован
      if (!user || !user.id) {
        throw new Error(t.profile?.authRequired || 'You need to be logged in to update your avatar');
      }
      
      console.log('Uploading avatar for user:', user.id);
      
      // Загружаем аватар в хранилище
      const newAvatarUrl = await uploadAvatar(file, user.id);
      
      if (!newAvatarUrl) {
        throw new Error(t.profile?.avatarUploadFailed || 'Failed to upload avatar. Please try again.');
      }
      
      console.log('Avatar uploaded successfully:', newAvatarUrl);
      
      // Обновляем профиль с новым URL
      await updateAvatar(newAvatarUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : t.profile?.avatarUpdateFailed || 'Failed to update avatar'
      );
    } finally {
      setIsUploading(false);
    }
  };
  
  // Обработчик загрузки аватара по URL
  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Проверяем, что пользователь авторизован
      if (!user || !user.id) {
        throw new Error(t.profile?.authRequired || 'You need to be logged in to update your avatar');
      }
      
      console.log('Uploading avatar from URL for user:', user.id);
      
      // Show preview first
      setPreviewUrl(imageUrl);
      
      // Загружаем аватар по URL
      const newAvatarUrl = await uploadAvatarFromUrl(imageUrl, user.id);
      
      if (!newAvatarUrl) {
        throw new Error(t.profile?.avatarUploadFailed || 'Failed to upload avatar. Please try again.');
      }
      
      console.log('Avatar uploaded successfully from URL:', newAvatarUrl);
      
      // Обновляем профиль с новым URL
      await updateAvatar(newAvatarUrl);
      
      // Очищаем поле ввода URL
      setImageUrl('');
    } catch (error) {
      console.error('Error uploading avatar from URL:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : t.profile?.avatarUpdateFailed || 'Failed to upload avatar'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 animate-fadeIn">
      <div className="relative group">
        <Avatar className="h-24 w-24 ring-2 ring-orange-500/50 ring-offset-2 ring-offset-background transition-all duration-300 hover:ring-orange-500">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={username || 'Preview'} className="object-cover" />
          ) : (
            <AvatarImage src={avatarUrl} alt={username || 'User'} className="object-cover" />
          )}
          <AvatarFallback className="text-xl bg-gradient-to-br from-orange-400 to-red-500 text-white">
            {username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        
        <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <label htmlFor="avatar-quick-upload" className="cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors">
              <Camera className="h-4 w-4 text-white" />
            </div>
            <input
              id="avatar-quick-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleFilePreview(e);
                handleFileChange(e);
              }}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="transition-all duration-300 data-[state=active]:bg-orange-500">
              <Upload className="mr-2 h-4 w-4" />
              From Computer
            </TabsTrigger>
            <TabsTrigger value="url" className="transition-all duration-300 data-[state=active]:bg-orange-500">
              <Link className="mr-2 h-4 w-4" />
              From URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-center">
                <label htmlFor="avatar-upload" className="cursor-pointer w-full">
                  <div className="flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      disabled={isUploading}
                      className="cursor-pointer w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload from Computer
                    </Button>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleFilePreview(e);
                      handleFileChange(e);
                    }}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-xs text-center text-muted-foreground">Click the button to select an image from your computer</p>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder="Enter image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isUploading}
                  className="flex-1"
                />
              </div>
              <Button 
                type="button" 
                variant="default" 
                size="sm"
                disabled={isUploading || !imageUrl.trim()}
                onClick={handleUrlUpload}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:scale-[1.02]"
              >
                <Image className="mr-2 h-4 w-4" />
                Apply
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AvatarUploader;
