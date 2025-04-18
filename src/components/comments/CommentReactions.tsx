
import React from 'react';
import { Button } from '@/components/ui/button';

interface CommentReactionsProps {
  reactions: Record<string, number>;
  userReactions: string[];
  onReactionClick: (emoji: string) => void;
  isLoggedIn: boolean;
}

const CommentReactions = ({
  reactions,
  userReactions,
  onReactionClick,
  isLoggedIn
}: CommentReactionsProps) => {
  // Filter out reactions with zero count
  const activeReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([_, countA], [__, countB]) => countB - countA); // Sort by count (highest first)
  
  if (activeReactions.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {activeReactions.map(([emoji, count]) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className={`px-2 py-1 h-auto rounded-full text-xs border ${
            userReactions.includes(emoji) 
              ? 'border-orange-500 bg-orange-500/10' 
              : 'border-gray-800'
          }`}
          onClick={() => isLoggedIn && onReactionClick(emoji)}
          disabled={!isLoggedIn}
        >
          <span className="mr-1">{emoji}</span>
          <span>{count}</span>
        </Button>
      ))}
    </div>
  );
};

export default CommentReactions;
