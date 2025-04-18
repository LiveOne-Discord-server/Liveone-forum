
import { Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

interface RoleBadgeProps {
  role: User['role'];
  showIcon?: boolean;
  className?: string;
}

const RoleBadge = ({ role, showIcon = true, className }: RoleBadgeProps) => {
  if (role === 'admin') {
    return (
      <Badge 
        className={cn(
          "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg shadow-orange-500/20", 
          className
        )}
      >
        {showIcon && <Crown className="h-3 w-3 mr-1" />}
        Admin
      </Badge>
    );
  } else if (role === 'moderator') {
    return (
      <Badge 
        className={cn(
          "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20",
          className
        )}
      >
        {showIcon && <Shield className="h-3 w-3 mr-1" />}
        Mod
      </Badge>
    );
  }
  
  return null;
};

export default RoleBadge;
