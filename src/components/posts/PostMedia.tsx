
import { FC, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import YouTubeEmbed from "./YouTubeEmbed";

interface PostMediaProps {
  url: string;
}

const PostMedia: FC<PostMediaProps> = ({ url }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  
  if (!url) return null;
  
  // Check if URL is a YouTube video
  const isYouTubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
  
  if (isYouTubeUrl) {
    return <YouTubeEmbed youtubeUrl={url} />;
  }
  
  // If URL doesn't start with http, assume it's a path in storage
  let mediaUrl = url;
  if (!url.startsWith('http')) {
    try {
      const { data } = supabase.storage.from('post-media').getPublicUrl(url);
      mediaUrl = data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL for media:', error);
      setIsImageError(true);
    }
  }
  
  // Images (with preview and loading indicator)
  if (url.match(/\.(jpeg|jpg|gif|png|webp|avif|bmp)$/i)) {
    return (
      <div className="relative rounded-md my-3 max-h-96 w-auto">
        {!isImageLoaded && !isImageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/20 rounded-md">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
          </div>
        )}
        {isImageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/20 rounded-md">
            <p className="text-red-500">Failed to load image</p>
          </div>
        )}
        <img 
          src={mediaUrl} 
          alt="Post media" 
          className={`rounded-md max-h-96 w-auto object-contain ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsImageLoaded(true)}
          onError={() => {
            setIsImageError(true);
            setIsImageLoaded(true);
          }}
        />
      </div>
    );
  } 
  // Video (with preview)
  else if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
    return (
      <div className="rounded-md my-3 overflow-hidden">
        <video 
          controls 
          preload="metadata"
          poster={url.replace(/\.(mp4|webm|ogg|mov|avi|mkv)$/i, '.jpg')}
          className="rounded-md max-h-96 w-full object-contain"
        >
          <source src={mediaUrl} type={`video/${url.split('.').pop()}`} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  } 
  // Audio (with enhanced interface)
  else if (url.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
    return (
      <div className="rounded-md my-3 p-4 bg-gray-800/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="flex-grow">
            <p className="text-sm text-gray-400 mb-1">Audio file</p>
            <audio 
              controls 
              className="w-full"
            >
              <source src={mediaUrl} type={`audio/${url.split('.').pop()}`} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      </div>
    );
  }
  // PDF and documents
  else if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
    const fileType = url.split('.').pop()?.toUpperCase() || 'Document';
    return (
      <div className="rounded-md my-3 p-4 bg-gray-800/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <p className="font-medium">{fileType} file</p>
            <a 
              href={mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              Open file
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // For unknown file types
  return (
    <div className="rounded-md my-3 p-4 bg-gray-800/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </div>
        <div>
          <p className="font-medium">File</p>
          <a 
            href={mediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm"
          >
            Download file
          </a>
        </div>
      </div>
    </div>
  );
};

export default PostMedia;
