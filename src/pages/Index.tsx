
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import PostList from '@/components/posts/PostList';
import Logo from '@/components/ui/Logo';
import { PenSquare, Search, Tag } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    // Simulating loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen animate-fadeIn">
        <div className="flex flex-col items-center justify-center animate-slideInFromTop">
          <Logo size="lg" animated />
          <div className="mt-8 w-12 h-1 relative">
            <div className="absolute top-0 mt-1 w-12 h-1 bg-gray-900 rounded-full"></div>
            <div 
              className="absolute top-0 mt-1 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"
              style={{ 
                width: '80%', 
                animation: 'pulse 1.5s ease-in-out 0.5s infinite',
                boxShadow: '0 0 10px rgba(244, 67, 54, 0.5)'
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t.posts.latestPosts}</h1>
          {isAuthenticated && (
            <Link to="/create-post">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all">
                <PenSquare className="mr-2 h-4 w-4" />
                <span>{t.posts.createPost}</span>
              </Button>
            </Link>
          )}
        </div>
        
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
          <h2 className="text-lg font-medium mb-4">{t.posts.searchAndFilter || 'Поиск и фильтрация'}</h2>
          <PostList />
        </div>
      </div>
    </div>
  );
};

export default Index;
