import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AvatarUploader from '@/components/auth/AvatarUploader';
import { User } from '@/types';
import { CalendarIcon, Info, Upload, Camera, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { uploadBannerImage, uploadBannerFromUrl } from '@/utils/bannerStorage';
import { useLanguage } from '@/hooks/useLanguage';

const ProfileEdit = () => {
  const { appUser, updateUserProfile, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [bannerColor, setBannerColor] = useState('#4f46e5');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<User['status']>('online');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerDropzoneRef = useRef<HTMLDivElement>(null);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (!isLoading && !appUser) {
      toast.error(t.auth?.pleaseSignIn || 'You must be logged in to edit your profile');
      navigate('/auth');
      return;
    }
    
    if (appUser) {
      setUsername(appUser.username || '');
      setAvatar(appUser.avatar || null);
      setBannerColor(appUser.banner_color || '#4f46e5');
      setStatus(appUser.status || 'online');
      
      if (appUser.banner_url) {
        setBannerPreview(appUser.banner_url);
      }
    }
  }, [appUser, isLoading, navigate, t.auth?.pleaseSignIn]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingBanner(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingBanner(false);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingBanner(false);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          handleBannerFileSelected(file);
        } else {
          setBannerError(t.profile?.imageTypeError || "Please upload an image file for the banner.");
          toast.error(t.profile?.imageTypeError || "Please upload an image file for the banner.");
        }
      }
    };

    const dropzone = bannerDropzoneRef.current;
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
  }, [t.profile?.imageTypeError]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    handleBannerFileSelected(file);
  };

  const handleBannerFileSelected = (file: File) => {
    console.log(`Selected file: ${file.name} (${file.type}, ${file.size} bytes)`);
    setBannerError(null);
    
    if (!file.type.startsWith('image/')) {
      const errorMsg = t.profile?.invalidImageType || 'Please select a valid image file';
      setBannerError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = t.profile?.fileTooLarge || 'File size must be less than 5MB';
      setBannerError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    setBannerFile(file);
    setBannerUrl('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBannerUrl(e.target.value);
    setBannerError(null);
  };

  const handleBannerUrlPreview = () => {
    if (!bannerUrl.trim()) return;
    
    if (!bannerUrl.match(/^https?:\/\/.+/i)) {
      const errorMsg = t.profile?.invalidUrl || 'Invalid URL format';
      setBannerError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    setBannerPreview(bannerUrl);
    setBannerFile(null);
  };

  const handleStatusChange = (newStatus: User['status']) => {
    setStatus(newStatus);
  };

  const handleAvatarChange = (url: string | null) => {
    setAvatar(url);
  };

  const handleSaveProfile = async () => {
    if (!appUser) return;
    
    if (username.trim().length < 3) {
      toast.error(t.profile?.invalidUsername || 'Username must be at least 3 characters long');
      return;
    }
    
    setBannerError(null);
    setIsSaving(true);
    
    try {
      const updates: Partial<User> = {};
      
      updates.username = username;
      updates.status = status;
      updates.banner_color = bannerColor;
      
      if (avatar !== appUser.avatar) {
        updates.avatar = avatar;
      }
      
      if (bannerFile) {
        setIsUploading(true);
        try {
          console.log('Uploading banner file...');
          const bannerUrl = await uploadBannerImage(
            bannerFile, 
            appUser.id,
            (progress) => setUploadProgress(progress)
          );
          updates.banner_url = bannerUrl;
          console.log('Banner file uploaded successfully:', bannerUrl);
        } catch (error: any) {
          console.error('Failed to upload banner file:', error);
          const errorMsg = error.message || t.profile?.bannerUploadFailed || 'Failed to upload banner image';
          setBannerError(errorMsg);
          toast.error(errorMsg);
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
        setIsUploading(false);
      } else if (bannerUrl && bannerUrl !== appUser.banner_url) {
        setIsUploading(true);
        try {
          console.log('Uploading banner from URL...');
          const uploadedUrl = await uploadBannerFromUrl(bannerUrl, appUser.id);
          updates.banner_url = uploadedUrl;
          console.log('Banner from URL uploaded successfully:', uploadedUrl);
        } catch (error: any) {
          console.error('Failed to upload banner from URL:', error);
          const errorMsg = error.message || t.profile?.bannerUrlFailed || 'Failed to upload banner from URL';
          setBannerError(errorMsg);
          toast.error(errorMsg);
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
        setIsUploading(false);
      }
      
      console.log('Saving profile with updates:', updates);
      const success = await updateUserProfile(updates);
      
      if (success) {
        toast.success(t.profile?.updateSuccess || 'Profile updated successfully');
        navigate('/');
      } else {
        toast.error(t.profile?.updateFailed || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || t.common?.errorOccurred || 'An error occurred while saving your profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-10">{t.common?.loading || 'Loading profile...'}</div>;
  }

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t.profile?.editProfile || 'Edit Profile'}</CardTitle>
          <CardDescription>Update your profile information and appearance</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-1/3">
              <Label className="text-base font-medium mb-2 block">{t.profile?.profilePicture || 'Profile Picture'}</Label>
              <AvatarUploader
                currentAvatarUrl={avatar}
                onAvatarChange={handleAvatarChange}
                username={username}
              />
            </div>
            
            <div className="w-full sm:w-2/3 space-y-4">
              <div>
                <Label htmlFor="username" className="text-base font-medium">{t.auth?.username || 'Username'}</Label>
                <Input 
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1"
                  placeholder={t.auth?.username || 'Your username'}
                />
              </div>
              
              <div>
                <Label className="text-base font-medium">{t.profile?.status || 'Status'}</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={status === 'online' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => handleStatusChange('online')}
                  >
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      <span>{t.profile?.statusOnline || 'Online'}</span>
                    </span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={status === 'idle' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => handleStatusChange('idle')}
                  >
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                      <span>{t.profile?.statusIdle || 'Idle'}</span>
                    </span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={status === 'dnd' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => handleStatusChange('dnd')}
                  >
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                      <span>{t.profile?.statusDnd || 'Do Not Disturb'}</span>
                    </span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={status === 'offline' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => handleStatusChange('offline')}
                  >
                    <span className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-gray-500 mr-2" />
                      <span>{t.profile?.statusOffline || 'Offline'}</span>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Label className="text-base font-medium">{t.profile?.bannerPreview || 'Profile Banner'}</Label>
            {bannerError && (
              <Alert variant="destructive" className="mt-2 mb-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{bannerError}</AlertDescription>
              </Alert>
            )}
            <div 
              ref={bannerDropzoneRef}
              className={`mt-2 cursor-pointer transition-all ${isDraggingBanner ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div 
                className="relative h-32 w-full rounded-lg bg-center bg-cover border border-gray-700 overflow-hidden" 
                style={{ 
                  backgroundColor: bannerColor,
                  backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined
                }}
              >
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    <div className="mt-2 text-sm text-white">{Math.round(uploadProgress)}%</div>
                  </div>
                )}
                {!isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                  {t.profile?.bannerPreviewText || 'Banner Preview'}
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-sm font-medium block mb-1">{t.profile?.uploadBanner || 'Upload Banner Image'}</Label>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 w-full"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload size={16} />
                    {bannerFile ? bannerFile.name : (t.profile?.chooseBanner || 'Choose Banner Image')}
                  </Button>
                  <input
                    id="banner-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                    disabled={isUploading}
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.profile?.dragBannerHint || 'You can also drag and drop an image onto the banner preview'}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium block mb-1">{t.profile?.bannerUrl || 'Or use image URL'}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={bannerUrl}
                    onChange={handleBannerUrlChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                    disabled={isUploading}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleBannerUrlPreview} 
                    disabled={!bannerUrl.trim() || isUploading}
                  >
                    {t.profile?.preview || 'Preview'}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium block mb-1">{t.profile?.bannerColor || 'Or choose a background color'}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bannerColor}
                    onChange={(e) => setBannerColor(e.target.value)}
                    className="block w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={bannerColor}
                    onChange={(e) => setBannerColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Info size={12} />
                  <span>{t.profile?.gradientTipText || 'You can use gradients like "linear-gradient(to right, #ff0000, #0000ff)"'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {appUser?.created_at && (
            <div className="pt-2 border-t border-gray-700/50">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarIcon size={14} />
                <span>{t.profile?.memberSince || 'Member since'} {format(new Date(appUser.created_at), 'PP')}</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
            <Button 
              variant="outline" 
              onClick={() => navigate('/profile')}
              disabled={isSaving || isUploading}
            >
              {t.common?.cancel || 'Cancel'}
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={isSaving || isUploading}
            >
              {isSaving || isUploading ? (t.common?.saving || 'Saving...') : (t.common?.save || 'Save Changes')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEdit;
