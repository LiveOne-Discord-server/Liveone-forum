import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, X, Send, Loader2, Play, Square } from 'lucide-react';
import { formatDuration } from '@/utils/messaging';
import { uploadMessageMedia } from '@/utils/messageStorage';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { convertToWav } from '@/utils/audioUtils';

interface VoiceMessageRecorderProps {
  onSend: (audioUrl: string, mediaType: string, fileName?: string) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds
  className?: string; // Add className prop
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onSend,
  onCancel,
  maxDuration = 60, // Default 60 seconds
  className = '', // Default empty string
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  const { t } = useLanguage();

  useEffect(() => {
    audioElementRef.current = new Audio();
    audioElementRef.current.onended = () => setIsPlaying(false);
    audioElementRef.current.onpause = () => setIsPlaying(false);
    audioElementRef.current.onerror = (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      toast.error(t.messages?.playbackError || "Error playing audio");
    };
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }
    };
  }, [t.messages?.playbackError]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      stopRecording();
      clearMediaResources();
      
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const clearMediaResources = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      let options = {};
      try {
        options = { mimeType: 'audio/webm' };
        new MediaRecorder(stream, options);
      } catch (e) {
        try {
          options = { mimeType: 'audio/mp4' };
          new MediaRecorder(stream, options);
        } catch (e2) {
          options = {};
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setAudioBlob(audioBlob);
          
          console.log("Recording stopped, blob created:", audioBlob.size, "bytes", audioBlob.type);
        } else {
          console.error('No audio data collected');
          toast.error(t.messages?.recordingError || "No audio data collected");
        }
      };

      mediaRecorderRef.current.start(200);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(t.messages?.microphoneError || "Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        console.log('Recording stopped');
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.src = audioUrl;
        audioElementRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          toast.error(t.messages?.playbackError || "Could not play audio");
        });
        setIsPlaying(true);
      }
    }
  };

  const handleCancel = () => {
    stopRecording();
    clearMediaResources();
    
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    
    if (onCancel) onCancel();
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      toast.error(t.messages?.noAudio || "No audio recorded");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    console.log("Starting upload process...");
    
    try {
      const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `voice-${uuidv4()}.${extension}`;
      const file = new File([audioBlob], fileName, { 
        type: audioBlob.type
      });
      
      console.log("Created file for upload:", file.name, file.type, file.size, "bytes");
      
      const audioUrl = await uploadMessageMedia(file, 'voice', (progress) => {
        setUploadProgress(progress);
        console.log(`Upload progress: ${progress}%`);
      });
      
      console.log("Audio uploaded successfully:", audioUrl);
      
      clearMediaResources();
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      
      onSend(audioUrl, 'voice', fileName);
      toast.success(t.messages?.voiceSent || "Voice message sent");
      
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast.error(t.messages?.sendError || "Failed to upload voice message. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRecordingComplete = async (blob: Blob) => {
    try {
      const wavBlob = await convertToWav(blob);
      setAudioBlob(wavBlob);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error converting audio:', error);
      toast.error('Error processing audio');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!isRecording && !audioBlob && (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={startRecording}
          className="rounded-full text-muted-foreground hover:text-primary h-9 w-9"
          aria-label={t.messages?.startRecording || "Record voice message"}
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
      
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full animate-pulse">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span className="text-xs font-medium">{formatDuration(recordingTime)}</span>
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={stopRecording}
            className="rounded-full h-8 w-8"
            aria-label={t.messages?.stopRecording || "Stop recording"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {audioBlob && !isRecording && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground rounded-full">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={togglePlayback}
              className="rounded-full h-6 w-6 p-0"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Square className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <span className="text-xs font-medium">{formatDuration(recordingTime)}</span>
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleCancel}
            className="rounded-full h-8 w-8"
            aria-label="Cancel voice message"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={uploadAudio}
            disabled={isUploading}
            className="rounded-full h-8 w-8 bg-primary"
            aria-label="Send voice message"
          >
            {isUploading ? (
              <div className="relative">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="absolute -bottom-5 -right-5 text-[10px] font-medium">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
