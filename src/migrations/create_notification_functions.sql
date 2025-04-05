
-- Function to get user notifications securely
CREATE OR REPLACE FUNCTION public.get_user_notifications(user_id_param UUID) 
RETURNS SETOF notifications AS $$
BEGIN
  RETURN QUERY 
  SELECT n.*
  FROM public.notifications n
  WHERE n.user_id = user_id_param
  ORDER BY created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark a single notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_id_param UUID, user_id_param UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = notification_id_param
  AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(user_id_param UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = user_id_param
  AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
