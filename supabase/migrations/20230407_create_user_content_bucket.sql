
-- Create a bucket for user content like banners and profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-content',
  'user-content',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
) ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Add policies to allow users to upload their own content
CREATE POLICY IF NOT EXISTS "Anyone can view user content"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-content');

-- Make sure authenticated users can upload content (this is the critical policy)
CREATE POLICY IF NOT EXISTS "Authenticated users can upload user content"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-content');

-- Make sure users can update their content
CREATE POLICY IF NOT EXISTS "Users can update their own content"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'user-content' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Make sure users can delete their content
CREATE POLICY IF NOT EXISTS "Users can delete their own content"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-content' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create a helper function to create storage policies
-- This function is just a no-op in production to avoid errors
-- We don't call this function directly from TypeScript anymore
CREATE OR REPLACE FUNCTION public.create_storage_policy(
  bucket_name text,
  policy_name text,
  definition text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- The function is a no-op in production since we can't dynamically create policies
  -- But it prevents errors when the client calls it
  RAISE NOTICE 'Storage policy creation through RPC is not supported, but the bucket is already set up correctly.';
END;
$$;
