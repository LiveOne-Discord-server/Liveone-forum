
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AvatarUploader from './AvatarUploader';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CirclePicker } from 'react-color';
import { supabase } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';
import UserStatus from './UserStatus';
import { uploadBannerImage } from '@/utils/bannerStorage';

interface ProfileEditorProps {
  hideBannerControls?: boolean;
}

const ProfileEditor = ({ hideBannerControls = false }: ProfileEditorProps) => {
  const { appUser, updateUserProfile } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [status, setStatus] = useState<string>('online');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bannerColor, setBannerColor] = useState<string>('#4f46e5');
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (appUser) {
      setUsername(appUser.username || '');
      setStatus(appUser.status || 'online');
      setBannerColor(appUser.banner_color || '#4f46e5');
      
      if (appUser.banner_url) {
        setBannerPreview(appUser.banner_url);
      }
    }
  }, [appUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBannerError(null);
    setIsSubmitting(true);

    try {
      // Validate username
      if (!username.trim()) {
        throw new Error('Username cannot be empty');
      }

      // Check authentication status first
      if (!appUser?.id) {
        throw new Error('You need to be logged in to update your profile');
      }

      let bannerUrl = appUser?.banner_url;

      // Upload banner if selected
      if (bannerFile && appUser?.id) {
        setUploadingBanner(true);
        
        try {
          console.log('Starting banner upload process');
          
          bannerUrl = await uploadBannerImage(
            bannerFile, 
            appUser.id,
            (progress) => setUploadProgress(progress)
          );
          
          console.log('Banner uploaded successfully:', bannerUrl);
        } catch (uploadError: any) {
          console.error('Banner upload error details:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'unknown error';
          setBannerError(`Failed to upload banner: ${errorMessage}`);
          toast.error(`Failed to upload banner: ${errorMessage}`);
          setIsSubmitting(false);
          setUploadingBanner(false);
          setUploadProgress(0);
          return; // Stop the submission process if banner upload fails
        } finally {
          setUploadingBanner(false);
          setUploadProgress(0);
        }
      }

      // Ensure status is one of the valid types
      const validStatus = status as 'online' | 'offline' | 'dnd' | 'idle';

      // Update profile with banner
      console.log('Updating profile with:', { username, status: validStatus, bannerColor, bannerUrl });
      const success = await updateUserProfile({
        username,
        status: validStatus,
        banner_color: bannerColor,
        banner_url: bannerUrl
      });

      if (success) {
        toast.success("Your profile has been updated successfully");
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'An unexpected error occurred');
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log(`Selected file: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    // Reset any previous errors
    setBannerError(null);
    
    // Validate file type - accept any image file
    if (!file.type.startsWith('image/')) {
      setBannerError('Please select a valid image file');
      toast.error('Please select a valid image file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setBannerError('File size must be less than 5MB');
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setBannerFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAndSaveBanner = async (file: File) => {
    if (!appUser?.id) {
      toast.error('You need to be logged in to update your banner');
      return;
    }
    
    setBannerError(null);
    setUploadingBanner(true);
    setUploadProgress(0);
    
    try {
      console.log('Starting banner upload process');
      
      const bannerUrl = await uploadBannerImage(
        file, 
        appUser.id,
        (progress) => setUploadProgress(progress)
      );
      
      console.log('Banner uploaded successfully:', bannerUrl);
      
      // Auto-save the profile with the new banner
      const { error } = await supabase
        .from('profiles')
        .update({ banner_url: bannerUrl })
        .eq('id', appUser.id);
        
      if (error) {
        console.error('Error updating profile with new banner:', error);
        throw error;
      }
      
      toast.success("Banner updated successfully");
      
    } catch (uploadError: any) {
      console.error('Banner upload error details:', uploadError);
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'unknown error';
      setBannerError(`Failed to upload banner: ${errorMessage}`);
      toast.error(`Failed to upload banner: ${errorMessage}`);
    } finally {
      setUploadingBanner(false);
      setUploadProgress(0);
    }
  };

  const selectBannerFile = () => {
    fileInputRef.current?.click();
  };

  if (!appUser) {
    return <div>Loading profile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4">
            <div>
              <Label>User ID</Label>
              <Input
                value={appUser.id || ''}
                disabled
                className="bg-gray-800 text-gray-400"
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                value={appUser.email || ''}
                disabled
                className="bg-gray-800 text-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span> Online
                    </span>
                  </SelectItem>
                  <SelectItem value="idle">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span> Idle
                    </span>
                  </SelectItem>
                  <SelectItem value="dnd">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span> Do Not Disturb
                    </span>
                  </SelectItem>
                  <SelectItem value="offline">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-500"></span> Offline
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Profile Picture</Label>
              <div className="mt-2">
                <AvatarUploader />
              </div>
            </div>
            
            {!hideBannerControls && (
              <>
                <div>
                  <Label>Banner Image</Label>
                  <div className="mt-2 space-y-2">
                    {bannerError && (
                      <Alert variant="destructive" className="mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{bannerError}</AlertDescription>
                      </Alert>
                    )}
                    <div 
                      className="relative h-24 w-full rounded-lg bg-center bg-cover border border-gray-700" 
                      style={{ 
                        backgroundColor: bannerColor,
                        backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined
                      }}
                    >
                      {uploadingBanner && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                          <div className="mt-2 text-sm text-white">{Math.round(uploadProgress)}%</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm"
                        onClick={selectBannerFile}
                        disabled={uploadingBanner}
                      >
                        Upload Image
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleBannerChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Banner Color</Label>
                  <div className="mt-2">
                    <CirclePicker 
                      color={bannerColor}
                      onChange={(color) => setBannerColor(color.hex)}
                      width="100%"
                      circleSize={24}
                      circleSpacing={12}
                      colors={[
                        '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', 
                        '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
                        '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'
                      ]}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || uploadingBanner}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;
