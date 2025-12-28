-- =====================================================
-- ADMIN ROLLE SETZEN
-- =====================================================
-- Dieses Script setzt die Admin-Rolle für deinen User
-- WICHTIG: Ersetze 'DEINE-EMAIL@EXAMPLE.COM' mit deiner echten Email!

-- Schritt 1: Zeige alle User an (um deine Email zu finden)
SELECT id, email, raw_user_meta_data
FROM auth.users;

-- Schritt 2: Setze Admin-Rolle für deinen User
-- ⚠️ ÄNDERE DIE EMAIL HIER:
UPDATE auth.users
SET raw_user_meta_data =
  CASE
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email = 'DEINE-EMAIL@EXAMPLE.COM';  -- ⚠️ HIER DEINE EMAIL EINTRAGEN!

-- Schritt 3: Überprüfe ob es funktioniert hat
SELECT
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as extracted_role
FROM auth.users
WHERE email = 'DEINE-EMAIL@EXAMPLE.COM';  -- ⚠️ HIER DEINE EMAIL EINTRAGEN!

-- Sollte jetzt in extracted_role "admin" stehen!
