
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  FileText, 
  Image as ImageIcon, 
  FileVideo, 
  FileAudio, 
  Download,
  File,
  Play,
  ExternalLink
} from 'lucide-react';
import { getFileSize } from '@/utils/messageStorage';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MediaMessageProps {
  url: string;
  mediaType: string;
  fileName?: string;
  timestamp: string;
  isOutgoing?: boolean;
  content?: string;
  sender?: {
    avatar?: string;
    name: string;
  };
  className?: string;
}

const MediaMessage = ({ 
  url, 
  mediaType, 
  fileName = '', 
  timestamp, 
  isOutgoing = false,
  content,
  sender,
  className
}: MediaMessageProps) => {
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);
  const [showFullImage, setShowFullImage] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const getFileIcon = () => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <FileVideo className="h-4 w-4" />;
      case 'audio':
        return <FileAudio className="h-4 w-4" />;
      case 'voice':
        return <FileAudio className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const fileNameToDisplay = fileName || url.split('/').pop() || 'File';

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const renderPreview = () => {
    if (mediaType === 'image') {
      return (
        <div className="relative">
          <div 
            className="rounded-lg overflow-hidden bg-black/5 mb-2 cursor-pointer"
            onClick={() => setShowFullImage(true)}
          >
            <img 
              src={url} 
              alt={fileName || 'Image'} 
              className="max-h-[220px] w-auto object-contain mx-auto"
              loading="lazy"
            />
          </div>
          
          {showFullImage && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setShowFullImage(false)}
            >
              <div className="relative max-w-4xl max-h-[90vh]">
                <img 
                  src={url} 
                  alt={fileName || 'Image'} 
                  className="max-w-full max-h-[90vh] object-contain"
                />
                <Button 
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullImage(false);
                  }}
                >
                  Close
                </Button>
                <Button 
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70"
                  size="sm"
                  asChild
                >
                  <a href={url} download={fileNameToDisplay} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    } else if (mediaType === 'video') {
      return (
        <div className="rounded-lg overflow-hidden bg-black/5 mb-2 relative">
          <video 
            ref={videoRef}
            src={url} 
            className="max-h-[220px] w-full object-contain"
            poster="/video-poster.png"
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onEnded={() => setIsVideoPlaying(false)}
            controls
          />
          {!isVideoPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
              onClick={toggleVideoPlay}
            >
              <div className="bg-black/60 rounded-full p-3">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          )}
        </div>
      );
    } else if (mediaType === 'voice' || mediaType === 'audio') {
      // Voice messages are handled by AudioMessage component
      return null;
    } else {
      // Generic file
      return (
        <div className="flex items-center p-3 bg-background/80 rounded-md border mb-2">
          <div className="mr-3 bg-muted p-2 rounded-md">
            <File className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileNameToDisplay}</p>
            <p className="text-xs text-muted-foreground">{getFileSize(url.length * 10)}</p>
          </div>
          <div className="flex space-x-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              asChild
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              asChild
            >
              <a href={url} download={fileNameToDisplay} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      );
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
            "rounded-xl p-3", 
            isOutgoing 
              ? "bg-primary/10 text-primary-foreground border border-primary/10" 
              : "bg-muted border border-muted/50"
          )}
        >
          {renderPreview()}
          {content && content !== 'Image' && content !== 'Video' && content !== 'File' && content !== 'Voice message' && (
            <p className="text-sm">{content}</p>
          )}
        </div>
      </div>
      <span className={`text-xs text-muted-foreground ${isOutgoing ? 'text-right mr-2' : 'ml-10'}`}>
        {formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ru })}
      </span>
    </div>
  );
};

export default MediaMessage;
