-- Add avatar column to players table
-- This will store the emoji avatar selected by the player

ALTER TABLE players
ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '😀';

-- Set default avatar for existing players
UPDATE players
SET avatar = '😀'
WHERE avatar IS NULL;
