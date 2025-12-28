# 🔒 Security Documentation

Sicherheits-Dokumentation für die Grüße Dana Plattform.

## 🛡️ Übersicht

Die Plattform nutzt mehrere Sicherheitsebenen:

1. **Row Level Security (RLS)** - Datenbank-Ebene
2. **Server-side Middleware** - Route-Schutz
3. **Supabase Auth** - Authentifizierung
4. **Storage Policies** - Datei-Upload Schutz

## 🔐 Row Level Security (RLS)

Alle Supabase-Tabellen haben aktivierte RLS-Policies.

### Rooms Table

✅ **Public Read**: Jeder kann aktive Räume sehen
```sql
CREATE POLICY "Public can view active rooms"
  ON rooms FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
```

✅ **Owner/Admin Write**: Nur Besitzer oder Admins können updaten/löschen
```sql
CREATE POLICY "Only room owner can update rooms"
  ON rooms FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
```

### Player Messages Table

✅ **Restricted Read**: Nur Room-Besitzer sieht Nachrichten
```sql
CREATE POLICY "Only room owner can read messages"
  ON player_messages FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );
```

✅ **Public Insert**: Spieler können Nachrichten senden
```sql
CREATE POLICY "Players can insert messages"
  ON player_messages FOR INSERT
  WITH CHECK (true);
```

### Game Sessions & Players

✅ **Public Read**: Für Multiplayer-Synchronisation
✅ **Host Control**: Nur Host kann Session updaten
✅ **Player Self-Update**: Spieler können sich selbst updaten

## 🚪 Middleware Protection

Server-side Route-Schutz für Admin-Bereich.

**Datei**: `middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in -> redirect to login
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Logged in but not admin -> redirect to home
  if (user && !isLoginPage) {
    const role = user.user_metadata?.role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}
```

**Schutz:**
- ✅ Nicht eingeloggt → Login-Seite
- ✅ Eingeloggt aber kein Admin → Homepage
- ✅ Admin → Zugriff erlaubt

**Wichtig**: Middleware läuft auf dem Server, kann NICHT von Client manipuliert werden!

## 👤 Admin-Rolle

Admin-Rolle wird in Supabase User Metadata gespeichert.

### Admin-Rolle setzen

```sql
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = 'YOUR_USER_ID_HERE';
```

### Admin-Rolle prüfen (Client)

```typescript
const { data: { user } } = await supabase.auth.getUser()
const isAdmin = user?.user_metadata?.role === 'admin'
```

### Admin-Rolle prüfen (Server/Middleware)

```typescript
const role = user.user_metadata?.role
if (role !== 'admin') {
  // Nicht autorisiert
}
```

## 📦 Storage Security

### player-selfies Bucket

**Public Read, Authenticated Upload**

```sql
-- Upload Policy
CREATE POLICY "Authenticated users can upload selfies"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'player-selfies');

-- Read Policy
CREATE POLICY "Public can view selfies"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'player-selfies');
```

**Einstellungen:**
- ✅ Public Bucket
- ✅ 5MB File Size Limit
- ✅ MIME Types: image/jpeg, image/png, image/webp

## 🚨 Bekannte Sicherheitslücken (behoben)

### ❌ Alte Version: Zu offene RLS Policies

**Problem**: Jeder konnte alles lesen/schreiben
```sql
-- ❌ NICHT SICHER
CREATE POLICY "Anyone can manage" ON table
  FOR ALL USING (true);
```

**Fix**: Spezifische Policies pro Tabelle (siehe oben)

### ❌ Alte Version: Nur Client-side Admin-Check

**Problem**: Admin-Check nur im Frontend
```typescript
// ❌ NICHT SICHER - kann umgangen werden
if (!isAdmin) return <div>Not authorized</div>
```

**Fix**: Server-side Middleware (siehe oben)

## ✅ Best Practices

### Environment Variables

✅ **Niemals Service Role Key im Client verwenden**
- Nur Anon Key im Frontend
- Service Role Key nur in Server Actions/API Routes

✅ **Environment Variables Checkliste**
```env
# ✅ Public-safe (durch RLS geschützt)
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# ❌ NIE im Client verwenden!
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### API Routes

✅ **Immer User verifizieren**
```typescript
export async function POST(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Weiter mit Logik...
}
```

### Client-side

✅ **Nie sensitive Daten im Client speichern**
- Keine Passwörter
- Keine API Keys
- Keine User IDs von anderen Usern

✅ **Immer Server Components für sensitive Operationen**
```typescript
// ✅ Server Component
export default async function AdminPage() {
  const supabase = createServerClient()
  // Sicher: läuft auf Server
}

// ❌ Client Component für Admin-Logik
'use client'
export default function AdminPage() {
  // Unsicher: kann manipuliert werden
}
```

## 🔍 Security Testing

### Vor Deployment testen:

1. **RLS Policies**:
   - [ ] Als unauthenticated User: Kann keine Admin-Daten sehen?
   - [ ] Als normaler User: Kann nur eigene Daten sehen?
   - [ ] Als Admin: Kann alles sehen?

2. **Middleware**:
   - [ ] `/admin` ohne Login → Redirect zu Login?
   - [ ] `/admin` als normaler User → Redirect zu Home?
   - [ ] `/admin` als Admin → Zugriff erlaubt?

3. **Storage**:
   - [ ] Upload als unauthenticated → Fehler?
   - [ ] Upload als authenticated → Erfolg?
   - [ ] Download als public → Erfolg?

4. **Messages**:
   - [ ] Andere User's Messages lesbar? → NEIN
   - [ ] Eigene Room Messages lesbar? → JA

## 📊 Security Monitoring

Überwache regelmäßig:

- **Supabase Dashboard → Logs**: Verdächtige Queries?
- **Supabase Dashboard → Auth**: Ungewöhnliche Logins?
- **Supabase Dashboard → Storage**: Ungewöhnliche Uploads?

## 🆘 Im Notfall

### Kompromittierte Credentials

1. **Sofort** neue Supabase Keys generieren
2. Environment Variables updaten (lokal + Vercel)
3. Deployment neu starten
4. Alle aktiven Sessions invalidieren

### Verdächtige Aktivität

1. Supabase Logs checken
2. User sperren (Supabase Dashboard → Auth)
3. RLS Policies überprüfen
4. Bei Bedarf: Tabellen temporär sperren

---

**Sicherheit ist wichtig! Bei Fragen → Supabase Docs konsultieren**
