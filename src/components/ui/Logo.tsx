
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const Logo = ({ size = 'md', animated = false, className }: LogoProps) => {
  const [isVisible, setIsVisible] = useState(!animated);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-5xl md:text-6xl',
  };

  return (
    <div className={cn("font-bold tracking-tight transition-all duration-1000", 
      sizeClasses[size],
      isVisible ? 'opacity-100' : 'opacity-0',
      animated && isVisible && 'animate-glow',
      className
    )}>
      <span className="text-white">Live</span>
      <span className="text-white">One</span>
    </div>
  );
};

export default Logo;
