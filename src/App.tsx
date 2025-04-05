
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './hooks/useLanguage';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import Layout from './components/layout/Layout';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Index from './pages/Index';
import CreatePost from './pages/CreatePost';
import PostView from './pages/PostView';
import EditPost from './pages/EditPost';
import Terms from './pages/Terms';
import MyPosts from './pages/MyPosts';
import UserProfile from './pages/UserProfile';
import ProfileEdit from '@/pages/ProfileEdit';
import Messages from '@/pages/Messages';
import Auth from '@/pages/Auth';
import { initializeStorage } from './utils/storage';
import { supabase } from './utils/supabase';
import { ThemeProvider } from './components/ui/theme-provider';
import { Toaster as SonnerToaster } from './components/ui/sonner';
import NotificationListener from './components/notifications/NotificationListener';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeStorage();
        supabase
          .channel('table-db-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public'
            },
            (payload) => {
              console.log('Database change:', payload);
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    };

    initApp();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-300 rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading Application...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/edit" element={<ProfileEdit />} />
                  <Route path="create-post" element={<CreatePost />} />
                  <Route path="post/:postId" element={<PostView />} />
                  <Route path="user/:userId" element={<UserProfile />} />
                  <Route path="messages/:userId" element={<Messages />} />
                  <Route path="edit-post/:postId" element={<EditPost />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="my-posts" element={<MyPosts />} />
                  <Route path="auth" element={<Auth />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              <NotificationListener />
            </Router>
            <Toaster />
            <SonnerToaster position="top-right" />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
