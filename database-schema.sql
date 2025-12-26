-- Greetings Platform Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms Table
-- Each room represents a unique greeting session/event
CREATE TABLE rooms (
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
CREATE TABLE game_sessions (
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
CREATE TABLE players (
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
CREATE TABLE game_progress (
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
CREATE TABLE player_actions (
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
CREATE TABLE greeting_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- photo, video, message
  content_url TEXT,
  content_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_rooms_slug ON rooms(slug);
CREATE INDEX idx_rooms_active ON rooms(is_active, expires_at);
CREATE INDEX idx_game_sessions_room ON game_sessions(room_id);
CREATE INDEX idx_game_sessions_code ON game_sessions(session_code);
CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_game_progress_session ON game_progress(session_id);
CREATE INDEX idx_player_actions_session ON player_actions(session_id);
CREATE INDEX idx_greeting_content_room ON greeting_content(room_id);

-- Row Level Security (RLS) Policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_content ENABLE ROW LEVEL SECURITY;

-- Public read access to active rooms
CREATE POLICY "Anyone can view active rooms" ON rooms
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Anyone can create a game session
CREATE POLICY "Anyone can create game sessions" ON game_sessions
  FOR INSERT WITH CHECK (true);

-- Anyone can view game sessions
CREATE POLICY "Anyone can view game sessions" ON game_sessions
  FOR SELECT USING (true);

-- Anyone can update game sessions
CREATE POLICY "Anyone can update game sessions" ON game_sessions
  FOR UPDATE USING (true);

-- Players policies
CREATE POLICY "Anyone can create players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update players" ON players
  FOR UPDATE USING (true);

-- Game progress policies
CREATE POLICY "Anyone can manage game progress" ON game_progress
  FOR ALL USING (true);

-- Player actions policies
CREATE POLICY "Anyone can manage player actions" ON player_actions
  FOR ALL USING (true);

-- Greeting content policies (read-only for players)
CREATE POLICY "Anyone can view greeting content" ON greeting_content
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_progress_updated_at BEFORE UPDATE ON game_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
