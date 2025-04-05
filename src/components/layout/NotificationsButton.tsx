
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import NotificationsPanel, { useNotifications } from '@/components/notifications/NotificationsPanel';
import { useLanguage } from '@/hooks/useLanguage';

const NotificationsButton = () => {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title={t.notifications?.title || 'Notifications'}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center" 
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 h-[500px]" align="end">
        <NotificationsPanel />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsButton;
