
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Logo } from '../ui/Logo';
import { Home, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import ProfileDropdown from './ProfileDropdown';
import LanguageSelector from '../language/LanguageSelector';
import NotificationsButton from './NotificationsButton';

interface NavigationItemProps {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ to, children, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all 
                 hover:bg-accent/50 ${isActive ? 'bg-accent/70 text-primary' : 'text-muted-foreground'}`}
    >
      {icon}
      {children}
    </Link>
  );
};

const Header = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <header className="border-b border-gray-800 sticky top-0 z-50 backdrop-blur-xl bg-background/90">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-2xl font-bold">
            <Logo className="h-8" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              to="/" 
              className={`flex items-center justify-center p-2 rounded-md hover:bg-accent/50 ${location.pathname === '/' ? 'bg-accent/70 text-primary' : 'text-muted-foreground'}`}
              title={t.navigation?.home || 'Home'}
            >
              <Home className="w-5 h-5" />
            </Link>
            <Link 
              to="/updates" 
              className={`flex items-center justify-center p-2 rounded-md hover:bg-accent/50 ${location.pathname === '/updates' ? 'bg-accent/70 text-primary' : 'text-muted-foreground'}`}
              title={t.navigation?.updates || 'Updates'}
            >
              <FileText className="w-5 h-5" />
            </Link>
            {isAuthenticated && (
              <>
                <NavigationItem to="/my-posts">{t.navigation?.myPosts || 'My Posts'}</NavigationItem>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSelector />
          
          {isAuthenticated && (
            <NotificationsButton />
          )}
          
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : (
            <Link to="/auth">
              <Button>{t.auth?.signIn || 'Sign In'}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
