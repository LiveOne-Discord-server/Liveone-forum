import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Award, MessageSquare, ThumbsUp, Users, Heart, Star, Frown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { useAuth } from '@/hooks/useAuth';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
  howToGet?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'special';
}

interface UserAchievementsProps {
  userId: string;
  variant?: 'default' | 'compact';
}

const UserAchievements: React.FC<UserAchievementsProps> = ({ 
  userId,
  variant = 'default'
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        if (data?.email) {
          setUserEmail(data.email);
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };
    
    fetchUserEmail();
  }, [userId]);
  
  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      
      try {
        // Get posts count
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userId);
          
        if (postsError) throw postsError;
        
        // Get highest post upvotes
        const { data: postVotes, error: votesError } = await supabase
          .from('posts')
          .select('upvotes')
          .eq('author_id', userId)
          .order('upvotes', { ascending: false })
          .limit(1);
          
        if (votesError) throw votesError;
        
        // Get follower count
        const { count: followerCount, error: followerError } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
          
        if (followerError) throw followerError;
        
        // Get following count
        const { count: followingCount, error: followingError } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
          
        if (followingError) throw followingError;
        
        // Get post with 5+ likes
        const { count: postsWithFiveLikes, error: fiveLikesError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userId)
          .gte('upvotes', 5);
        
        if (fiveLikesError) throw fiveLikesError;
        
        // Get total post reactions
        const { data: userPosts, error: userPostsError } = await supabase
          .from('posts')
          .select('id')
          .eq('author_id', userId);
        
        if (userPostsError) throw userPostsError;
        
        // Check if user has any reactions on their posts
        let hasReactions = false;
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map(post => post.id);
          const { count: reactionsCount, error: reactionsError } = await supabase
            .from('post_reactions')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds);
            
          if (reactionsError) throw reactionsError;
          
          hasReactions = (reactionsCount || 0) > 0;
        }
        
        // Calculate achievements
        const userAchievements: Achievement[] = [];
        
        if ((postsCount || 0) >= 10) {
          userAchievements.push({
            id: 'prolific-poster',
            name: 'Prolific Poster',
            description: 'Created 10 or more posts',
            icon: <MessageSquare className="h-4 w-4" />,
            color: '#3b82f6',
            howToGet: 'Create at least 10 posts on the platform',
            rarity: 'common'
          });
        }
        
        if (postVotes?.[0]?.upvotes >= 20) {
          userAchievements.push({
            id: 'popular-content',
            name: 'Popular Content',
            description: 'Has a post with 20 or more upvotes',
            icon: <ThumbsUp className="h-4 w-4" />,
            color: '#10b981',
            howToGet: 'Get 20 or more upvotes on a single post',
            rarity: 'uncommon'
          });
        }
        
        if ((followerCount || 0) >= 10) {
          userAchievements.push({
            id: 'community-favorite',
            name: 'Community Favorite',
            description: 'Has 10 or more followers',
            icon: <Users className="h-4 w-4" />,
            color: '#8b5cf6',
            howToGet: 'Have at least 10 users follow your profile',
            rarity: 'uncommon'
          });
        }
        
        if ((followingCount || 0) >= 30) {
          userAchievements.push({
            id: 'network-builder',
            name: 'Network Builder',
            description: 'Follows 30 or more people',
            icon: <Award className="h-4 w-4" />,
            color: '#f59e0b',
            howToGet: 'Follow at least 30 other users',
            rarity: 'common'
          });
        }
        
        // New achievements
        if (hasReactions) {
          userAchievements.push({
            id: 'first-reaction',
            name: 'First Reaction',
            description: 'Received a reaction on one of your posts',
            icon: <Heart className="h-4 w-4" />,
            color: '#ec4899',
            howToGet: 'Get at least one reaction on any of your posts',
            rarity: 'common'
          });
        }
        
        if ((postsWithFiveLikes || 0) > 0) {
          userAchievements.push({
            id: 'five-likes',
            name: 'High Five',
            description: 'Has a post with 5 or more likes',
            icon: <ThumbsUp className="h-4 w-4" />,
            color: '#06b6d4',
            howToGet: 'Get 5 or more likes on a single post',
            rarity: 'common'
          });
        }
        
        if ((followerCount || 0) >= 100) {
          userAchievements.push({
            id: 'hundred-followers',
            name: 'Centurion',
            description: 'Has 100 or more followers',
            icon: <Star className="h-4 w-4" />,
            color: '#eab308',
            howToGet: 'Have at least 100 users follow your profile',
            rarity: 'rare'
          });
        }
        
        // Special achievement for specific user
        if (userEmail === 'marmur2020@gmail.com') {
          userAchievements.push({
            id: 'special-achievement',
            name: 'Не долбоёб вроде)',
            description: 'Couldn\'t think of an achievement idea',
            icon: <Frown className="h-4 w-4" />,
            color: '#ef4444',
            howToGet: 'Only available to a special account',
            rarity: 'special'
          });
        }
        
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchAchievements();
    }
  }, [userId, userEmail]);
  
  if (loading) {
    return <div className="h-6 w-full animate-pulse bg-gray-700 rounded"></div>;
  }
  
  if (achievements.length === 0) {
    return variant === 'compact' ? null : (
      <div className="text-sm text-muted-foreground">
        No achievements unlocked yet
      </div>
    );
  }
  
  const getRarityClass = (rarity?: string) => {
    switch(rarity) {
      case 'common': return 'opacity-80';
      case 'uncommon': return 'font-medium';
      case 'rare': return 'font-semibold text-blue-400';
      case 'epic': return 'font-semibold text-purple-400';
      case 'legendary': return 'font-semibold text-yellow-400';
      case 'special': return 'font-bold text-red-400';
      default: return '';
    }
  };
  
  return (
    <div className={variant === 'compact' ? '' : 'space-y-3'}>
      {variant === 'default' && (
        <h3 className="text-sm font-medium">Achievements</h3>
      )}
      
      <div className="flex flex-wrap gap-2">
        {achievements.map((achievement) => (
          <HoverCard key={achievement.id}>
            <HoverCardTrigger asChild>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="flex items-center gap-1 px-2 py-1 border hover:border-opacity-80 transition-colors cursor-help"
                        style={{ 
                          borderColor: achievement.color || '#3b82f6',
                          backgroundColor: `${achievement.color || '#3b82f6'}10` 
                        }}
                      >
                        {achievement.icon}
                        {variant === 'default' && (
                          <span>{achievement.name}</span>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="text-sm">
                        <p className="font-semibold">{achievement.name}</p>
                        <p className="text-xs opacity-90">{achievement.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-2 rounded-full" 
                    style={{ backgroundColor: `${achievement.color || '#3b82f6'}30` }}
                  >
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{achievement.name}</h4>
                    <p className={`text-xs ${getRarityClass(achievement.rarity)}`}>
                      {achievement.rarity ? achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1) : 'Common'}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm">{achievement.description}</p>
                
                {achievement.howToGet && (
                  <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                    <strong>How to get:</strong> {achievement.howToGet}
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    </div>
  );
};

export default UserAchievements;
