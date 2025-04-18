
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavigationItemProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const NavigationItem = ({ to, children, className, onClick, icon }: NavigationItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-800 hover:text-primary',
        className
      )}
      onClick={onClick}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
};

export default NavigationItem;
