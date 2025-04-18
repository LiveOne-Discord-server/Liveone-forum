
import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Post } from "@/types";
import VoteButtons from "./VoteButtons";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PinnedBadge from "./PinnedBadge";
import { Author } from "@/components/comments/types";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import PostReactions from "./PostReactions";
import { supabase } from "@/utils/supabase";

interface PostCardProps {
  post: Post;
  isPinned?: boolean;
}

export const PostCard = ({ post, isPinned }: PostCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  
  useEffect(() => {
    // Smooth appearance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // Fetch comment count
    const fetchCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id);
          
        if (!error && count !== null) {
          setCommentCount(count);
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };
    
    fetchCommentCount();
    
    return () => clearTimeout(timer);
  }, [post.id]);
  
  // Convert User type to Author type for compatibility
  const authorForHeader: Author = {
    username: post.author.username,
    avatar_url: post.author.avatar || '',
    role: post.author.role,
    id: post.author.id,
    status: post.author.status
  };
  
  return (
    <Card 
      className={cn("neon-card overflow-hidden mb-6 transition-all duration-500", 
        isPinned && "border-orange-500 shadow-orange-500/20 shadow-lg",
        post.author.role === 'admin' && "border-yellow-500 shadow-yellow-500/10",
        post.author.role === 'moderator' && "border-blue-500 shadow-blue-500/10",
        isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4')}
      style={{ transitionDelay: '100ms' }}>
      {isPinned && <PinnedBadge />}
      
      <CardHeader>
        <PostHeader 
          postId={post.id}
          title={post.title}
          author={authorForHeader}
          createdAt={post.createdAt}
          lastEditedAt={post.lastEdited}
        />
      </CardHeader>
      
      <CardContent>
        <Link to={`/post/${post.id}`} className="block">
          <PostContent 
            content={post.content}
            createdAt={post.createdAt}
            lastEdited={post.lastEdited}
            mediaUrl={post.mediaUrls?.[0]}
            tags={post.tags}
          />
        </Link>
        
        {post.lastEdited && (
          <div className="mt-3">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Edited {formatDistanceToNow(new Date(post.lastEdited), { addSuffix: true })}
            </Badge>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        <div className="flex items-center gap-4">
          <VoteButtons 
            postId={post.id}
            initialUpvotes={post.upvotes}
            initialDownvotes={post.downvotes}
            userVote={post.userVote}
          />

          <PostReactions postId={post.id} />

          <Link to={`/post/${post.id}`} className="flex items-center text-muted-foreground text-sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{commentCount > 0 ? `${commentCount} Comments` : 'Comments'}</span>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
