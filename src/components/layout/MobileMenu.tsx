
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Home, PenSquare, User, BookOpen, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import NavigationItem from './NavigationItem';

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  
  const handleClose = () => {
    setOpen(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80%] sm:max-w-xs bg-gray-900 border-gray-800">
        <div className="px-2 py-6">
          <div className="mb-4 px-2">
            <h2 className="text-lg font-bold">Menu</h2>
          </div>
          <nav className="flex flex-col gap-1">
            <NavigationItem to="/" onClick={handleClose} icon={<Home className="h-5 w-5" />}>
              {t.navigation?.home || 'Home'}
            </NavigationItem>
            
            {isAuthenticated ? (
              <>
                <NavigationItem to="/create-post" onClick={handleClose} icon={<PenSquare className="h-5 w-5" />}>
                  {t.navigation?.createPost || 'Create Post'}
                </NavigationItem>
                <NavigationItem to="/my-posts" onClick={handleClose} icon={<BookOpen className="h-5 w-5" />}>
                  {t.navigation?.myPosts || 'My Posts'}
                </NavigationItem>
                <NavigationItem to="/profile" onClick={handleClose} icon={<User className="h-5 w-5" />}>
                  {t.navigation?.profile || 'Profile'}
                </NavigationItem>
                <NavigationItem to="/updates" onClick={handleClose} icon={<BookOpen className="h-5 w-5" />}>
                  {t.navigation?.updates || 'Updates'}
                </NavigationItem>
                <hr className="my-2 border-gray-800" />
                <Button
                  variant="ghost"
                  className="justify-start px-3 font-normal hover:bg-gray-800"
                  onClick={() => {
                    logout();
                    handleClose();
                  }}
                >
                  {t.navigation?.logout || 'Logout'}
                </Button>
              </>
            ) : (
              <NavigationItem to="/auth" onClick={handleClose} icon={<LogIn className="h-5 w-5" />}>
                {t.navigation?.login || 'Login / Register'}
              </NavigationItem>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileMenu;
