
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Author } from "@/components/comments/types";
import PostActions from './PostActions';
import FollowButton from '@/components/users/FollowButton';
import { Post, User } from '@/types';

interface PostHeaderProps {
  postId: string;
  title: string;
  author: Author;
  createdAt: string;
  isCompact?: boolean;
}

const PostHeader: React.FC<PostHeaderProps> = ({
  postId,
  title,
  author,
  createdAt,
  isCompact = false
}) => {
  // Create a post object for PostActions
  const postForActions: Post = {
    id: postId,
    title: title,
    content: '',
    authorId: author.id,
    author: {
      id: author.id,
      username: author.username,
      avatar: author.avatar_url,
      provider: 'github',
      // Ensure role is one of the allowed values or default to 'user'
      role: (author.role === 'admin' || author.role === 'moderator' || author.role === 'user') 
        ? author.role 
        : 'user',
      status: author.status || 'online' // Use author status or default to 'online'
    },
    createdAt: createdAt,
    tags: [],
    upvotes: 0,
    downvotes: 0
  };

  if (isCompact) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to={`/post/${postId}`} className="font-medium hover:underline">
            {title}
          </Link>
        </div>
        
        {!isCompact && <PostActions post={postForActions} />}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <PostActions post={postForActions} />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to={`/user/${author.id}`} className="flex items-center gap-2 hover:opacity-80">
            <Avatar className="h-6 w-6">
              <AvatarImage src={author.avatar_url} alt={author.username} />
              <AvatarFallback>{author.username[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{author.username}</span>
          </Link>
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
        
        <FollowButton userId={author.id} />
      </div>
    </div>
  );
};

export default PostHeader;
