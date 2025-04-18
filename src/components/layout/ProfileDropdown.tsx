
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ProfileDropdown = () => {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t.auth?.logoutError || 'Logout error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className={`h-8 w-8 ${
            appUser?.role === 'admin' ? 'border-2 border-yellow-500 shadow-lg shadow-yellow-500/20' : 
            appUser?.role === 'moderator' ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : 
            ''
          }`}>
            <AvatarImage src={appUser?.avatar || undefined} alt={appUser?.username || 'User'} />
            <AvatarFallback>{appUser?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem onClick={() => navigate(`/user/${appUser?.id}`)}>
          <User className="mr-2 h-4 w-4" />
          <span>{t.profile?.title || 'Profile'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t.profile?.edit || 'Edit Profile'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          disabled={isLoggingOut}
          className="text-red-500 focus:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? (t.auth?.loggingOut || 'Logging out...') : (t.auth?.logout || 'Logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
