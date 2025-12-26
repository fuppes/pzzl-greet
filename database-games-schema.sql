-- Games Table: Reusable game objects
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL CHECK (game_type IN ('quiz', 'memory', 'word')),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Room Game Queue: Links rooms to games with order
CREATE TABLE IF NOT EXISTS room_game_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  queue_position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, queue_position),
  UNIQUE(room_id, game_id)
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_game_queue ENABLE ROW LEVEL SECURITY;

-- Policies for games table (public read, authenticated write)
CREATE POLICY "Enable read access for all users" ON games
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON games
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON games
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON games
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for room_game_queue table (public read, authenticated write)
CREATE POLICY "Enable read access for all users" ON room_game_queue
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON room_game_queue
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON room_game_queue
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON room_game_queue
  FOR DELETE USING (auth.role() = 'authenticated');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_room_game_queue_room_id ON room_game_queue(room_id);
CREATE INDEX IF NOT EXISTS idx_room_game_queue_position ON room_game_queue(room_id, queue_position);

-- Example game types and their config structure:
--
-- Quiz:
-- {
--   "questions": [
--     {
--       "question": "Frage?",
--       "answers": ["Antwort 1", "Antwort 2", "Antwort 3", "Antwort 4"],
--       "correctAnswer": 0,
--       "points": 10
--     }
--   ]
-- }
--
-- Memory:
-- {
--   "pairs": [
--     {"id": 1, "content": "🎄"},
--     {"id": 2, "content": "⭐"},
--     ...
--   ]
-- }
--
-- Word:
-- {
--   "words": [
--     {"scrambled": "LSEIRVEST", "answer": "SILVESTER", "points": 20}
--   ]
-- }
