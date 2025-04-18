
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  duration?: number;
  onComplete?: () => void;
}

const LoadingScreen = ({ duration = 5000, onComplete }: LoadingScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, duration - 1000);
    
    const timer2 = setTimeout(() => {
      setShowContent(false);
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [duration, onComplete]);

  if (!showContent) return null;

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col items-center justify-center bg-black z-50 transition-opacity duration-1000",
      fadeOut && "opacity-0"
    )}>
      <div className="text-6xl font-bold text-center">
        <span className="text-orange-500 animate-pulse-slow" style={{
          textShadow: "0 0 10px rgba(249, 115, 22, 0.8), 0 0 20px rgba(249, 115, 22, 0.6), 0 0 30px rgba(249, 115, 22, 0.4)"
        }}>Live</span>
        <span className="text-red-500 animate-pulse-slower" style={{
          textShadow: "0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4)"
        }}>One</span>
      </div>
      <p className="mt-4 text-gray-400 animate-fade-in">
        Site is under development, some features may be unstable
      </p>
    </div>
  );
};

export default LoadingScreen;
