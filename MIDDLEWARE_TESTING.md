# 🛡️ Admin Middleware - Testing Guide

## Was wurde implementiert?

### ✅ Server-seitige Admin-Schutz

Die neue Middleware schützt **alle `/admin/*` Routes** auf Server-Level:

- **[middleware.ts](middleware.ts)** - Root-Level Middleware
- **[app/admin/page.tsx](app/admin/page.tsx)** - Updated Admin Page

---

## 🔒 Wie funktioniert es?

### Ablauf:

```
User Request → Middleware → Security Checks → Page/Redirect
```

### Security Checks:

1. **Authentication Check**
   - Ist der User eingeloggt?
   - Cookie vorhanden und valide?

2. **Authorization Check** (nur für Sub-Routes)
   - Hat der User `role: 'admin'` in user_metadata?
   - Falls NEIN → Redirect zu `/`

3. **Route Exceptions**
   - `/admin` (Login Page) → Erlaubt für alle
   - `/admin/*` (Sub-Routes) → Nur für Admins

---

## 🧪 Testing Szenarien

### Test 1: Nicht eingeloggt → `/admin` aufrufen

**Erwartung:** ✅ Login-Seite wird angezeigt

```bash
# Im Browser:
# 1. Logout (falls eingeloggt)
# 2. Gehe zu http://localhost:3001/admin
# 3. Du solltest die Login-Seite sehen
```

---

### Test 2: Eingeloggt als Admin → `/admin` aufrufen

**Erwartung:** ✅ Admin Dashboard wird angezeigt

```bash
# Im Browser:
# 1. Login mit deinem Admin-Account
# 2. Gehe zu http://localhost:3001/admin
# 3. Du solltest das Dashboard sehen mit allen Rooms
```

---

### Test 3: Eingeloggt ohne Admin-Rolle → `/admin` aufrufen

**Erwartung:** ✅ Redirect zu Homepage (`/`)

```bash
# Simuliere einen Non-Admin User:
# 1. Erstelle einen zweiten User in Supabase (OHNE role: admin)
# 2. Login mit diesem User
# 3. Gehe zu http://localhost:3001/admin
# 4. Du solltest automatisch zu "/" redirected werden
```

**SQL zum Testen (Supabase SQL Editor):**
```sql
-- Erstelle Test-User ohne Admin-Rolle
-- (Mache das über Supabase Auth UI)

-- Überprüfe User Metadata
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users;

-- Sollte zeigen:
-- admin@example.com  | admin
-- test@example.com   | null  (oder nicht vorhanden)
```

---

### Test 4: Direct URL zu Sub-Route ohne Login

**Erwartung:** ✅ Redirect zu `/admin` (Login)

```bash
# Im Browser (ausgeloggt):
# 1. Logout
# 2. Versuche direkt: http://localhost:3001/admin/rooms
# 3. Sollte zu /admin redirecten (Login-Seite)
```

---

### Test 5: Middleware Performance

**Erwartung:** ✅ Keine spürbare Verzögerung

```bash
# Dev Tools öffnen → Network Tab
# 1. Gehe zu /admin
# 2. Prüfe Response Time
# 3. Middleware sollte < 100ms sein
```

---

## 🔍 Debugging

### Middleware läuft nicht?

Prüfe ob `middleware.ts` im **Root-Level** liegt (nicht in `/app`):

```bash
ls -la middleware.ts
# Sollte im Root sein: /Users/dam/dev/grtngs.dana/middleware.ts
```

### Middleware läuft, aber prüft nicht?

Prüfe den `matcher` in `middleware.ts`:

```typescript
export const config = {
  matcher: '/admin/:path*'  // ✅ Alle /admin/* Routes
}
```

### User hat Admin-Rolle, wird aber redirected?

Prüfe User Metadata in Supabase:

```sql
SELECT
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as extracted_role
FROM auth.users
WHERE email = 'DEINE-EMAIL';

-- extracted_role sollte "admin" sein
```

### Cookies werden nicht gesetzt?

Prüfe `.env.local`:

```bash
cat .env.local | grep SUPABASE
# Beide müssen gesetzt sein:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🛠️ Entwicklung

### Middleware temporär deaktivieren

Falls du die Middleware während Development ausschalten willst:

```typescript
// middleware.ts - TEMPORÄR zum Testen
export async function middleware(request: NextRequest) {
  // TEMP: Middleware deaktiviert
  return NextResponse.next()
}
```

**⚠️ NICHT in Production deployen!**

---

## 📊 Security Verbesserung

### Vorher:
```typescript
// ❌ Nur Client-seitige Checks
if (!user) return <AdminLogin />
// Kann mit DevTools umgangen werden!
```

### Nachher:
```typescript
// ✅ Server-seitige Middleware
// Läuft BEVOR Page gerendert wird
// Nicht umgehbar durch Client-Manipulation
if (!user) redirect('/admin')
if (role !== 'admin') redirect('/')
```

---

## ✅ Checklist vor Production

- [ ] Middleware läuft lokal
- [ ] Test 1 bestanden (nicht eingeloggt)
- [ ] Test 2 bestanden (Admin eingeloggt)
- [ ] Test 3 bestanden (Non-Admin redirected)
- [ ] Test 4 bestanden (Direct URL blocked)
- [ ] User Metadata `role: admin` gesetzt
- [ ] `.env.local` Variablen in Vercel gesetzt
- [ ] Middleware in Git committed

---

## 🚀 Production Deployment

### Vercel Environment Variables

Stelle sicher dass in Vercel folgende Variablen gesetzt sind:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Die Middleware nutzt diese automatisch.

---

## 💡 Nächste Schritte

Nach der Middleware kannst du noch:

1. [ ] Rate Limiting hinzufügen (Vercel Edge Config)
2. [ ] Audit Logging (wer hat was wann gemacht)
3. [ ] Session Timeout (Auto-Logout nach X Minuten)
4. [ ] 2FA für Admin-Accounts

---

**Status:** ✅ Middleware implementiert und ready for testing!
**Zeit:** ~10 Minuten
**Security Level:** 🔒🔒🔒 HOCH
