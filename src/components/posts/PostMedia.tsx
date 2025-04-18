
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Expand } from "lucide-react";

interface PostMediaProps {
  urls: string[];
  className?: string;
}

const PostMedia: React.FC<PostMediaProps> = ({ urls = [], className = '' }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!urls.length) return null;

  const handleMediaClick = (index: number) => {
    setSelectedIndex(index);
    setIsDialogOpen(true);
  };

  // Determine if it's an image or video based on file extension
  const isVideo = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'mp4' || extension === 'webm' || extension === 'ogg' || url.includes('video');
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {urls.map((url, index) => (
          <div key={index} className="relative group overflow-hidden rounded-lg">
            {isVideo(url) ? (
              <video
                src={url}
                className="w-full h-48 object-cover rounded-lg cursor-pointer"
                onClick={() => handleMediaClick(index)}
                controls
              />
            ) : (
              <div className="relative">
                <img
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer"
                  onClick={() => handleMediaClick(index)}
                  loading="lazy"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleMediaClick(index)}
                >
                  <Expand size={16} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl bg-black/90 border-gray-800">
          <div className="flex items-center justify-center w-full h-full">
            {isVideo(urls[selectedIndex]) ? (
              <video
                src={urls[selectedIndex]}
                className="max-h-[80vh] max-w-full object-contain"
                controls
                autoPlay
              />
            ) : (
              <img
                src={urls[selectedIndex]}
                alt={`Post media ${selectedIndex + 1}`}
                className="max-h-[80vh] max-w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostMedia;
