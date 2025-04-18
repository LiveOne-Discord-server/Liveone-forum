
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal } from 'lucide-react';
import { Author } from '@/components/comments/types';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import PostActions from '@/components/posts/PostActions';
import { Post } from '@/types';
import RoleBadge from '@/components/users/RoleBadge';

interface PostHeaderProps {
  postId: string;
  title: string;
  author: Author;
  createdAt: string;
  lastEditedAt?: string;
}

export const PostHeader = ({ postId, title, author, createdAt, lastEditedAt }: PostHeaderProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const isSmallScreen = window.innerWidth < 640;

  // Create a Post object to pass to PostActions
  const postForActions: Post = {
    id: postId,
    title,
    content: '',
    authorId: author.id,
    author: {
      id: author.id,
      username: author.username,
      avatar: author.avatar_url,
      provider: 'github',
      // Ensure role is one of the allowed values
      role: (author.role === 'admin' || author.role === 'moderator') ? author.role : 'user',
      status: 'online' // Default value since Author doesn't have status
    },
    createdAt,
    tags: [],
    upvotes: 0,
    downvotes: 0
  };

  return (
    <div className="space-y-1.5">
      <h3 className="font-semibold text-xl sm:text-2xl hover:underline">
        <Link to={`/post/${postId}`}>{title}</Link>
      </h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Avatar className={`h-6 w-6 border ${author.role === 'admin' ? 'border-yellow-500' : author.role === 'moderator' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-700'}`}>
            <AvatarImage src={author.avatar_url} alt={author.username} />
            <AvatarFallback>{author.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex gap-1 items-center">
            <Link to={`/user/${author.id}`} className="text-sm font-medium hover:underline">
              {author.username}
            </Link>
            
            {author.role && (author.role === 'admin' || author.role === 'moderator') && (
              <RoleBadge role={author.role} className="px-1 py-0 h-auto text-[10px]" />
            )}
            
            {isSmallScreen && (
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted-light dark:hover:bg-muted-dark">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <PostActions post={postForActions} />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <span className="text-xs text-muted-foreground">
            • {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          
          {lastEditedAt && (
            <span className="text-xs text-muted-foreground italic">
              • edited {formatDistanceToNow(new Date(lastEditedAt), { addSuffix: true })}
            </span>
          )}
        </div>
        
        {!isSmallScreen && <PostActions post={postForActions} />}
      </div>
    </div>
  );
};

export default PostHeader;
