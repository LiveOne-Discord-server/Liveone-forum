
import { FC } from 'react';

interface YouTubeEmbedProps {
  youtubeUrl: string;
  className?: string;
}

const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ youtubeUrl, className = '' }) => {
  // Function to extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string): string | null => {
    // Supported URL formats:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://youtube.com/shorts/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID

    let videoId: string | null = null;

    // Check for standard URL
    const standardMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?\s]+)/);
    if (standardMatch && standardMatch[1]) {
      videoId = standardMatch[1];
    }

    return videoId;
  };

  const videoId = getYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return (
      <div className={`bg-gray-800 rounded-md p-4 text-center ${className}`}>
        Invalid YouTube video URL
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-md my-3 ${className}`} style={{ paddingTop: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
