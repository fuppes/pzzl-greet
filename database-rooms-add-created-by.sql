-- Add created_by column to rooms table to track who created each room

-- Add the column (nullable first, in case there are existing rooms)
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);

-- Optional: Set a default value for existing rooms
-- If you want to assign all existing rooms to your current admin user,
-- replace 'YOUR_USER_ID_HERE' with your actual Supabase auth user ID
-- UPDATE rooms SET created_by = 'YOUR_USER_ID_HERE' WHERE created_by IS NULL;
