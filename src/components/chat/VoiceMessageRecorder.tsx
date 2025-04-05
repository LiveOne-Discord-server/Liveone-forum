
import { useState, useRef } from 'react';
import { Mic, Square, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/utils/supabase';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface VoiceMessageRecorderProps {
  recipientId: string;
  userId: string;
  onMessageSent: () => void;
}

const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({ recipientId, userId, onMessageSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { t } = useLanguage();
  const [isSending, setIsSending] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        
        // Limit recording to 2 minutes
        if (seconds >= 120) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(t.messages?.microphoneError || 'Could not access microphone');
    }
  };
  
  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };
  
  const sendVoiceMessage = async () => {
    if (!audioBlob) return;
    
    setIsSending(true);
    
    try {
      // Upload audio file to Supabase storage
      const filePath = `voice-messages/${userId}/${Date.now()}.webm`;
      const audioFile = new File([audioBlob], filePath, { type: 'audio/webm' });
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('messages')
        .upload(filePath, audioFile);
        
      if (uploadError) throw uploadError;
      
      // Get public URL for the file
      const { data: publicUrlData } = supabase
        .storage
        .from('messages')
        .getPublicUrl(filePath);
        
      if (!publicUrlData?.publicUrl) throw new Error('Failed to get public URL');
      
      // Save message in database
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          recipient_id: recipientId,
          content: `[Voice Message] - ${formatTime(recordingTime)}`,
          voice_url: publicUrlData.publicUrl,
          media_type: 'voice'
        });
        
      if (messageError) throw messageError;
      
      toast.success(t.messages?.voiceSent || 'Voice message sent');
      onMessageSent();
      cancelRecording();
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error(t.messages?.sendError || 'Failed to send voice message');
    } finally {
      setIsSending(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !audioBlob ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startRecording}
          title={t.messages?.startRecording || 'Start recording'}
        >
          <Mic className="h-4 w-4" />
        </Button>
      ) : isRecording ? (
        <div className="flex items-center gap-2">
          <div className="text-red-500 animate-pulse text-sm mr-2">
            ● {formatTime(recordingTime)}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={stopRecording}
            className="bg-red-500/20"
            title={t.messages?.stopRecording || 'Stop recording'}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="text-sm mr-2">
            {formatTime(recordingTime)}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={cancelRecording}
            title={t.common?.cancel || 'Cancel'}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={sendVoiceMessage}
            disabled={isSending}
            title={t.common?.send || 'Send'}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceMessageRecorder;
