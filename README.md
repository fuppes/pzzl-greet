# 🎉 Grüße Dana - Interaktive Multiplayer-Spieleplattform

Eine moderne Next.js-Anwendung für personalisierte Feiertagsgrüße mit integrierten Multiplayer-Rätselspielen.

## ✨ Features

### 🎮 Spielsystem
- **6 verschiedene Spieltypen**: Quiz, Memory, Wortsuche, Chat Typing Race, Countdown Rhythm & Emoji Catcher
- **Multiplayer-Unterstützung**: Mehrere Spieler können gleichzeitig spielen
- **Drag & Drop Game Queue**: Flexible Anordnung der Spiele im Admin-Panel
- **Echtzeit-Synchronisation**: Alle Spieler sehen den gleichen Spielstand
- **Leaderboard**: Live-Punktestand während und nach jedem Spiel

### 💬 Chat Typing Race
- **WhatsApp-Style Chat**: Beantworte Nachrichten von Freunden & Familie
- **Konfigurierbare Zeit**: 10-300 Sekunden Spielzeit einstellbar
- **20 lustige Charaktere**: Oma, Ex-Freundin, Vermieter, Fitnesstrainer uvm.
- **Penalty-System**: Falsche Antworten = -3 Sekunden + böse Reaktion
- **Ghost-Text**: Transparenter Hinweis-Text im Eingabefeld

### ⏱ Countdown Rhythm
- **Timing-Spiel**: Stoppe den Countdown im richtigen Moment
- **Rhythmus-basiert**: Punkte basierend auf Genauigkeit

### 🎯 Emoji Catcher
- **Fang-Spiel**: Bewege den Korb und fange fallende Emojis
- **5 Themen-Kategorien**: Verschiedene Emoji-Sets zum Spielen
- **Touch-Steuerung**: Optimiert für mobile Geräte

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
- **Avatar-Auswahl**: 8 verschiedene Emoji-Avatare für Spieler
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

## 🚀 Quick Start

### Voraussetzungen

- Node.js 18+ und npm
- Supabase Account
- Git

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd grtngs.dana

# Dependencies installieren
npm install

# Environment Variables erstellen
cp .env.example .env.local
# Fülle .env.local mit deinen Supabase Credentials

# Development Server starten
npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000)

### Datenbank Setup

1. Führe `/database/00-complete-migration.sql` im Supabase SQL Editor aus
2. Führe `/database/set-admin-role.sql` mit deiner User-ID aus
3. Erstelle Storage Buckets (siehe [Deployment Guide](docs/DEPLOYMENT.md))

## 📖 Dokumentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Vollständige Deployment-Anleitung
- **[Security Documentation](docs/SECURITY.md)** - Sicherheits-Setup und Best Practices

## 🎮 Spieltypen

### 1. Quiz
- Multiple-Choice Fragen mit 4 Antworten
- Punkte für richtige Antworten
- Vollständig konfigurierbar im Admin-Panel

### 2. Memory
- Kartenpaare finden mit verschiedenen Emoji-Sets
- Vorlagen: Weihnachten, Silvester, Ostern, Geburtstag, Halloween, Sommer
- Punkte für gefundene Paare

### 3. Wortsuche
- Buchstabensalat entwirren
- Auto-Scramble Funktion
- Zeitbasiertes Punktesystem

### 4. Chat Typing Race
- Beantworte Nachrichten so schnell wie möglich
- 20 verschiedene Charaktere mit individuellen Reaktionen
- Konfigurierbare Spielzeit (10-300 Sekunden)
- Ghost-Text Hilfe im Eingabefeld

### 5. Countdown Rhythm
- Stoppe den Countdown im richtigen Moment
- Punkte basierend auf Timing-Genauigkeit

### 6. Emoji Catcher
- Fange fallende Emojis mit einem Korb
- 5 verschiedene Themen-Kategorien
- Touch-optimiert für mobile Geräte

## 🏗 Architektur

```
grtngs.dana/
├── app/
│   ├── admin/              # Admin Dashboard + Middleware-Schutz
│   ├── room/[slug]/        # Raum-Lobby
│   ├── session/[code]/     # Spiel-Session
│   └── not-found.tsx       # 404 mit Känguru-Jump-Spiel
├── components/
│   ├── puzzles/            # Spiel-Komponenten
│   │   ├── QuizWithLeaderboard.tsx
│   │   ├── MemoryWithLeaderboard.tsx
│   │   ├── WordWithLeaderboard.tsx
│   │   ├── ChatTypingRaceWithLeaderboard.tsx
│   │   ├── CountdownRhythmPuzzle.tsx
│   │   └── EmojiCatcherWithLeaderboard.tsx
│   ├── GameEditor.tsx      # Modularer Game-Editor
│   ├── GreetingPage.tsx    # Abschluss-Seite mit Feedback
│   └── Inbox.tsx           # Nachrichten-Inbox
├── database/
│   ├── 00-complete-migration.sql  # Vollständiges DB-Setup
│   └── set-admin-role.sql         # Admin-Rolle setzen
├── docs/
│   ├── DEPLOYMENT.md       # Deployment-Anleitung
│   └── SECURITY.md         # Security-Dokumentation
└── middleware.ts           # Server-side Admin-Schutz
```

## 🔒 Sicherheit

- ✅ **Row Level Security (RLS)** auf allen Tabellen
- ✅ **Server-side Middleware** für Admin-Bereich
- ✅ **Sichere Storage Policies** für Uploads
- ✅ **Admin-Rolle in User Metadata** (nicht client-manipulierbar)

Details: [Security Documentation](docs/SECURITY.md)

## 🚀 Deployment

### Vercel (empfohlen)

```bash
vercel --prod
```

Vollständige Anleitung: [Deployment Guide](docs/DEPLOYMENT.md)

## 🎯 Verwendung

### Als Host
1. Gehe zu `/admin` und erstelle einen Raum
2. Füge Spiele zur Game Queue hinzu
3. Gehe zu `/room/[dein-slug]`
4. Starte eine Session und teile den QR-Code

### Als Spieler
1. Scanne den QR-Code ODER gehe zu `/session/[code]`
2. Wähle deinen Avatar und gib deinen Namen ein
3. Spiele die Spiele und sammle Punkte
4. Sende Feedback mit optionalem Selfie

## 🐛 Troubleshooting

Siehe [Deployment Guide](docs/DEPLOYMENT.md#-häufige-probleme)

## 📝 Development

```bash
# Development Server
npm run dev

# Production Build
npm run build

# Linting
npm run lint

# TypeScript Types generieren
npx supabase gen types typescript \
  --project-id "dein-projekt-id" \
  > types/database.ts
```

## 📄 Lizenz

Privates Projekt - Alle Rechte vorbehalten.

## 👤 Autor

Dana - Silvester 2025/2026 🎆

---

**Viel Spaß beim Spielen! 🎉**
