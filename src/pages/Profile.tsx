
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import ProfileEditor from '@/components/auth/ProfileEditor';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import UserAchievements from '@/components/users/UserAchievements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Add a timeout to ensure UI is properly rendered
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);

    if (!isLoading && !isAuthenticated) {
      toast.error(t.auth?.pleaseSignIn || 'Please sign in');
      navigate('/auth');
    }

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate, t.auth?.pleaseSignIn, isLoading]);

  // Show loading screen while authentication state is being determined
  if (isLoading || pageLoading) {
    return <LoadingScreen duration={1000} />;
  }

  // If not authenticated after loading, redirect handled in useEffect
  if (!isAuthenticated || !user) {
    return null;
  }

  console.log("Rendering profile page for user:", user.id);

  return (
    <div className={`container ${isMobile ? 'px-4' : 'max-w-2xl'} mx-auto py-6 md:py-10`}>
      <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t.common?.profile || 'Profile'}</h1>
      </div>
      
      {user.id && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <UserAchievements userId={user.id} />
          </CardContent>
        </Card>
      )}
      
      <ProfileEditor />
    </div>
  );
};

export default Profile;
