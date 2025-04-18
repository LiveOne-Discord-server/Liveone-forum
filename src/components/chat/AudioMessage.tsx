
import React from 'react';
import { Player } from '@/components/ui/audio-player';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Waveform } from './Waveform';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AudioMessageProps {
  url: string;
  timestamp: string;
  isOutgoing?: boolean;
  sender?: {
    avatar?: string;
    name: string;
  };
  className?: string;
}

const AudioMessage = ({ 
  url, 
  timestamp, 
  isOutgoing = false, 
  sender,
  className 
}: AudioMessageProps) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const formatTimestamp = (timestamp: string) => {
    try {
      // Validate the timestamp format first
      if (!timestamp || typeof timestamp !== 'string') {
        return 'Unknown time';
      }
      
      const date = parseISO(timestamp);
      if (!isValid(date)) {
        return 'Unknown time';
      }
      
      // Use a try/catch to handle any potential errors in date formatting
      try {
        return formatDistanceToNow(date, { addSuffix: true, locale: ru });
      } catch (error) {
        console.error('Error in formatDistanceToNow:', error);
        return 'Unknown time';
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown time';
    }
  };

  return (
    <div className={cn(`flex flex-col gap-1 max-w-[380px] ${isOutgoing ? 'ml-auto' : ''}`, className)}>
      <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
        {!isOutgoing && sender && (
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={sender.avatar} />
            <AvatarFallback>{sender.name[0]}</AvatarFallback>
          </Avatar>
        )}
        <div 
          className={cn(
            "rounded-xl p-3 shadow-sm", 
            isOutgoing 
              ? "bg-primary/10 text-primary-foreground border border-primary/10" 
              : "bg-muted border border-muted/50"
          )}
        >
          <div className="mb-2 px-1">
            <Waveform active={isPlaying} variant={isOutgoing ? 'primary' : 'secondary'} />
          </div>
          <Player
            src={url}
            className="rounded-lg"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      </div>
      <span className={`text-xs text-muted-foreground ${isOutgoing ? 'text-right mr-2' : 'ml-10'}`}>
        {formatTimestamp(timestamp)}
      </span>
    </div>
  );
};

export default AudioMessage;
