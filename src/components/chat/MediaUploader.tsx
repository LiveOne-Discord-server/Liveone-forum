
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2, X, Image, FileVideo, FileText } from 'lucide-react';
import { uploadMessageMedia, getFileSize } from '@/utils/messageStorage';
import { toast } from '@/hooks/use-toast';

interface MediaUploaderProps {
  onSend: (mediaUrl: string, mediaType: string, fileName: string) => void;
  maxSize?: number; // in MB
  className?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onSend,
  maxSize = 20, // Default 20MB
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log("File selected:", file.name, file.type, file.size);
    
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async () => {
    if (!selectedFile) {
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    console.log("Starting media upload process...");
    
    try {
      // Determine media type
      let mediaType: 'image' | 'video' | 'voice' | 'file' = 'file';
      
      if (selectedFile.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (selectedFile.type.startsWith('video/')) {
        mediaType = 'video';
      } else if (selectedFile.type.startsWith('audio/')) {
        mediaType = 'voice';
      }
      
      console.log(`Uploading file as ${mediaType} type`);
      
      // Upload the file
      const mediaUrl = await uploadMessageMedia(
        selectedFile,
        mediaType,
        (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      );
      
      console.log("Media upload complete:", mediaUrl);
      
      onSend(mediaUrl, mediaType, selectedFile.name);
      toast.success('Media file sent');
      
      // Reset state
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media file');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Paperclip className="h-4 w-4" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (selectedFile.type.startsWith('video/')) {
      return <FileVideo className="h-4 w-4" />;
    } else if (selectedFile.type.startsWith('audio/')) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!selectedFile && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full text-muted-foreground hover:text-primary h-9 w-9"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,application/*,text/*"
          />
        </Button>
      )}
      
      {selectedFile && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground rounded-full">
            {getFileIcon()}
            <span className="text-xs font-medium max-w-[100px] truncate">
              {selectedFile.name} ({getFileSize(selectedFile.size)})
            </span>
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleCancel}
            className="rounded-full h-8 w-8"
            aria-label="Cancel file upload"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={uploadMedia}
            disabled={isUploading}
            className="rounded-full h-8 w-8 bg-primary"
            aria-label="Send file"
          >
            {isUploading ? (
              <div className="relative">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="absolute -bottom-5 -right-5 text-[10px] font-medium">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            ) : (
              getFileIcon()
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
