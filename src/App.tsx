
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Terms from '@/pages/Terms';
import Profile from '@/pages/Profile';
import ProfileEdit from '@/pages/ProfileEdit';
import CreatePost from '@/pages/CreatePost';
import PostView from '@/pages/PostView';
import EditPost from '@/pages/EditPost';
import UserProfile from '@/pages/UserProfile';
import MyPosts from '@/pages/MyPosts';
import { Messages } from '@/pages/Messages';
import NotFound from '@/pages/NotFound';
import Updates from './pages/Updates';
import { ThemeProvider } from '@/hooks/useTheme';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { ChatWindow } from '@/components/chat/ChatWindow';

function App() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Set initial loading to false once auth has been checked
    if (!isLoading) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (initialLoading) {
    return <LoadingScreen duration={2000} />;
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <Layout>
        {/* Main routes */}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Profile edit route */}
          <Route path="/profile/edit" element={<ProfileEdit />} />
          
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/post/:postId" element={<PostView />} />
          <Route path="/post/:postId/edit" element={<EditPost />} />
          <Route path="/edit-post/:postId" element={<EditPost />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/my-posts" element={<MyPosts />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Chat overlay routes */}
        <Routes>
          <Route path="/messages/:userId" element={<ChatWindow />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
