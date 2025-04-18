
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import PostList from '@/components/posts/PostList';
import Logo from '@/components/ui/Logo';
import { PenSquare } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/utils/supabase';
import LoadingScreen from '@/components/ui/LoadingScreen';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Set initial loading to false after a short delay
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Add moderators - only run this once
    const addModerators = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('add_moderators');
        
        if (error) {
          console.error('Error adding moderators:', error);
        } else {
          console.log('Moderators added:', data);
        }
      } catch (e) {
        console.error('Exception adding moderators:', e);
      }
    };
    
    // Call this function on first page load to ensure moderators are set up
    addModerators();
  }, []);

  if (pageLoading) {
    return <LoadingScreen duration={1000} />;
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
          <h2 className="text-lg font-medium mb-4">{t.posts.searchAndFilter || 'Search and Filter'}</h2>
          <PostList />
        </div>
      </div>
    </div>
  );
};

export default Index;
