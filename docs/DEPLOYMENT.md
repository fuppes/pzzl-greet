# 🚀 Deployment Guide

Vollständige Anleitung zum Deployment der Grüße Dana Plattform in Produktion.

## 📋 Deployment Checklist

### 1. Datenbank Setup ✅

- [ ] Supabase Projekt erstellt
- [ ] Führe `/database/00-complete-migration.sql` im Supabase SQL Editor aus
- [ ] Führe `/database/set-admin-role.sql` mit deiner User-ID aus
- [ ] Storage Buckets erstellt (siehe unten)
- [ ] Admin-Rolle für deinen User gesetzt

### 2. Storage Buckets ✅

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

#### Bucket: `room-videos` (optional)
- **Public**: ✅ Ja
- **File size limit**: 100MB
- **Allowed MIME types**: video/mp4, video/webm

### 3. Umgebungsvariablen ✅

#### Lokal (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

#### Vercel Production
Gehe zu: Projekt → Settings → Environment Variables

Füge hinzu:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Vercel Deployment ✅

```bash
# 1. Vercel CLI installieren (falls noch nicht)
npm i -g vercel

# 2. Zum Projekt linken
vercel link

# 3. Umgebungsvariablen setzen
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Production Deployment
vercel --prod
```

### 5. Nach dem Deployment ✅

- [ ] Admin-Login testen (`/admin`)
- [ ] Test-Raum erstellen
- [ ] Spiel-Session testen
- [ ] Feedback-System testen (Nachricht + Selfie)
- [ ] Inbox überprüfen

## 🔒 Sicherheits-Setup

### Row Level Security (RLS)

Alle Policies sind im Migrations-Skript enthalten. Wichtigste Schutzmaßnahmen:

✅ **Rooms**: Nur Room-Besitzer können ihre Räume ändern/löschen
✅ **Messages**: Nur Room-Besitzer sieht Nachrichten seiner Räume
✅ **Admin**: Middleware prüft Server-seitig die Admin-Rolle
✅ **Storage**: Public read, authenticated upload

### Admin-Rolle setzen

Nach dem ersten Login:

1. Finde deine User-ID im Supabase Dashboard (Authentication → Users)
2. Führe aus:

```sql
-- Ersetze YOUR_USER_ID_HERE mit deiner tatsächlichen ID
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = 'YOUR_USER_ID_HERE';
```

3. Logout + Login
4. Gehe zu `/admin` - sollte jetzt funktionieren

## 🛠 Manuelle Deployment-Alternative

Wenn du nicht Vercel nutzen möchtest:

```bash
# Production Build
npm run build

# Production Server starten
npm run start
```

**Port konfigurieren:**
```bash
PORT=3000 npm run start
```

## 📝 TypeScript Types aktualisieren

Nach Änderungen am Supabase-Schema:

```bash
npx supabase gen types typescript \
  --project-id "dein-projekt-id" \
  --schema public \
  > types/database.ts
```

## 🐛 Häufige Probleme

### Build-Fehler: TypeScript Errors

Aktuell sind TypeScript-Errors im Build ignoriert (`ignoreBuildErrors: true`).

**Für Production empfohlen:**
1. Alle TypeScript-Fehler fixen
2. `ignoreBuildErrors: false` in `next.config.ts` setzen

### Storage Upload schlägt fehl

**Checke:**
1. ✅ Bucket existiert?
2. ✅ Bucket ist public?
3. ✅ Upload-Policy vorhanden?
4. ✅ Datei-Größe unter Limit?

### Admin-Seite nicht erreichbar

**Checke:**
1. ✅ Middleware deployed? (sollte automatisch sein)
2. ✅ Admin-Rolle in User Metadata gesetzt?
3. ✅ Logout + Login durchgeführt?

### Nachrichten in Inbox nicht sichtbar

**Fix:**
```sql
-- Setze created_by für bestehende Räume
UPDATE rooms
SET created_by = 'DEINE_USER_ID'
WHERE created_by IS NULL;
```

## 📊 Performance Monitoring

Nach dem Deployment empfohlen:

- [ ] Vercel Analytics aktivieren
- [ ] Supabase Dashboard → Logs überwachen
- [ ] Browser DevTools → Network Tab checken
- [ ] Lighthouse Score prüfen

## 🔄 Updates deployen

```bash
# Lokale Änderungen committen
git add .
git commit -m "Beschreibung"
git push

# Vercel deployed automatisch bei push zu main
# Oder manuell:
vercel --prod
```

## 📞 Support

Bei Problemen:
1. Supabase Logs checken (Dashboard → Logs)
2. Vercel Logs checken (Deployment → Logs)
3. Browser Console für Client-Fehler

---

**Deployment erfolgreich? 🎉 Viel Spaß mit der Plattform!**
