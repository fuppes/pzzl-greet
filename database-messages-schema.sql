-- Player Messages / Feedback System
-- Messages that players can send to the room creator after games

CREATE TABLE IF NOT EXISTS player_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_player_messages_room_id ON player_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_player_messages_session_id ON player_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_player_messages_created_at ON player_messages(created_at DESC);

-- Row Level Security
ALTER TABLE player_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can insert messages
CREATE POLICY "Authenticated users can insert messages"
  ON player_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Anyone authenticated can read all messages
CREATE POLICY "Authenticated users can read all messages"
  ON player_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Anyone authenticated can update messages (for marking as read)
CREATE POLICY "Authenticated users can update messages"
  ON player_messages
  FOR UPDATE
  TO authenticated
  USING (true);
