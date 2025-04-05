
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfileEditor from '@/components/auth/ProfileEditor';

const ProfileEdit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      toast.error(t.auth?.pleaseSignIn || 'Please sign in');
      navigate('/');
      return;
    }
  }, [user, navigate, t.auth?.pleaseSignIn]);

  if (!user) {
    return null;
  }

  return (
    <div className={`container ${isMobile ? 'px-4' : 'max-w-3xl'} mx-auto py-6 md:py-10`}>
      <Button variant="outline" className="mb-6" onClick={() => navigate('/profile')}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">{t.profile?.editProfile || 'Edit Profile'}</h1>
      
      <Card>
        <ProfileEditor hideBannerControls={false} />
      </Card>
    </div>
  );
};

export default ProfileEdit;
