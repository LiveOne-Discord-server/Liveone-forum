
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface WaveformProps {
  active?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({ 
  active = false,
  variant = 'primary',
  className
}) => {
  const [heights, setHeights] = useState<number[]>([]);
  const bars = 24; // Increased number of bars for a richer visualization
  
  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        const newHeights = Array.from({ length: bars }, () => 
          Math.floor(Math.random() * 24) + 3
        );
        setHeights(newHeights);
      }, 150);
      
      return () => clearInterval(interval);
    } else {
      // Create a static wave pattern when not active
      const staticHeights = Array.from({ length: bars }, (_, i) => {
        return 4 + Math.floor(Math.abs(Math.sin((i / bars) * Math.PI * 2)) * 18);
      });
      setHeights(staticHeights);
    }
  }, [active, bars]);
  
  return (
    <div className={cn("flex items-center justify-center h-8 gap-[2px]", className)}>
      {heights.map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-[2px] rounded-full transition-all duration-150",
            active ? "animate-pulse" : "",
            variant === 'primary' 
              ? 'bg-primary/80' 
              : 'bg-secondary-foreground/30'
          )}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};
