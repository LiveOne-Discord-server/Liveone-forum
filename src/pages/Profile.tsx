
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import ProfileEditor from '@/components/auth/ProfileEditor';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error(t.auth?.pleaseSignIn || 'Please sign in');
      navigate('/');
    }
  }, [isAuthenticated, navigate, t.auth?.pleaseSignIn, isLoading]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={`container ${isMobile ? 'px-4' : 'max-w-2xl'} mx-auto py-6 md:py-10`}>
      <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t.common?.profile || 'Profile'}</h1>
      </div>
      
      <ProfileEditor hideBannerControls={true} />
    </div>
  );
};

export default Profile;
