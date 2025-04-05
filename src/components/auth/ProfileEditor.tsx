
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import AvatarUploader from './AvatarUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/types';
import { AlertCircle, Loader2, Mail, Calendar, Clock, MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  status?: User['status'];
  email?: string;
  created_at?: string;
  banner_color?: string;
  banner_url?: string;
}

interface ProfileEditorProps {
  hideBannerControls?: boolean;
}

const ProfileEditor = ({ hideBannerControls = false }: ProfileEditorProps) => {
  const { user, appUser, updateUserProfile, fetchUserProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<User['status']>('online');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [joinDate, setJoinDate] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('general');
  const [bannerColor, setBannerColor] = useState('#3b82f6');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadProfile = async () => {
      if (!user) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        if (isMounted) setError(null);
        
        console.log('Loading profile, current appUser:', appUser);
        
        // Получаем email пользователя
        if (user.email) {
          setEmail(user.email);
        }
        
        // Проверяем, есть ли уже данные в appUser
        if (appUser && appUser.id === user.id) {
          if (isMounted) {
            setProfile({
              id: appUser.id,
              username: appUser.username || '',
              avatar_url: appUser.avatar,
              status: appUser.status,
              banner_color: appUser.banner_color,
              banner_url: appUser.banner_url
            });
            setUsername(appUser.username || '');
            setStatus(appUser.status || 'online');
            setBannerColor(appUser.banner_color || '#3b82f6');
            setBannerUrl(appUser.banner_url || null);
            
            // Загружаем дополнительную информацию о пользователе
            await loadUserStats(user.id);
            
            setIsLoading(false);
          }
          return;
        }
        
        console.log('Fetching user profile for:', user.id);
        const data = await fetchUserProfile(user.id);
        console.log('Fetched profile data:', data);
        
        if (!data && isMounted) {
          // Если профиль н�� найден, устанавливаем значения по умолчанию
          const defaultUsername = `user_${user.id.substring(0, 6)}`;
          setProfile({
            id: user.id,
            username: defaultUsername,
            status: 'online'
          });
          setUsername(defaultUsername);
          setStatus('online');
          toast.warning(t.profile?.profileNotFound || 'Профиль не найден. Создан новый профиль.');
          
          // Загружаем дополнительную информацию о пользователе
          await loadUserStats(user.id);
          
          setIsLoading(false);
          return;
        }

        if (isMounted) {
          setProfile(data);
          setUsername(data.username || '');
          setStatus(data.status as User['status'] || 'online');
          setBannerColor(data.banner_color || '#3b82f6');
          setBannerUrl(data.banner_url || null);
          
          // Загружаем дополнительную информацию о пользователе
          await loadUserStats(user.id);
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (isMounted) {
          setError(t.profile?.loadError || 'Не удалось загрузить профиль');
          toast.error(t.profile?.loadErrorToast || 'Ошибка при загрузке профиля. Попробуйте перезагрузить страницу.');
          setIsLoading(false);
        }
      }
    };
    
    // Функция для загрузки статистики пользователя
    const loadUserStats = async (userId: string) => {
      try {
        // Получаем дату создания профиля
        const { data: profileData } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .single();
          
        if (profileData?.created_at) {
          setJoinDate(profileData.created_at);
        }
        
        // Получаем количество постов пользователя
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId);
          
        setPostCount(count || 0);
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };
    
    loadProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user, fetchUserProfile, appUser, t.profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!username.trim()) {
      toast.error(t.profile?.usernameRequired || 'Имя пользователя не может быть пустым');
      return;
    }

    setIsSaving(true);

    try {
      setError(null);
      
      // Создаем объект обновлений
      const updates: Partial<User> = {
        username: username.trim(),
        status: status,
        banner_color: bannerColor
      };
      
      // Добавляем URL баннера, если он есть
      if (bannerUrl) {
        updates.banner_url = bannerUrl;
      }
      
      // Проверяем, изменились ли данные
      if (profile && 
          updates.username === profile.username && 
          updates.status === profile.status &&
          updates.banner_color === profile.banner_color &&
          updates.banner_url === profile.banner_url) {
        console.log('No changes detected, skipping update');
        toast.info(t.profile?.noChanges || 'Нет изменений для сохранения');
        setIsSaving(false);
        return;
      }
      
      const success = await updateUserProfile(updates);

      if (!success) {
        console.error('Profile update returned false');
        throw new Error(t.profile?.updateFailed || 'Не удалось обновить профиль');
      }

      console.log('Profile updated successfully');
      toast.success(t.profile?.updateSuccess || 'Профиль успешно обновлен');
      // Обновляем локальное состояние профиля
      setProfile(prev => prev ? { 
        ...prev, 
        username: username.trim(), 
        status,
        banner_color: bannerColor,
        banner_url: bannerUrl
      } : null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || (t.profile?.updateFailed || 'Не удалось обновить профиль');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/banner.${fileExt}`;
    
    setIsUploading(true);
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        setBannerUrl(data.publicUrl);
        toast.success(t.profile?.bannerUploaded || 'Banner uploaded');
      }
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      toast.error(error.message || 'Error uploading banner');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={isMobile ? "w-full" : ""}>
        <CardHeader>
          <CardTitle>{t.common?.profile}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t.common?.loading || 'Загрузка...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={isMobile ? "w-full" : ""}>
        <CardHeader>
          <CardTitle>{t.common?.profile}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 mb-4 text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            {t.common?.tryAgain || 'Попробовать снова'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isMobile ? "w-full" : ""}>
      <CardHeader>
        <CardTitle>{t.common?.profile}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">{t.profile?.general || 'Основное'}</TabsTrigger>
            {!hideBannerControls && (
              <TabsTrigger value="appearance">{t.profile?.appearance || 'Внешний вид'}</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-6">
              <div className="flex flex-col items-center mb-4">
                <AvatarUploader 
                  currentAvatarUrl={profile?.avatar_url} 
                  username={username} 
                  onAvatarChange={(url) => {
                    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">{t.auth?.username}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.auth?.username}
                  className="bg-gray-900 border-gray-800"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">{t.profile?.status}</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as User['status'])}>
                  <SelectTrigger className="bg-gray-900 border-gray-800">
                    <SelectValue placeholder={t.profile?.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">{t.profile?.statusOnline}</SelectItem>
                    <SelectItem value="dnd">{t.profile?.statusDnd}</SelectItem>
                    <SelectItem value="idle">{t.profile?.statusIdle}</SelectItem>
                    <SelectItem value="offline">{t.profile?.statusOffline}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          {!hideBannerControls && (
            <TabsContent value="appearance">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="block">{t.profile?.bannerPreview || 'Предпросмотр баннера'}</Label>
                  <div 
                    className="w-full h-32 rounded-md bg-cover bg-center flex items-center justify-center relative"
                    style={{
                      backgroundColor: bannerColor || '#3b82f6',
                      backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none'
                    }}
                  >
                    {!bannerUrl && (
                      <span className="text-white opacity-50">{t.profile?.bannerPreviewText || 'Ваш баннер'}</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bannerColor">{t.profile?.bannerColor || 'Цвет баннера'}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bannerColor"
                      type="color"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="w-12 h-10 p-1 bg-transparent"
                    />
                    <Input
                      type="text"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="flex-1 bg-gray-900 border-gray-800"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bannerImage">{t.profile?.bannerImage || 'Изображение баннера'}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bannerImage"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => document.getElementById('bannerImage')?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      {t.profile?.uploadBanner || 'Загрузить баннер'}
                    </Button>
                    
                    {bannerUrl && (
                      <Button 
                        type="button" 
                        variant="destructive"
                        onClick={() => setBannerUrl(null)}
                        disabled={isUploading}
                        className="flex-none"
                      >
                        {t.common?.remove || 'Удалить'}
                      </Button>
                    )}
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription>
                    {t.profile?.gradientTipText || 'Вы можете использовать градиенты для вашего баннера, введя значения вроде "linear-gradient(to right, #ff0000, #0000ff)" в поле цвета баннера.'}
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          )}
        </Tabs>
        
        <Button 
          onClick={handleSaveProfile} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? t.common?.saving : t.common?.save}
        </Button>
        
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-lg font-medium mb-4">{t.profile?.userInfo || 'Информация о пользователе'}</h3>
          
          <div className="space-y-4">
            {email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{email}</span>
              </div>
            )}
            
            {joinDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t.profile?.joinedAt || 'Дата регистрации'}: {format(new Date(joinDate), 'dd.MM.yyyy')}
                  <span className="ml-1 text-xs">({formatDistanceToNow(new Date(joinDate), { addSuffix: true })})</span>
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t.profile?.postCount || 'Количество постов'}: {postCount}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t.profile?.lastSeen || 'Последний вход'}: {formatDistanceToNow(new Date(), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;
