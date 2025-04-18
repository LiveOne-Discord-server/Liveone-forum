
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { banUser, unbanUser, isUserBanned, getUserBanInfo } from '@/utils/admin';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Ban, Check } from 'lucide-react';

interface UserBanButtonProps {
  userId: string;
  username: string;
  onBanStatusChange?: (isBanned: boolean) => void;
}

const UserBanButton = ({ userId, username, onBanStatusChange }: UserBanButtonProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBanned, setIsBanned] = useState<boolean | null>(null);
  const [banInfo, setBanInfo] = useState<any>(null);

  // Check if user is banned
  const checkBanStatus = async () => {
    const banned = await isUserBanned(userId);
    setIsBanned(banned);
    
    if (banned) {
      const info = await getUserBanInfo(userId);
      setBanInfo(info);
    }
    
    return banned;
  };

  const handleBanClick = async () => {
    setIsLoading(true);
    const banned = await checkBanStatus();
    setIsLoading(false);
    
    if (banned) {
      setIsDialogOpen(false);
      toast.info(`User ${username} is already banned`);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleUnbanClick = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to perform this action');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await unbanUser(user.id, userId);
      
      if (result.success) {
        toast.success(result.message);
        setIsBanned(false);
        setBanInfo(null);
        if (onBanStatusChange) {
          onBanStatusChange(false);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to perform this action');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for the ban');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await banUser(user.id, userId, reason);
      
      if (result.success) {
        toast.success(result.message);
        setIsDialogOpen(false);
        setIsBanned(true);
        if (onBanStatusChange) {
          onBanStatusChange(true);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    } finally {
      setIsLoading(false);
    }
  };

  // Load ban status on mount
  useState(() => {
    checkBanStatus();
  });

  return (
    <>
      {isBanned ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleUnbanClick}
          disabled={isLoading}
          className="gap-1"
        >
          <Check className="h-4 w-4 mr-1" />
          {isLoading ? 'Processing...' : 'Unban User'}
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBanClick}
          disabled={isLoading}
          className="gap-1"
        >
          <Ban className="h-4 w-4 mr-1" />
          {isLoading ? 'Processing...' : 'Ban User'}
        </Button>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User: {username}</DialogTitle>
            <DialogDescription>
              This action will prevent the user from logging in and participating in the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Ban</Label>
              <Textarea
                id="reason"
                placeholder="Provide a detailed reason for this ban"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBanSubmit}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? 'Processing...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserBanButton;
