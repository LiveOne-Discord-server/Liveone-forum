
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <Link to="/" onClick={handleLinkClick} className="flex items-center">
                <span className="text-lg font-bold">LiveOne</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="flex-1">
              <div className="space-y-4">
                <Link 
                  to="/" 
                  className="block py-2 hover:text-primary transition-colors" 
                  onClick={handleLinkClick}
                >
                  {t.navigation?.home || 'Home'}
                </Link>
                
                {isAuthenticated && (
                  <>
                    <Link 
                      to="/create-post" 
                      className="block py-2 hover:text-primary transition-colors" 
                      onClick={handleLinkClick}
                    >
                      {t.navigation?.createPost || 'Create Post'}
                    </Link>
                    
                    <Link 
                      to="/my-posts" 
                      className="block py-2 hover:text-primary transition-colors" 
                      onClick={handleLinkClick}
                    >
                      {t.navigation?.myPosts || 'My Posts'}
                    </Link>
                    
                    <Link 
                      to="/profile" 
                      className="block py-2 hover:text-primary transition-colors" 
                      onClick={handleLinkClick}
                    >
                      {t.profile?.title || 'Profile'}
                    </Link>
                  </>
                )}
                
                <Link 
                  to="/terms" 
                  className="block py-2 hover:text-primary transition-colors" 
                  onClick={handleLinkClick}
                >
                  {t.navigation?.terms || 'Terms'}
                </Link>
              </div>
            </nav>
            
            <div className="pt-6 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <LanguageSelector />
                {!isAuthenticated && (
                  <Button variant="default" size="sm" onClick={() => {
                    setOpen(false);
                  }}>
                    {t.auth?.signIn || 'Login'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileMenu;
