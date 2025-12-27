-- Add 'chat_typing' to game_type constraint
-- This allows creating Chat Typing Race games in the database

-- Drop the old constraint
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_game_type_check;

-- Add new constraint with chat_typing included
ALTER TABLE games ADD CONSTRAINT games_game_type_check
  CHECK (game_type IN ('quiz', 'memory', 'word', 'chat_typing'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'games'::regclass
AND conname = 'games_game_type_check';
