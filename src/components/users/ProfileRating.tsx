
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Star, StarHalf } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface ProfileRatingProps {
  userId: string;
}

// Define types for our rating database interactions
interface ProfileRating {
  id: string;
  profile_id: string;
  rater_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface AverageRating {
  average_rating: number;
  total_ratings: number;
}

const ProfileRating: React.FC<ProfileRatingProps> = ({ userId }) => {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Fetch the user's current rating if they're logged in
        if (user?.id) {
          const { data: userRatingData, error: userRatingError } = await supabase
            .from('profile_ratings' as any)
            .select('rating')
            .eq('profile_id', userId)
            .eq('rater_id', user.id)
            .single();
            
          if (userRatingData && 'rating' in userRatingData) {
            setUserRating(userRatingData.rating as number);
          }
        }
        
        // Fetch the average rating and count
        const { data: avgData, error } = await supabase
          .rpc('get_average_profile_rating' as any, { profile_id: userId });
          
        if (error) {
          console.error('Error fetching average rating:', error);
          return;
        }
        
        if (avgData && Array.isArray(avgData) && avgData.length > 0) {
          setAverageRating(avgData[0]?.average_rating || null);
          setTotalRatings(avgData[0]?.total_ratings || 0);
        } else if (avgData && typeof avgData === 'object' && 'average_rating' in avgData) {
          // Handle case where it returns a single object instead of an array
          setAverageRating((avgData as unknown as AverageRating).average_rating);
          setTotalRatings((avgData as unknown as AverageRating).total_ratings);
        }
      } catch (error) {
        console.error('Error fetching ratings data:', error);
      }
    };
    
    fetchRatings();
  }, [userId, user?.id]);
  
  const handleRatingSubmit = async (rating: number) => {
    if (!user) {
      toast.error(t.auth?.pleaseSignIn || 'Please sign in to rate this profile');
      return;
    }
    
    if (user.id === userId) {
      toast.error(t.profile?.cannotRateSelf || 'You cannot rate your own profile');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if user has already rated this profile
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('profile_ratings' as any)
          .update({ rating })
          .eq('profile_id', userId)
          .eq('rater_id', user.id);
          
        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('profile_ratings' as any)
          .insert({
            profile_id: userId,
            rater_id: user.id,
            rating
          } as any);
          
        if (error) throw error;
      }
      
      setUserRating(rating);
      toast.success(t.profile?.ratingSubmitted || 'Rating submitted successfully');
      
      // Refetch the average rating
      const { data: avgData, error } = await supabase
        .rpc('get_average_profile_rating' as any, { profile_id: userId });
        
      if (!error && avgData) {
        if (Array.isArray(avgData) && avgData.length > 0) {
          setAverageRating(avgData[0]?.average_rating || null);
          setTotalRatings(avgData[0]?.total_ratings || 0);
        } else if (typeof avgData === 'object' && 'average_rating' in avgData) {
          setAverageRating((avgData as unknown as AverageRating).average_rating);
          setTotalRatings((avgData as unknown as AverageRating).total_ratings);
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(t.common?.errorOccurred || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStars = (
    rating: number | null, 
    interactive: boolean = false, 
    hoverable: boolean = false
  ) => {
    const stars = [];
    const displayRating = rating || 0;
    
    for (let i = 1; i <= 10; i++) {
      const filled = i <= displayRating;
      const halfFilled = !filled && i <= displayRating + 0.5;
      
      stars.push(
        <button
          key={i}
          disabled={!interactive || isSubmitting}
          className={cn(
            "focus:outline-none transition-all",
            interactive && "cursor-pointer hover:transform hover:scale-125",
            !interactive && "cursor-default"
          )}
          onClick={() => interactive && handleRatingSubmit(i)}
          onMouseEnter={() => hoverable && setHoverRating(i)}
          onMouseLeave={() => hoverable && setHoverRating(null)}
        >
          {filled || (hoverable && hoverRating !== null && i <= hoverRating) ? (
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ) : halfFilled ? (
            <StarHalf className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ) : (
            <Star className="w-5 h-5 text-gray-500" />
          )}
        </button>
      );
    }
    
    return stars;
  };
  
  return (
    <div className="space-y-4">
      {user && user.id !== userId && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {t.profile?.rateProfile || 'Rate this profile:'}
          </h3>
          <div className="flex items-center gap-1">
            {renderStars(hoverRating !== null ? hoverRating : userRating, true, true)}
          </div>
          {userRating && (
            <p className="text-xs text-muted-foreground">
              {t.profile?.yourRating || 'Your rating'}: {userRating}/10
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">
            {t.profile?.profileRating || 'Profile Rating:'}
          </h3>
          <span className="text-lg font-bold text-yellow-400">
            {averageRating ? averageRating.toFixed(1) : '–'}/10
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {renderStars(averageRating)}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {totalRatings > 0 
            ? `${t.profile?.basedOn || 'Based on'} ${totalRatings} ${totalRatings === 1 ? (t.profile?.rating || 'rating') : (t.profile?.ratings || 'ratings')}`
            : t.profile?.noRatingsYet || 'No ratings yet'}
        </p>
      </div>
    </div>
  );
};

export default ProfileRating;
