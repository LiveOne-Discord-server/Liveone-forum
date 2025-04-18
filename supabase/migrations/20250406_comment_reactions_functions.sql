
-- Function to get comment reactions
CREATE OR REPLACE FUNCTION public.get_comment_reactions(comment_id_param UUID)
RETURNS TABLE(emoji TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT cr.emoji 
  FROM public.comment_reactions cr
  WHERE cr.comment_id = comment_id_param;
END;
$$;

-- Function to get user reactions for a specific comment
CREATE OR REPLACE FUNCTION public.get_user_reactions_for_comment(
  comment_id_param UUID,
  user_id_param UUID
)
RETURNS TABLE(emoji TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT cr.emoji 
  FROM public.comment_reactions cr
  WHERE cr.comment_id = comment_id_param
  AND cr.user_id = user_id_param;
END;
$$;

-- Function to add a comment reaction
CREATE OR REPLACE FUNCTION public.add_comment_reaction(
  comment_id_param UUID,
  user_id_param UUID,
  emoji_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if reaction already exists
  IF EXISTS (
    SELECT 1 FROM public.comment_reactions
    WHERE comment_id = comment_id_param
    AND user_id = user_id_param
    AND emoji = emoji_param
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Insert the reaction
  INSERT INTO public.comment_reactions (comment_id, user_id, emoji)
  VALUES (comment_id_param, user_id_param, emoji_param);
  
  RETURN TRUE;
END;
$$;

-- Function to remove a comment reaction
CREATE OR REPLACE FUNCTION public.remove_comment_reaction(
  comment_id_param UUID,
  user_id_param UUID,
  emoji_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.comment_reactions
  WHERE comment_id = comment_id_param
  AND user_id = user_id_param
  AND emoji = emoji_param;
  
  RETURN FOUND;
END;
$$;
