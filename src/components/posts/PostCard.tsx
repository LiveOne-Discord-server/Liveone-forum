
import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Post } from "@/types";
import VoteButtons from "./VoteButtons";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PinnedBadge from "./PinnedBadge";
import { Author } from "@/components/comments/types";

interface PostCardProps {
  post: Post;
  isPinned?: boolean;
}

export const PostCard = ({ post, isPinned }: PostCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Добавляем небольшую задержку для плавного появления
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Convert User type to Author type for compatibility
  const authorForHeader: Author = {
    username: post.author.username,
    avatar_url: post.author.avatar || '',
    role: post.author.role,
    id: post.author.id // This is now required in the Author interface
  };
  
  return (
    <Card 
      className={cn("neon-card overflow-hidden mb-6 transition-all duration-500", 
        isPinned && "border-orange-500 shadow-orange-500/20 shadow-lg",
        isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4')}
      style={{ transitionDelay: '100ms' }}>
      {isPinned && <PinnedBadge />}
      
      <CardHeader>
        <PostHeader 
          postId={post.id}
          title={post.title}
          author={authorForHeader}
          createdAt={post.createdAt}
        />
      </CardHeader>
      
      <CardContent>
        <PostContent 
          content={post.content}
          mediaUrl={post.mediaUrls?.[0]}
          tags={post.tags}
        />
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        <div className="flex items-center gap-4">
          <VoteButtons 
            postId={post.id}
            initialUpvotes={post.upvotes}
            initialDownvotes={post.downvotes}
            userVote={post.userVote}
          />

          <Link to={`/post/${post.id}`} className="flex items-center text-muted-foreground text-sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>Comments</span>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
