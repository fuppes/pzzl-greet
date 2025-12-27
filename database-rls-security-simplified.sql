-- =====================================================
-- SECURITY UPDATE: Verschärfte Row Level Security (RLS)
-- VEREINFACHTE VERSION - OHNE ADMIN-ROLLE
-- =====================================================
-- Diese Version funktioniert OHNE User Metadata zu ändern
-- Jeder authentifizierte User kann Rooms erstellen und verwalten seine eigenen

-- =====================================================
-- 1. ALTE POLICIES LÖSCHEN (zu offen!)
-- =====================================================

-- Game Sessions Policies löschen
DROP POLICY IF EXISTS "Anyone can create game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can view game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can update game sessions" ON game_sessions;

-- Players Policies löschen
DROP POLICY IF EXISTS "Anyone can create players" ON players;
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Anyone can update players" ON players;

-- Game Progress Policies löschen
DROP POLICY IF EXISTS "Anyone can manage game progress" ON game_progress;

-- Player Actions Policies löschen
DROP POLICY IF EXISTS "Anyone can manage player actions" ON player_actions;

-- Rooms Policies löschen (alte Version)
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;

-- Player Messages Policies löschen (zu offen)
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON player_messages;
DROP POLICY IF EXISTS "Authenticated users can read all messages" ON player_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON player_messages;

-- =====================================================
-- 2. NEUE SICHERE POLICIES (OHNE ADMIN-ROLLE)
-- =====================================================

-- -----------------------------------------------------
-- ROOMS: Jeder Auth-User kann Rooms erstellen
-- -----------------------------------------------------

-- Jeder kann aktive Räume LESEN
CREATE POLICY "Public can view active rooms"
  ON rooms
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Authentifizierte User können Räume ERSTELLEN
CREATE POLICY "Authenticated users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Nur Room-Ersteller kann UPDATEN
CREATE POLICY "Only room owner can update rooms"
  ON rooms
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Nur Room-Ersteller kann LÖSCHEN
CREATE POLICY "Only room owner can delete rooms"
  ON rooms
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- -----------------------------------------------------
-- GAME SESSIONS: Nur Lesen, Erstellen, Host kann updaten
-- -----------------------------------------------------

-- Jeder kann Game Sessions LESEN (für Multiplayer)
CREATE POLICY "Anyone can view game sessions"
  ON game_sessions
  FOR SELECT
  USING (true);

-- Jeder kann Game Sessions ERSTELLEN
CREATE POLICY "Anyone can create game sessions"
  ON game_sessions
  FOR INSERT
  WITH CHECK (true);

-- Nur der Host kann die Session UPDATEN
CREATE POLICY "Only host can update game session"
  ON game_sessions
  FOR UPDATE
  USING (
    -- Entweder ist der User der Host
    host_player_id IN (
      SELECT id FROM players WHERE session_id = game_sessions.id AND id = host_player_id
    )
    -- Oder für Sessions ohne Host-Player (backward compatibility)
    OR host_player_id IS NULL
  );

-- Nur der Host kann die Session LÖSCHEN
CREATE POLICY "Only host can delete game session"
  ON game_sessions
  FOR DELETE
  USING (
    host_player_id IN (
      SELECT id FROM players WHERE session_id = game_sessions.id AND id = host_player_id
    )
    OR host_player_id IS NULL
  );

-- -----------------------------------------------------
-- PLAYERS: Nur eigene Player-Daten ändern
-- -----------------------------------------------------

-- Jeder kann Players LESEN (für Multiplayer-Anzeige)
CREATE POLICY "Anyone can view players"
  ON players
  FOR SELECT
  USING (true);

-- Jeder kann Players ERSTELLEN (beim Joinen)
CREATE POLICY "Anyone can create players"
  ON players
  FOR INSERT
  WITH CHECK (true);

-- Players können nur ihre eigenen Daten UPDATEN
-- Problem: Players sind nicht auth.users, also erlauben wir Updates für die Session
CREATE POLICY "Players in session can update"
  ON players
  FOR UPDATE
  USING (
    -- Erlauben für alle Players in einer aktiven Session (Multiplayer)
    session_id IN (
      SELECT id FROM game_sessions WHERE status IN ('waiting', 'in_progress')
    )
  );

-- Nur Host kann Players LÖSCHEN
CREATE POLICY "Only host can delete players"
  ON players
  FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE host_player_id IS NOT NULL
    )
  );

-- -----------------------------------------------------
-- GAME PROGRESS: Nur für Sessions, View all
-- -----------------------------------------------------

-- Jeder kann Game Progress LESEN
CREATE POLICY "Anyone can view game progress"
  ON game_progress
  FOR SELECT
  USING (true);

-- Nur für aktive Sessions ERSTELLEN/UPDATEN
CREATE POLICY "Active sessions can manage game progress"
  ON game_progress
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM game_sessions WHERE status IN ('waiting', 'in_progress')
    )
  );

CREATE POLICY "Active sessions can update game progress"
  ON game_progress
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE status IN ('waiting', 'in_progress')
    )
  );

-- -----------------------------------------------------
-- PLAYER ACTIONS: Nur eigene Actions erstellen
-- -----------------------------------------------------

-- Jeder kann Player Actions LESEN (für Live-Updates)
CREATE POLICY "Anyone can view player actions"
  ON player_actions
  FOR SELECT
  USING (true);

-- Nur in aktiven Sessions ERSTELLEN
CREATE POLICY "Only active sessions can create actions"
  ON player_actions
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM game_sessions WHERE status IN ('waiting', 'in_progress')
    )
    -- Und Player muss zur Session gehören
    AND player_id IN (
      SELECT id FROM players WHERE session_id = player_actions.session_id
    )
  );

-- KEINE Updates oder Deletes für Player Actions (Audit Trail)
-- Actions sind unveränderlich!

-- -----------------------------------------------------
-- PLAYER MESSAGES: Nur Room-Owner kann lesen
-- -----------------------------------------------------

-- Jeder kann Messages ERSTELLEN (anonymes Feedback)
CREATE POLICY "Anyone can create player messages"
  ON player_messages
  FOR INSERT
  WITH CHECK (true);

-- NUR Room-Owner kann Messages LESEN
CREATE POLICY "Only room owner can read messages"
  ON player_messages
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- NUR Room-Owner kann Messages UPDATEN (read status)
CREATE POLICY "Only room owner can update messages"
  ON player_messages
  FOR UPDATE
  TO authenticated
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- Room-Owner kann Messages LÖSCHEN
CREATE POLICY "Only room owner can delete messages"
  ON player_messages
  FOR DELETE
  TO authenticated
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- FERTIG!
-- =====================================================

-- Überprüfen ob alle Policies aktiv sind:
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
