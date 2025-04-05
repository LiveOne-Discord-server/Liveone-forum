
import { useState, useEffect } from "react";
import { MoreHorizontal, Trash2, Edit, Lock, LockOpen, Pin, PinOff, UserCircle } from "lucide-react";
import { Post } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { isUserAdmin } from "@/utils/admin";

interface PostActionsProps {
  post: Post;
}

export const PostActions = ({ post }: PostActionsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const isAuthor = user?.id === post.authorId;

  // Load post settings and check admin status when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      // Check if user is admin
      if (user) {
        const adminStatus = await isUserAdmin(user.id);
        setIsAdmin(adminStatus);
      }
      
      // Get post settings
      const { data } = await supabase
        .from('post_settings')
        .select('*')
        .eq('post_id', post.id)
        .single();
        
      if (data) {
        setCommentsEnabled(data.comments_enabled);
        setIsPinned(data.is_pinned);
      } else {
        // Create default settings if they don't exist
        await supabase
          .from('post_settings')
          .insert({
            post_id: post.id,
            comments_enabled: true,
            is_pinned: false
          });
      }
    };
    
    loadSettings();
  }, [post.id, user]);

  // Show dropdown menu if the user is the author or an admin
  if (!user || (!isAuthor && !isAdmin)) return null;

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
        
      if (error) throw error;
      
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate("/");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditPost = () => {
    navigate(`/edit-post/${post.id}`);
  };
  
  const toggleComments = async () => {
    setIsLoading(true);
    
    try {
      const newState = !commentsEnabled;
      
      const { error } = await supabase
        .from('post_settings')
        .update({ comments_enabled: newState })
        .eq('post_id', post.id);
        
      if (error) throw error;
      
      setCommentsEnabled(newState);
      toast.success(`Comments ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Error toggling comments:", error);
      toast.error("Failed to update comment settings");
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePin = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    
    try {
      const newState = !isPinned;
      
      const { error } = await supabase
        .from('post_settings')
        .update({ is_pinned: newState })
        .eq('post_id', post.id);
        
      if (error) throw error;
      
      setIsPinned(newState);
      toast.success(`Post ${newState ? 'pinned' : 'unpinned'}`);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error("Error toggling pin status:", error);
      toast.error("Failed to update pin status");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewMyPosts = () => {
    navigate('/my-posts');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAuthor && (
          <>
            <DropdownMenuItem onClick={handleEditPost}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Post
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={toggleComments}>
              {commentsEnabled ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Disable Comments
                </>
              ) : (
                <>
                  <LockOpen className="mr-2 h-4 w-4" />
                  Enable Comments
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Post
            </DropdownMenuItem>
          </>
        )}
        
        {isAdmin && !isAuthor && (
          <>
            <DropdownMenuItem onClick={toggleComments}>
              {commentsEnabled ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Disable Comments
                </>
              ) : (
                <>
                  <LockOpen className="mr-2 h-4 w-4" />
                  Enable Comments
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={togglePin}>
              {isPinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin Post
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin Post
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Post
            </DropdownMenuItem>
          </>
        )}
        
        {isAdmin && isAuthor && (
          <DropdownMenuItem onClick={togglePin}>
            {isPinned ? (
              <>
                <PinOff className="mr-2 h-4 w-4" />
                Unpin Post
              </>
            ) : (
              <>
                <Pin className="mr-2 h-4 w-4" />
                Pin Post
              </>
            )}
          </DropdownMenuItem>
        )}
        
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewMyPosts}>
              <UserCircle className="mr-2 h-4 w-4" />
              View My Posts
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostActions;
