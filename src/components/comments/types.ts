
export interface Author {
  username: string;
  avatar_url: string;
  role?: 'admin' | 'moderator' | 'user';
  id: string; // Required field
  provider?: 'github' | 'discord' | 'email';
  avatar?: string; // For compatibility with User type
  status?: 'online' | 'offline' | 'dnd' | 'idle'; // Added status field for compatibility
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  author: Author;
}
