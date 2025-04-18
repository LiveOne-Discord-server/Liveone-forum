
import React, { useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Messages } from '@/pages/Messages';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/utils/supabase';

export function ChatWindow() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const isOpen = Boolean(userId);
  
  // Verify user exists before opening chat
  useEffect(() => {
    if (userId) {
      const checkUserExists = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();
            
          if (error) {
            console.error('Error checking user profile:', error);
            navigate('/');
          }
          
          if (!data) {
            console.error(`User ${userId} does not exist`);
            navigate('/');
          }
        } catch (e) {
          console.error('Error in user check:', e);
          navigate('/');
        }
      };
      
      checkUserExists();
    }
  }, [userId, navigate]);

  const handleSheetClose = () => {
    // Get the previous page from history or default to home
    const previousPath = window.history.state?.previousPath || '/';
    navigate(previousPath, { replace: true });
  };

  // Store current path before opening the chat
  useEffect(() => {
    if (userId) {
      window.history.replaceState(
        { ...window.history.state, previousPath: window.location.pathname.replace(`/messages/${userId}`, '') },
        ''
      );
    }
  }, [userId]);

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetClose} modal={true}>
      <SheetContent side="right" className="w-full sm:w-[540px] p-0 bg-background">
        <SheetHeader className="px-4 py-2 border-b">
          <SheetTitle>Messages</SheetTitle>
        </SheetHeader>
        {userId && <Messages />}
      </SheetContent>
    </Sheet>
  );
}
