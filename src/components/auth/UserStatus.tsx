import React from 'react';
import { User } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface UserStatusProps {
  status?: User['status'];
  className?: string;
  showLabel?: boolean;
}

const UserStatus: React.FC<UserStatusProps> = ({ 
  status = 'offline', 
  className = '',
  showLabel = false
}) => {
  const { t } = useLanguage();

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'dnd':
        return 'bg-red-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return t.profile.statusOnline;
      case 'dnd':
        return t.profile.statusDnd;
      case 'idle':
        return t.profile.statusIdle;
      case 'offline':
      default:
        return t.profile.statusOffline;
    }
  };

  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn('w-3 h-3 rounded-full', getStatusColor())} />
      {showLabel && (
        <span className="ml-2 text-sm text-gray-400">{getStatusLabel()}</span>
      )}
    </div>
  );
};

export default UserStatus;