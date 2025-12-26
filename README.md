# 🎉 Grüße Dana - Interaktive Multiplayer-Spieleplattform

Eine moderne Next.js-Anwendung für personalisierte Feiertagsgrüße mit integrierten Multiplayer-Rätselspielen.

## 📋 Inhaltsverzeichnis

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Datenbank Setup](#-datenbank-setup)
- [Konfiguration](#-konfiguration)
- [Verwendung](#-verwendung)
- [Spieltypen](#-spieltypen)
- [Architektur](#-architektur)
- [Deployment](#-deployment)

## ✨ Features

### 🎮 Spielsystem
- **3 verschiedene Spieltypen**: Quiz, Memory und Wortsuche
- **Multiplayer-Unterstützung**: Mehrere Spieler können gleichzeitig spielen
- **Drag & Drop Game Queue**: Flexible Anordnung der Spiele im Admin-Panel
- **Echtzeit-Synchronisation**: Alle Spieler sehen den gleichen Spielstand
- **Leaderboard**: Live-Punktestand während und nach jedem Spiel

### 📬 Feedback & Messaging System
- **Emoji-Auswahl**: 12 verschiedene Emojis zur Auswahl
- **Selfie-Upload**: Spieler können Selfies mit Nachrichten senden
  - Webcam-Aufnahme direkt im Browser
  - Alternativ: Bild-Upload (funktioniert überall)
  - Automatische Speicherung in Supabase Storage
- **Admin Inbox**: Filtern nach gelesen/ungelesen, Nachrichten verwalten
- **Datenschutz**: Nur der Room-Ersteller sieht Nachrichten für seine Räume

### 🎯 Session-Management
- **QR-Code Join**: Einfaches Beitreten via QR-Code-Scan
- **Session-Codes**: 6-stellige alphanumerische Codes
- **Lobby-System**: Warten auf andere Spieler vor Spielstart
- **Host-Kontrolle**: Nur der Host kann das Spiel starten

### 🎨 Personalisierung
- **Video-Grüße**: Upload von personalisierten Video-Nachrichten
- **Custom Räume**: Jeder Raum kann individuell konfiguriert werden
- **Spieler-Farben**: Automatische farbliche Unterscheidung der Spieler

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) mit App Router
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **Datenbank**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (für Videos und Selfies)
- **Realtime**: Supabase Realtime für Live-Updates
- **QR-Codes**: qrcode.react

## 📦 Installation

### Voraussetzungen

- Node.js 18+ und npm
- Supabase Account
- Git

### Schritt 1: Repository klonen

```bash
git clone <repository-url>
cd grtngs.dana
```

### Schritt 2: Dependencies installieren

```bash
npm install
```

### Schritt 3: Umgebungsvariablen einrichten

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
NEXT_PUBLIC_SUPABASE_URL=deine-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-supabase-anon-key
```

Diese Werte findest du in deinem Supabase Dashboard unter Settings > API.

## 🗄 Datenbank Setup

### 1. Tabellen erstellen

Führe die folgenden SQL-Skripte in dieser Reihenfolge im Supabase SQL Editor aus:

```sql
-- Basis-Tabellen (rooms, games, game_sessions, players, etc.)
-- Diese müssen existieren, bevor die zusätzlichen Features hinzugefügt werden
```

### 2. Messaging System einrichten

```bash
# Führe aus: database-messages-schema.sql
# Erstellt die player_messages Tabelle
```

### 3. Selfie-Support aktivieren

```bash
# Führe aus: database-messages-add-selfie.sql
# Fügt selfie_url Spalte hinzu
```

### 4. Room Creator Tracking

```bash
# Führe aus: database-rooms-add-created-by.sql
# Fügt created_by Spalte zur rooms Tabelle hinzu
```

### 5. Storage Buckets erstellen

Im Supabase Dashboard unter **Storage**:

#### Bucket: `player-selfies`
- **Public**: ✅ Ja
- **File size limit**: 5MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

**Policies:**
```sql
-- Upload Policy
CREATE POLICY "Authenticated users can upload selfies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'player-selfies');

-- Read Policy
CREATE POLICY "Public can view selfies"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'player-selfies');
```

#### Bucket: `room-videos` (optional für Video-Grüße)
- **Public**: ✅ Ja
- **File size limit**: 100MB
- **Allowed MIME types**: video/mp4, video/webm

## ⚙️ Konfiguration

### Admin-Zugang einrichten

1. Registriere dich in der App (oder erstelle einen User in Supabase Auth)
2. Gehe zu `/admin` und logge dich ein
3. Erstelle deinen ersten Raum

### Raum erstellen

Im Admin-Dashboard:

1. **Raum-Details** eingeben:
   - Name
   - Beschreibung
   - Slug (URL-freundlich)
   - Video-URL (optional)

2. **Spiele hinzufügen**:
   - Wähle Spieltyp (Quiz, Memory, Wortsuche)
   - Konfiguriere das Spiel
   - Ordne mit Drag & Drop an

3. **Raum aktivieren**

## 🎯 Verwendung

### Als Host (Raum-Ersteller)

1. Gehe zu `/room/[dein-slug]`
2. Gib deinen Namen ein
3. Klicke "Spiel starten"
4. Warte in der Lobby auf andere Spieler
5. Zeige den QR-Code oder teile den Session-Code
6. Starte das Spiel wenn alle da sind

### Als Spieler (Gast)

**Option 1: QR-Code scannen**
- Scanne den QR-Code mit dem Smartphone
- Gib deinen Namen ein
- Warte auf den Spielstart

**Option 2: Session-Code eingeben**
- Gehe zu `/session/[session-code]`
- Gib deinen Namen ein
- Tritt der Session bei

### Während des Spiels

- Löse die Rätsel zusammen mit anderen Spielern
- Sammle Punkte für richtige Antworten
- Sehe den Live-Leaderboard nach jedem Spiel
- Am Ende: Persönliche Grußbotschaft & Feedback senden

### Feedback senden

Nach dem Spiel auf der Grußseite:

1. **Emoji wählen** (optional)
2. **Nachricht schreiben** (bis 500 Zeichen)
3. **Selfie hinzufügen** (optional):
   - Webcam-Aufnahme ODER
   - Bild hochladen
4. **Senden** ✉️

Der Raum-Ersteller erhält die Nachricht in seiner Inbox.

## 🎮 Spieltypen

### 1. Quiz
- Multiple-Choice Fragen
- 4 Antwortmöglichkeiten
- Punkte für richtige Antworten
- Konfigurierbar: Frage, Antworten, richtige Antwort

### 2. Memory
- Kartenpaare finden
- Verschiedene Emoji-Paare
- Punkte für gefundene Paare
- Konfigurierbar: Anzahl der Paare, Emoji-Set

### 3. Wortsuche
- Buchstabengitter mit versteckten Wörtern
- Wörter horizontal, vertikal, diagonal
- Punkte für gefundene Wörter
- Konfigurierbar: Größe, Wortliste

## 🏗 Architektur

### Verzeichnisstruktur

```
grtngs.dana/
├── app/
│   ├── admin/              # Admin Dashboard
│   ├── room/[slug]/        # Raum-Lobby
│   ├── session/[code]/     # Spiel-Session
│   └── page.tsx            # Homepage
├── components/
│   ├── puzzles/            # Spiel-Komponenten
│   │   ├── QuizWithLeaderboard.tsx
│   │   ├── MemoryWithLeaderboard.tsx
│   │   └── WordWithLeaderboard.tsx
│   ├── AdminDashboard.tsx  # Admin UI
│   ├── GreetingPage.tsx    # Abschluss-Seite mit Feedback
│   ├── Inbox.tsx           # Nachrichten-Inbox
│   ├── Leaderboard.tsx     # Punktestand
│   └── FinalLeaderboard.tsx
├── lib/
│   ├── supabase/           # Supabase Client
│   └── game/               # Game Logic
├── types/
│   └── database.ts         # TypeScript Typen
└── database-*.sql          # SQL Migrations
```

### Datenbank-Schema (Überblick)

**Wichtigste Tabellen:**

- `rooms` - Spielräume mit Konfiguration
- `games` - Spiel-Definitionen (Quiz, Memory, etc.)
- `room_game_queue` - Zuordnung Raum ↔ Spiele (mit Order)
- `game_sessions` - Aktive Spiel-Sessions
- `players` - Spieler in Sessions
- `player_messages` - Feedback-Nachrichten mit Selfies

### Realtime Features

- **Players**: Live-Updates wenn Spieler beitreten/verlassen
- **Game State**: Synchronisation des Spielstands
- **Leaderboard**: Echtzeit-Punktestand

## 🚀 Deployment

### Vercel (empfohlen)

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. Projekt deployen
vercel

# 3. Umgebungsvariablen setzen
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Production Build
vercel --prod
```

### Environment Variables auf Vercel

Gehe zu deinem Projekt → Settings → Environment Variables und füge hinzu:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Build & Start (manuell)

```bash
# Production Build erstellen
npm run build

# Production Server starten
npm run start
```

## 🔒 Sicherheit

### Row Level Security (RLS)

Alle Supabase-Tabellen nutzen RLS-Policies:

- **Rooms**: Nur authentifizierte User können erstellen
- **Messages**: Nur Room-Creator sieht seine Nachrichten
- **Sessions**: Public read, authenticated write
- **Storage**: Public read für Selfies, authenticated upload

### Best Practices

- Verwende immer Server Components für sensitive Daten
- API-Keys nur in `.env.local` speichern
- Supabase Anon Key ist public-safe (durch RLS geschützt)

## 📝 Entwicklung

### Lokaler Development Server

```bash
npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000)

### TypeScript Types generieren

Nach Änderungen am Supabase-Schema:

```bash
npx supabase gen types typescript --project-id "dein-projekt-id" > types/database.ts
```

### Linting

```bash
npm run lint
```

## 🐛 Troubleshooting

### Webcam funktioniert nicht auf macOS

**Lösung**: Nutze den "Bild hochladen" Button als Alternative.

**Mögliche Ursachen**:
- Browser-Berechtigungen nicht erteilt
- HTTPS erforderlich (localhost funktioniert)
- Browser-spezifische Probleme

### Nachrichten erscheinen nicht in Inbox

**Checkliste**:
1. ✅ `database-rooms-add-created-by.sql` ausgeführt?
2. ✅ Bestehende Räume haben `created_by` gesetzt?
3. ✅ Mit dem richtigen User eingeloggt?

**Fix für bestehende Räume**:
```sql
-- Setze created_by für alle existierenden Räume
UPDATE rooms
SET created_by = 'DEINE_USER_ID'
WHERE created_by IS NULL;
```

### Storage Upload schlägt fehl

**Checke**:
1. ✅ Bucket `player-selfies` existiert?
2. ✅ Bucket ist public?
3. ✅ Upload-Policy erstellt?

## 📄 Lizenz

Privates Projekt - Alle Rechte vorbehalten.

## 👤 Autor

Dana - Silvester 2025/2026 🎆

---

**Viel Spaß beim Spielen! 🎉**
