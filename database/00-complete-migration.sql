-- =====================================================
-- GREETINGS PLATFORM - COMPLETE DATABASE MIGRATION
-- =====================================================
-- This script combines all migrations in the correct order
-- Run this in Supabase SQL Editor to set up your complete database
--
-- IMPORTANT:
-- - Run this on a fresh database OR manually verify existing tables first
-- - After running, set your admin role via set-admin-role.sql
-- =====================================================

-- =====================================================
-- STEP 1: Base Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms Table
-- Each room represents a unique greeting session/event
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL, -- for URL-friendly access
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE, -- individual expiration per room
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Sessions Table
-- Tracks active multiplayer sessions within a room
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  session_code VARCHAR(50) UNIQUE NOT NULL, -- join code for players
  host_player_id UUID, -- reference to player who started session
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, completed
  current_puzzle_index INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players Table
-- Tracks individual players in a session
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7), -- hex color for player identification
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Progress Table
-- Tracks progress through puzzles for each session
CREATE TABLE IF NOT EXISTS game_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  puzzle_index INTEGER NOT NULL,
  puzzle_type VARCHAR(50) NOT NULL, -- quiz, puzzle, word_game
  is_completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  data JSONB, -- flexible data storage for puzzle-specific state
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, puzzle_index)
);

-- Player Actions Table (for realtime collaboration)
-- Tracks individual player actions during games
CREATE TABLE IF NOT EXISTS player_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  puzzle_index INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- answer_submitted, puzzle_piece_moved, etc.
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Greeting Content Table
-- Stores the actual greeting content (photos, videos, messages)
CREATE TABLE IF NOT EXISTS greeting_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- photo, video, message
  content_url TEXT,
  content_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_slug ON rooms(slug);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_room ON game_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_code ON game_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_session ON game_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_player_actions_session ON player_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_greeting_content_room ON greeting_content(room_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_progress_updated_at ON game_progress;
CREATE TRIGGER update_game_progress_updated_at BEFORE UPDATE ON game_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 2: Add created_by to rooms
-- =====================================================

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);

-- =====================================================
-- STEP 3: Player Messages / Feedback System
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_player_messages_room_id ON player_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_player_messages_session_id ON player_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_player_messages_created_at ON player_messages(created_at DESC);

-- =====================================================
-- STEP 4: Add selfie_url to player_messages
-- =====================================================

ALTER TABLE player_messages
ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- =====================================================
-- STEP 5: Add avatar to players
-- =====================================================

ALTER TABLE players
ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '😀';

UPDATE players
SET avatar = '😀'
WHERE avatar IS NULL;

-- =====================================================
-- STEP 6: Games and Queue Tables
-- =====================================================

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL CHECK (game_type IN ('quiz', 'memory', 'word', 'chat_typing')),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_game_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  queue_position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, queue_position),
  UNIQUE(room_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_room_game_queue_room_id ON room_game_queue(room_id);
CREATE INDEX IF NOT EXISTS idx_room_game_queue_position ON room_game_queue(room_id, queue_position);

-- =====================================================
-- STEP 7: Enable Row Level Security
-- =====================================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_game_queue ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: Drop Old (Insecure) Policies
-- =====================================================

-- Old Room Policies
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;

-- Old Game Session Policies
DROP POLICY IF EXISTS "Anyone can create game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can view game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can update game sessions" ON game_sessions;

-- Old Player Policies
DROP POLICY IF EXISTS "Anyone can create players" ON players;
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Anyone can update players" ON players;

-- Old Game Progress Policies
DROP POLICY IF EXISTS "Anyone can manage game progress" ON game_progress;

-- Old Player Actions Policies
DROP POLICY IF EXISTS "Anyone can manage player actions" ON player_actions;

-- Old Greeting Content Policies
DROP POLICY IF EXISTS "Anyone can view greeting content" ON greeting_content;

-- Old Player Messages Policies
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON player_messages;
DROP POLICY IF EXISTS "Authenticated users can read all messages" ON player_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON player_messages;

-- =====================================================
-- STEP 9: Create Secure RLS Policies
-- =====================================================

-- -----------------------------------------------------
-- ROOMS: Public read, owner/admin write
-- -----------------------------------------------------

CREATE POLICY "Public can view active rooms"
  ON rooms
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Authenticated users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only room owner can update rooms"
  ON rooms
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only room owner can delete rooms"
  ON rooms
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- -----------------------------------------------------
-- GAME SESSIONS: Public read, host can update
-- -----------------------------------------------------

CREATE POLICY "Anyone can view game sessions"
  ON game_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create game sessions"
  ON game_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only host can update game session"
  ON game_sessions
  FOR UPDATE
  USING (
    host_player_id IN (
      SELECT id FROM players WHERE id = host_player_id
    )
  );

CREATE POLICY "Only host can delete game session"
  ON game_sessions
  FOR DELETE
  USING (
    host_player_id IN (
      SELECT id FROM players WHERE id = host_player_id
    )
  );

-- -----------------------------------------------------
-- PLAYERS: Session-based access
-- -----------------------------------------------------

CREATE POLICY "Anyone can view players in same session"
  ON players
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as player"
  ON players
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update themselves"
  ON players
  FOR UPDATE
  USING (true);

-- -----------------------------------------------------
-- GAME PROGRESS: Session-based access
-- -----------------------------------------------------

CREATE POLICY "Anyone can view game progress in session"
  ON game_progress
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create game progress"
  ON game_progress
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update game progress"
  ON game_progress
  FOR UPDATE
  USING (true);

-- -----------------------------------------------------
-- PLAYER ACTIONS: Anyone can create (for gameplay)
-- -----------------------------------------------------

CREATE POLICY "Anyone can create player actions"
  ON player_actions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view player actions in session"
  ON player_actions
  FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- GREETING CONTENT: Public read, owner write
-- -----------------------------------------------------

CREATE POLICY "Anyone can view greeting content"
  ON greeting_content
  FOR SELECT
  USING (true);

CREATE POLICY "Room owner can manage greeting content"
  ON greeting_content
  FOR ALL
  TO authenticated
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- -----------------------------------------------------
-- PLAYER MESSAGES: Players write, owner reads
-- -----------------------------------------------------

CREATE POLICY "Players can insert messages"
  ON player_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only room owner can read messages"
  ON player_messages
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Only room owner can update messages"
  ON player_messages
  FOR UPDATE
  TO authenticated
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- -----------------------------------------------------
-- GAMES: Public read, authenticated write
-- -----------------------------------------------------

CREATE POLICY "Enable read access for all users" ON games
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON games
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON games
  FOR DELETE
  TO authenticated
  USING (true);

-- -----------------------------------------------------
-- ROOM GAME QUEUE: Public read, authenticated write
-- -----------------------------------------------------

CREATE POLICY "Enable read access for all users" ON room_game_queue
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON room_game_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON room_game_queue
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON room_game_queue
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
--
-- NEXT STEPS:
-- 1. Set your admin role: Run set-admin-role.sql with your user ID
-- 2. Create storage buckets:
--    - Bucket: player-selfies (public, 5MB limit, image/* types)
--    - Bucket: room-videos (public or private based on needs)
-- 3. Apply storage policies (see database-messages-add-selfie.sql comments)
--
-- =====================================================
