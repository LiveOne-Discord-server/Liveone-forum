
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageSelector from './LanguageSelector';
import ProfileDropdown from './ProfileDropdown';
import Logo from './Logo';
import NotificationsButton from './NotificationsButton';
import { FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Header = () => {
  const { isAuthenticated, onOpenAuthModal } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center mr-4">
          <Logo />
        </Link>
        
        <div className="flex items-center justify-between flex-1 gap-4">
          <div className="flex items-center">
            {isAuthenticated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/my-posts" className="p-2 hover:text-primary">
                      <FileText className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.navigation?.myPosts || 'My Posts'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <LanguageSelector />
              {isAuthenticated && <NotificationsButton />}
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <Link to="/auth">
                  <Button variant="default" size="sm">
                    {t.auth?.signIn || 'Login'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
