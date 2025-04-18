
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { getUserPosts } from '@/utils/admin';
import PostCard from '@/components/posts/PostCard';
import { Post } from '@/types';
import { ChevronLeft } from 'lucide-react';

const MyPosts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !isLoading) {
      navigate('/');
      return;
    }

    const loadPosts = async () => {
      if (!user) return;
      
      setIsLoading(true);
      const userPostsData = await getUserPosts(user.id);
      setPosts(userPostsData);
      setIsLoading(false);
    };

    if (user) {
      loadPosts();
    }
  }, [user, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-800 p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gray-800 h-10 w-10 animate-pulse" />
                <div className="space-y-3 w-full">
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-800 rounded animate-pulse w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Posts</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        {posts.length === 0 ? (
          <div className="rounded-lg border border-gray-800 p-6 text-center">
            <p className="text-muted-foreground">You haven't created any posts yet.</p>
            <Button 
              className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => navigate('/create-post')}
            >
              Create Your First Post
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} isPinned={post.isPinned} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPosts;
