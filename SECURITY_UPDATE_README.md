# 🔒 Security Update - RLS Policies

## ⚠️ KRITISCH: Vor Deployment ausführen!

Die ursprünglichen Row Level Security (RLS) Policies waren **viel zu offen** und erlaubten jedem Benutzer:
- Game Sessions zu manipulieren
- Fremde Spielstände zu ändern
- Alle Nachrichten aller Räume zu lesen
- Beliebig Daten zu löschen

## Was wurde gefixt?

### 1. **Rooms** - Nur Owner können editieren
- ✅ Jeder kann aktive Räume lesen
- ✅ Nur authentifizierte User können Räume erstellen
- ✅ Nur Room-Owner (created_by) können ihren Raum updaten/löschen
- ✅ Admin-User können alle Räume verwalten

### 2. **Game Sessions** - Nur Host hat Kontrolle
- ✅ Jeder kann Sessions lesen (für Multiplayer)
- ✅ Jeder kann Sessions erstellen (Join-Code)
- ✅ **NUR der Host** kann die Session updaten (Status ändern, Puzzle weitergehen)
- ✅ Verhindert Session-Hijacking

### 3. **Players** - Schutz vor Manipulation
- ✅ Jeder kann Players lesen (Leaderboard)
- ✅ Jeder kann sich als Player registrieren
- ✅ Updates nur für aktive Sessions erlaubt
- ✅ Keine fremden Players löschen

### 4. **Player Actions** - Unveränderlich (Audit Trail)
- ✅ Jeder kann Actions lesen (Live-Updates)
- ✅ Nur in aktiven Sessions Actions erstellen
- ✅ Player muss zur Session gehören
- ✅ **KEINE Updates/Deletes** - Actions sind unveränderlich!

### 5. **Player Messages** - Privacy geschützt!
- ✅ Jeder kann Nachrichten senden (anonymes Feedback)
- ✅ **NUR Room-Owner** kann Nachrichten lesen (room.created_by = auth.uid())
- ✅ Fremde User sehen keine Messages mehr!
- ✅ Owner kann Messages löschen/als gelesen markieren

### 6. **Storage Policies** - Kommentiert für manuelles Setup
- 📝 player-selfies: Authentifizierte User können uploaden
- 📝 room-videos: Nur Room-Owner können Videos hochladen
- 📝 Public read access für beide Buckets

## 🚀 Installation

### Schritt 1: SQL Migration ausführen

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt
3. SQL Editor → New Query
4. Kopiere den Inhalt von `database-rls-security-update.sql`
5. Führe das Script aus
6. Überprüfe: Alle alten Policies sollten gelöscht, neue erstellt sein

### Schritt 2: Storage Policies manuell erstellen

Da Storage Policies nicht via SQL erstellt werden können, musst du sie manuell im Dashboard erstellen:

#### Bucket: `player-selfies`

**Policy 1: Allow authenticated uploads**
```sql
CREATE POLICY "Authenticated users can upload selfies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-selfies'
);
```

**Policy 2: Public can view**
```sql
CREATE POLICY "Public can view selfies"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'player-selfies');
```

**Policy 3: Cleanup old files (optional)**
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'player-selfies');
```

#### Bucket: `room-videos`

**Policy 1: Room owners can upload**
```sql
CREATE POLICY "Room owners can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-videos'
  AND EXISTS (
    SELECT 1 FROM rooms WHERE created_by = auth.uid()
  )
);
```

**Policy 2: Public can view**
```sql
CREATE POLICY "Public can view room videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'room-videos');
```

**Policy 3: Room owners can delete**
```sql
CREATE POLICY "Room owners can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-videos'
  AND EXISTS (
    SELECT 1 FROM rooms WHERE created_by = auth.uid()
  )
);
```

### Schritt 3: Admin-User Rolle setzen

Für Admin-Zugriff musst du die User Metadata manuell setzen:

1. Supabase Dashboard → Authentication → Users
2. Klicke auf deinen Admin-User
3. Unter "User Metadata" (Raw JSON) füge hinzu:
```json
{
  "role": "admin"
}
```
4. Speichern

Jetzt kann dieser User alle Räume verwalten!

## 🧪 Testing

### Test 1: Anonymer User kann keine Rooms editieren
```bash
# In Browser Console (ohne Login):
const { data, error } = await supabase
  .from('rooms')
  .update({ name: 'HACKED' })
  .eq('id', 'some-room-id')

// Erwartung: Error - new row violates row-level security policy
```

### Test 2: Non-Owner kann Nachrichten nicht lesen
```bash
# Als User B einloggen, versuchen User A's Messages zu lesen:
const { data, error } = await supabase
  .from('player_messages')
  .select('*')
  .eq('room_id', 'room-von-user-a')

// Erwartung: data = [] (leer), keine Messages sichtbar
```

### Test 3: Nur Host kann Session updaten
```bash
# Als Non-Host Player:
const { data, error } = await supabase
  .from('game_sessions')
  .update({ status: 'completed' })
  .eq('id', 'session-id')

// Erwartung: Sollte fehlschlagen wenn nicht Host
```

## 📊 Verifikation

Nach dem Ausführen der Migration, überprüfe die Policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Du solltest sehen:
- `rooms`: 4 policies (SELECT, INSERT, UPDATE, DELETE)
- `game_sessions`: 4 policies
- `players`: 4 policies
- `player_actions`: 2 policies (SELECT, INSERT nur!)
- `player_messages`: 4 policies (mit auth.uid() checks)
- `game_progress`: 3 policies

## 🔥 Breaking Changes

### **WICHTIG:** Diese Änderungen können bestehende Funktionalität brechen!

**Betroffen:**
1. **Admin Dashboard**: Benötigt jetzt `created_by` Feld in rooms
2. **Inbox**: Zeigt nur noch eigene Rooms' Messages
3. **Game Updates**: Nur Host kann Session-Status ändern

**Migration Path:**
1. Führe zuerst `database-rooms-add-created-by.sql` aus
2. Dann `database-rls-security-update.sql`
3. Teste im Development!
4. Erst dann Production deployen

## ❓ FAQ

### Q: Meine App funktioniert nach der Migration nicht mehr!
**A:** Prüfe ob:
1. Alle Migrations in der richtigen Reihenfolge ausgeführt wurden
2. `created_by` Feld in allen Rooms gesetzt ist
3. Admin-User die `role: admin` Metadata hat
4. Storage Policies manuell erstellt wurden

### Q: Kann ich die alten Policies zurückholen?
**A:** Ja, einfach `database-schema.sql` nochmal ausführen. **ABER:** Das ist unsicher!

### Q: Wie kann ich testen ob RLS funktioniert?
**A:** Nutze `psql` oder Supabase SQL Editor mit:
```sql
SET ROLE anon; -- Simuliert anonymen User
SELECT * FROM rooms; -- Sollte nur aktive Rooms zeigen

SET ROLE authenticated; -- Simuliert eingeloggten User
SET request.jwt.claims.sub = 'user-uuid'; -- Setzt User ID
```

## 🎯 Next Steps

Nach diesem Security-Update solltest du noch:

1. [ ] File Upload Validierung server-seitig (Supabase Edge Function)
2. [ ] Rate Limiting (Vercel Edge Config)
3. [ ] Admin Middleware für `/admin` Route
4. [ ] Session Code Stärke erhöhen (8+ Zeichen)
5. [ ] Input Sanitization für User-Messages

Siehe [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) für vollständige Liste.

---

**Version:** 1.0
**Datum:** 2025-12-27
**Autor:** Claude Code Security Audit
