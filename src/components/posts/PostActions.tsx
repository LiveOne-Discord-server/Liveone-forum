
import { useState, useEffect } from "react";
import { MoreHorizontal, Trash2, Edit, Lock, LockOpen, Pin, PinOff } from "lucide-react";
import { Post } from "@/types";
import { supabase } from "@/utils/supabase";
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
import { isUserAdmin, isUserModerator } from "@/utils/admin";

interface PostActionsProps {
  post?: Post;
  postId?: string;
  currentCommentsEnabled?: boolean;
  currentIsPinned?: boolean;
  onSettingsChanged?: (settings: { commentsEnabled: boolean, isPinned: boolean }) => void;
}

const PostActions = ({ 
  post, 
  postId,
  currentCommentsEnabled,
  currentIsPinned,
  onSettingsChanged 
}: PostActionsProps) => {
  const { user, appUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(
    currentCommentsEnabled !== undefined ? currentCommentsEnabled : true
  );
  const [isPinned, setIsPinned] = useState(
    currentIsPinned !== undefined ? currentIsPinned : false
  );
  
  const id = post?.id || postId;
  const isAuthor = user?.id === post?.authorId;

  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !id) return;
      
      if (appUser) {
        setIsAdmin(appUser.role === 'admin');
        setIsModerator(appUser.role === 'moderator');
      } else {
        const adminCheck = await isUserAdmin(user.id);
        setIsAdmin(adminCheck);
        
        const modCheck = await isUserModerator(user.id);
        setIsModerator(modCheck);
      }
      
      if (currentCommentsEnabled === undefined || currentIsPinned === undefined) {
        const { data } = await supabase
          .from('post_settings')
          .select('*')
          .eq('post_id', id)
          .single();
          
        if (data) {
          setCommentsEnabled(data.comments_enabled);
          setIsPinned(data.is_pinned);
        } else {
          await supabase
            .from('post_settings')
            .insert({
              post_id: id,
              comments_enabled: true,
              is_pinned: false
            });
        }
      }
    };
    
    loadSettings();
  }, [id, user, appUser, currentCommentsEnabled, currentIsPinned]);

  if (!user || !id || (!isAuthor && !isAdmin && !isModerator)) return null;

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
        
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
    navigate(`/edit-post/${id}`);
  };
  
  const toggleComments = async () => {
    setIsLoading(true);
    
    try {
      const newState = !commentsEnabled;
      
      const { error } = await supabase
        .from('post_settings')
        .update({ comments_enabled: newState })
        .eq('post_id', id);
        
      if (error) throw error;
      
      setCommentsEnabled(newState);
      toast.success(`Comments ${newState ? 'enabled' : 'disabled'}`);
      
      if (onSettingsChanged) {
        onSettingsChanged({
          commentsEnabled: newState,
          isPinned: isPinned
        });
      }
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
        .eq('post_id', id);
        
      if (error) throw error;
      
      setIsPinned(newState);
      toast.success(`Post ${newState ? 'pinned' : 'unpinned'}`);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      if (onSettingsChanged) {
        onSettingsChanged({
          commentsEnabled: commentsEnabled,
          isPinned: newState
        });
      }
    } catch (error) {
      console.error("Error toggling pin status:", error);
      toast.error("Failed to update pin status");
    } finally {
      setIsLoading(false);
    }
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
        
        {(isAdmin || isModerator) && !isAuthor && (
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
            
            {isAdmin && (
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
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Post
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostActions;
