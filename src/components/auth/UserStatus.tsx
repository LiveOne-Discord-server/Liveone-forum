
import React, { useState } from 'react';
import { User } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface UserStatusProps {
  status?: User['status'];
  className?: string;
  showLabel?: boolean;
  showSelector?: boolean;
  role?: User['role'];
}

const UserStatus: React.FC<UserStatusProps> = ({ 
  status = 'offline', 
  className = '',
  showLabel = false,
  showSelector = false,
  role = 'user'
}) => {
  const { t } = useLanguage();
  const { appUser, updateUserProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

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
        return t.profile?.statusOnline || 'Online';
      case 'dnd':
        return t.profile?.statusDnd || 'Do Not Disturb';
      case 'idle':
        return t.profile?.statusIdle || 'Idle';
      case 'offline':
      default:
        return t.profile?.statusOffline || 'Offline';
    }
  };

  const getRoleBadge = () => {
    if (role === 'admin') {
      return (
        <span className="ml-2 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded">
          {t.profile?.roleAdmin || 'Admin'}
        </span>
      );
    } else if (role === 'moderator') {
      return (
        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded">
          {t.profile?.roleModerator || 'Moderator'}
        </span>
      );
    }
    return null;
  };

  const handleStatusChange = async (newStatus: User['status']) => {
    if (!appUser || newStatus === status || isUpdating) return;
    
    setIsUpdating(true);
    console.log(`Attempting to change status from ${status} to ${newStatus}`);
    
    try {
      console.log('Updating user profile with new status:', newStatus);
      const success = await updateUserProfile({ status: newStatus });
      
      if (success) {
        console.log('Status updated successfully to:', newStatus);
      } else {
        console.error('Failed to update status');
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (showSelector && appUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={cn('flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded', className)}>
            <div className={cn('w-3 h-3 rounded-full', getStatusColor())} />
            <span className="text-sm flex items-center">
              {getStatusLabel()}
              {getRoleBadge()}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem 
            className="flex items-center gap-2" 
            onClick={() => handleStatusChange('online')}
          >
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{t.profile?.statusOnline || 'Online'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center gap-2" 
            onClick={() => handleStatusChange('idle')}
          >
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>{t.profile?.statusIdle || 'Idle'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center gap-2" 
            onClick={() => handleStatusChange('dnd')}
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>{t.profile?.statusDnd || 'Do Not Disturb'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center gap-2" 
            onClick={() => handleStatusChange('offline')}
          >
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span>{t.profile?.statusOffline || 'Offline'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn('w-3 h-3 rounded-full', getStatusColor())} />
      {showLabel && (
        <span className="ml-2 text-sm text-gray-400 flex items-center">
          {getStatusLabel()}
          {getRoleBadge()}
        </span>
      )}
    </div>
  );
};

export default UserStatus;
