import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  avatar?: string | null;
  avatar_url?: string; // Added this to fix type errors
  provider: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'online' | 'offline' | 'dnd' | 'idle';
  followers?: number;
  following?: number;
  banner_color?: string;
  banner_url?: string;
  email?: string;
  created_at?: string; // Adding this property to fix the TypeScript error
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: User;
  createdAt: string;
  lastEdited?: string;
  tags: Tag[];
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  mediaUrls?: string[];
  isPinned?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface PostSettings {
  postId: string;
  commentsEnabled: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: (SupabaseUser & { status?: User['status'] }) | null;
  appUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider: 'github' | 'discord' | 'email', options?: { email?: string; password?: string }) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<any>;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  onOpenAuthModal?: () => void;
}

export interface PostEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialTags?: Tag[];
  initialMediaUrls?: string[];
  onSave: (content: string, title: string, tags: Tag[], mediaFiles: File[], existingMedia?: string[]) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
