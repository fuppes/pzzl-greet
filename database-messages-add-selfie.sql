-- Add selfie_url column to player_messages table
-- This will store the URL to the selfie image uploaded to Supabase Storage

ALTER TABLE player_messages
ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- Create a storage bucket for selfies (run this in Supabase Dashboard > Storage)
-- Bucket name: player-selfies
-- Public bucket: true (so images can be displayed)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policies (run these after creating the bucket):
-- 1. Allow authenticated users to upload:
--    CREATE POLICY "Authenticated users can upload selfies"
--    ON storage.objects FOR INSERT
--    TO authenticated
--    WITH CHECK (bucket_id = 'player-selfies');

-- 2. Allow public read access:
--    CREATE POLICY "Public can view selfies"
--    ON storage.objects FOR SELECT
--    TO public
--    USING (bucket_id = 'player-selfies');
