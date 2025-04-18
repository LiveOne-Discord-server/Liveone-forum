
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Author } from "@/components/comments/types";
import PostActions from './PostActions';
import FollowButton from '@/components/users/FollowButton';
import { Post, User } from '@/types';
import RoleBadge from '@/components/users/RoleBadge';

interface PostHeaderProps {
  postId: string;
  title: string;
  author: Author;
  createdAt: string;
  lastEditedAt?: string;
  isCompact?: boolean;
}

const PostHeader: React.FC<PostHeaderProps> = ({
  postId,
  title,
  author,
  createdAt,
  lastEditedAt,
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
      role: (author.role === 'admin' || author.role === 'moderator' || author.role === 'user') 
        ? author.role 
        : 'user',
      status: author.status || 'online'
    },
    createdAt: createdAt,
    lastEdited: lastEditedAt,
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
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Link to={`/post/${postId}`} className="hover:underline">
          <h1 className="text-2xl font-bold">{title}</h1>
        </Link>
        {/* Removed PostActions dropdown */}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to={`/user/${author.id}`} className="flex items-center gap-2 hover:opacity-80">
            <Avatar className={`h-6 w-6 ${
              author.role === 'admin' ? 'border-2 border-yellow-500' : 
              author.role === 'moderator' ? 'border-2 border-purple-500' : 
              ''
            }`}>
              <AvatarImage src={author.avatar_url} alt={author.username} />
              <AvatarFallback>{author.username[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{author.username}</span>
            {author.role && (author.role === 'admin' || author.role === 'moderator') && (
              <RoleBadge role={author.role} className="h-5 text-[10px]" />
            )}
          </Link>
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
        
        <FollowButton targetUserId={author.id} />
      </div>
    </div>
  );
};

export default PostHeader;
