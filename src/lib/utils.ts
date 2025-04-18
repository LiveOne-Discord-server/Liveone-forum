
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is invalid
    if (isNaN(d.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Add animation keyframes to be used in the CSS
export const voteAnimationKeyframes = {
  '@keyframes vote-bounce': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.3)' },
    '100%': { transform: 'scale(1)' }
  },
  '@keyframes vote-like-color': {
    '0%': { color: 'inherit' },
    '100%': { color: 'rgb(34, 197, 94)' } // green-500
  },
  '@keyframes vote-dislike-color': {
    '0%': { color: 'inherit' },
    '100%': { color: 'rgb(239, 68, 68)' } // red-500
  }
};

export function applyVoteAnimation(element: HTMLElement, type: 'like' | 'dislike' | 'up' | 'down') {
  // Convert "up" to "like" and "down" to "dislike" if needed
  const animationType = type === 'up' ? 'like' : type === 'down' ? 'dislike' : type;
  
  // Remove any existing animation classes
  element.classList.remove('animate-vote-bounce', 'animate-vote-like', 'animate-vote-dislike');
  
  // Add the appropriate animation classes
  element.classList.add('animate-vote-bounce');
  
  if (animationType === 'like') {
    element.classList.add('animate-vote-like');
  } else {
    element.classList.add('animate-vote-dislike');
  }
  
  // Remove the animation classes after it completes
  setTimeout(() => {
    element.classList.remove('animate-vote-bounce', 'animate-vote-like', 'animate-vote-dislike');
  }, 500);
}
