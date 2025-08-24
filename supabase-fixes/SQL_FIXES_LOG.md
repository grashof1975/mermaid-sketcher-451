# Database Fixes & SQL Commands Log

Questo documento contiene tutti i comandi SQL necessari per correggere i problemi del database e un log dettagliato delle modifiche.

## 📋 Quick Fix Commands

### 1. Aumentare Limite Zoom (✅ APPLICATO)

```sql
-- Remove existing zoom constraints
ALTER TABLE saved_views 
DROP CONSTRAINT IF EXISTS saved_views_zoom_level_check;

ALTER TABLE provisional_views 
DROP CONSTRAINT IF EXISTS provisional_views_zoom_level_check;

-- Add new constraints allowing zoom from 0.1x to 20.0x
ALTER TABLE saved_views 
ADD CONSTRAINT saved_views_zoom_level_check 
CHECK (zoom_level >= 0.1 AND zoom_level <= 20.0);

ALTER TABLE provisional_views 
ADD CONSTRAINT provisional_views_zoom_level_check 
CHECK (zoom_level >= 0.1 AND zoom_level <= 20.0);

-- Update column comments for documentation
COMMENT ON COLUMN saved_views.zoom_level IS 'Zoom level from 0.1x (10%) to 20.0x (2000%)';
COMMENT ON COLUMN provisional_views.zoom_level IS 'Zoom level from 0.1x (10%) to 20.0x (2000%)';
```

**Status**: ✅ Applicato - zoom ora funziona fino a 20x

---

### 2. Correggere Foreign Key Comments (❌ DA APPLICARE)

**PROBLEMA ATTUALE**: 
```
Could not find a relationship between 'comments' and 'user_id' in the schema cache
```

**SOLUZIONE COMPLETA**:

```sql
-- Step 1: Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    toast_notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

-- Step 4: Fix foreign key constraint for comments
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Create helper function for user profiles
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE(id UUID, email TEXT, username TEXT)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(p.username, split_part(u.email, '@', 1)) as username
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.id = user_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;

-- Step 6: Create view for comments with user info
CREATE OR REPLACE VIEW public.comments_with_user AS
SELECT 
  c.*,
  COALESCE(p.username, split_part(u.email, '@', 1)) as username,
  p.avatar_url
FROM public.comments c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN public.profiles p ON c.user_id = p.id;

GRANT SELECT ON public.comments_with_user TO authenticated;

-- Step 7: Update RLS policy for comments
DROP POLICY IF EXISTS "Users manage own comments" ON public.comments;
CREATE POLICY "Users manage own comments" 
ON public.comments 
FOR ALL 
USING (auth.uid() = user_id);
```

**Status**: ❌ DA APPLICARE URGENTEMENTE

---

### 3. Verifica Foreign Key Esistenti (DIAGNOSTICA)

```sql
-- Check existing foreign keys on comments table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'comments'
    AND tc.table_schema = 'public';

-- Check if auth.users table is accessible
SELECT id, email FROM auth.users LIMIT 1;

-- Check if profiles table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
);
```

---

## 🗃️ STORICO APPLICAZIONI SQL

### 📋 Procedura Sistematica
1. **Identifica problema** nel codice/console
2. **Crea SQL fix** con codice identificativo `APPLY_XXX`
3. **Testa in Supabase** SQL Editor
4. **Se nessun errore**: marca come ✅ APPLICATO
5. **Aggiorna log** con timestamp e risultato
6. **Testa funzionalità** nel frontend

---

### APPLY_001 - Aumento Limite Zoom ✅ APPLICATO
**Data**: 2025-08-22  
**Problema**: Zoom level limitato a 5.0x, errore constraint violation  
**Obiettivo**: Aumentare limite a 20.0x per zoom 1100%  

```sql
-- APPLY_001: Increase zoom limit
ALTER TABLE saved_views DROP CONSTRAINT IF EXISTS saved_views_zoom_level_check;
ALTER TABLE provisional_views DROP CONSTRAINT IF EXISTS provisional_views_zoom_level_check;
ALTER TABLE saved_views ADD CONSTRAINT saved_views_zoom_level_check CHECK (zoom_level >= 0.1 AND zoom_level <= 20.0);
ALTER TABLE provisional_views ADD CONSTRAINT provisional_views_zoom_level_check CHECK (zoom_level >= 0.1 AND zoom_level <= 20.0);
```

**Risultato**: ✅ SUCCESSO - Nessun errore in SQL Editor  
**Test Frontend**: ✅ Zoom ora accetta valori fino a 20.0x  
**Status**: COMPLETATO

---

### APPLY_002 - Fix Foreign Key Comments ✅ APPLICATO
**Data**: 2025-08-22  
**Problema**: `Could not find a relationship between 'comments' and 'user_id'`  
**Obiettivo**: Correggere foreign key constraints per tabella comments  

```sql
-- APPLY_002: Fix comments foreign key
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    toast_notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE(id UUID, email TEXT, username TEXT)
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT u.id, u.email::TEXT, COALESCE(p.username, split_part(u.email, '@', 1)) as username
  FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE u.id = user_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;

CREATE OR REPLACE VIEW public.comments_with_user AS
SELECT c.*, COALESCE(p.username, split_part(u.email, '@', 1)) as username, p.avatar_url
FROM public.comments c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN public.profiles p ON c.user_id = p.id;

GRANT SELECT ON public.comments_with_user TO authenticated;

DROP POLICY IF EXISTS "Users manage own comments" ON public.comments;
CREATE POLICY "Users manage own comments" ON public.comments FOR ALL USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
```

**Risultato**: ✅ SUCCESSO - Nessun errore in SQL Editor  
**Test Frontend**: ❌ FALLITO - Comments API ancora errore 400  
**Status**: APPLICATO MA NON FUNZIONA - Serve ulteriore debug

---

### APPLY_003 - Debug Comment Creation Issues ✅ APPLICATO
**Data**: 2025-08-22  
**Problema**: Comments API restituisce errore 400, possibile problema RLS policies  
**Obiettivo**: Semplificare RLS e verificare inserimenti diretti  

```sql
-- APPLY_003: Diagnose and fix comment insertion
-- First, check what's in the comments table
SELECT * FROM public.comments LIMIT 5;

-- Check RLS policies on comments
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'comments';

-- Temporarily disable RLS for testing (CAREFUL!)
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

-- If that works, we'll create a simpler policy
DROP POLICY IF EXISTS "Users manage own comments" ON public.comments;

CREATE POLICY "Users can insert own comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own comments" 
ON public.comments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
```

**Risultato**: ✅ SUCCESSO - Nessun errore in SQL Editor  
**Test Frontend**: ✅ SUCCESSO - Commenti ora salvati correttamente!  
**Status**: COMPLETATO

---

### APPLY_004 - Sharing System Complete ✅ APPLICATO
**Data**: 2025-08-23  
**Problema**: Implementare sistema completo condivisione diagrammi  
**Obiettivo**: Schema database per inviti, link pubblici e audit trail

```sql
-- APPLY_004: SHARING SYSTEM - Database Schema per Condivisione Diagrammi
-- Data: 2025-08-23
-- Descrizione: Implementazione completa sistema condivisione con privilegi granulari

-- 1. TABELLA CONDIVISIONI DIAGRAMMI
CREATE TABLE IF NOT EXISTS diagram_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('viewer', 'commenter', 'editor')),
  invited_by UUID REFERENCES auth.users(id),
  invitation_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(diagram_id, shared_with_id)
);

-- 2. TABELLA LINK PUBBLICI
CREATE TABLE IF NOT EXISTS public_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  is_active BOOLEAN DEFAULT true,
  allow_comments BOOLEAN DEFAULT false,
  password_protected BOOLEAN DEFAULT false,
  access_password TEXT,
  view_count INTEGER DEFAULT 0,
  unique_visitors JSONB DEFAULT '[]',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- 3. TABELLA ATTIVITÀ CONDIVISIONE (Audit Log)
CREATE TABLE IF NOT EXISTS sharing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'invited_user', 'accepted_invite', 'declined_invite', 'removed_user',
    'permission_changed', 'link_created', 'link_revoked', 'public_access'
  )),
  target_user_id UUID REFERENCES auth.users(id),
  old_permission TEXT,
  new_permission TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ESTENSIONE TABELLA DIAGRAMMI
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS sharing_enabled BOOLEAN DEFAULT true;
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS default_share_permission TEXT DEFAULT 'viewer' 
  CHECK (default_share_permission IN ('viewer', 'commenter', 'editor'));

-- 5. RLS POLICIES
CREATE POLICY "Users can view shares for their diagrams" ON diagram_shares FOR SELECT 
USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Owners can manage all shares" ON diagram_shares FOR ALL
USING (owner_id = auth.uid());

CREATE POLICY "Users can respond to their invites" ON diagram_shares FOR UPDATE
USING (shared_with_id = auth.uid());

CREATE POLICY "Owners manage public links" ON public_share_links FOR ALL
USING (created_by = auth.uid());

CREATE POLICY "Users see activities for their diagrams" ON sharing_activities FOR SELECT
USING (
  diagram_id IN (
    SELECT id FROM diagrams WHERE user_id = auth.uid()
    UNION
    SELECT diagram_id FROM diagram_shares WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

-- 6. INDICI PER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_diagram_shares_diagram_id ON diagram_shares(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_shares_shared_with ON diagram_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_diagram_shares_status ON diagram_shares(status);
CREATE INDEX IF NOT EXISTS idx_public_share_links_token ON public_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_public_share_links_diagram ON public_share_links(diagram_id);
CREATE INDEX IF NOT EXISTS idx_sharing_activities_diagram ON sharing_activities(diagram_id);

-- 7. FUNZIONI UTILITY
CREATE OR REPLACE FUNCTION get_user_diagram_permission(p_diagram_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM diagrams WHERE id = p_diagram_id AND user_id = p_user_id) THEN
    RETURN 'owner';
  END IF;
  
  RETURN (
    SELECT permission_level 
    FROM diagram_shares 
    WHERE diagram_id = p_diagram_id AND shared_with_id = p_user_id AND status = 'accepted'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_sharing_activity(
  p_diagram_id UUID,
  p_activity_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_old_permission TEXT DEFAULT NULL,
  p_new_permission TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO sharing_activities (
    diagram_id, user_id, activity_type, target_user_id,
    old_permission, new_permission, metadata
  )
  VALUES (
    p_diagram_id, auth.uid(), p_activity_type, p_target_user_id,
    p_old_permission, p_new_permission, p_metadata
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ENABLE RLS
ALTER TABLE diagram_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_activities ENABLE ROW LEVEL SECURITY;
```

**Risultato**: ✅ SUCCESSO - Applicato senza errori in SQL Editor  
**Test Frontend**: ✅ TESTABILE - Tab Condivisione funzionante  
**Status**: COMPLETATO

**Note**: Schema completo per sistema condivisione implementato. Tabelle create:
- `diagram_shares` per inviti tra utenti
- `public_share_links` per link pubblici  
- `sharing_activities` per audit trail
- RLS policies e funzioni utility complete

**Note**: Soluzione frontend già implementata come backup. Questa migrazione garantisce integrità a livello database.

---

### APPLY_005B - Fix Definitivo Encoding Base64URL ✅ APPLICATO
**Data**: 2025-08-23  
**Problema**: APPLY_005 non aveva risolto completamente l'errore "base64url" - continuavano errori 22023  
**Obiettivo**: Fix definitivo dell'encoding per generazione token URL-safe

```sql
-- APPLY_005B: Fix definitivo base64url encoding error
-- Problema: PostgreSQL non riconosce encoding "base64url" - errore 22023
-- Soluzione: Modifica diretta del default della colonna esistente

-- 1. Rimuovi constraint esistente
ALTER TABLE public_share_links DROP CONSTRAINT public_share_links_share_token_key;

-- 2. Modifica SOLO il default della colonna esistente
ALTER TABLE public_share_links 
ALTER COLUMN share_token SET DEFAULT 
replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');

-- 3. Ripristina constraint con nome diverso
ALTER TABLE public_share_links 
ADD CONSTRAINT public_share_links_token_unique UNIQUE (share_token);

-- 4. Test: genera nuovo token per verificare
SELECT replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_') AS test_token;

-- 5. Riabilita RLS
ALTER TABLE public_share_links ENABLE ROW LEVEL SECURITY;
```

**Risultato**: ✅ SUCCESSO - Token URL-safe generato correttamente  
**Test Frontend**: ✅ SUCCESSO - Creazione link pubblici ora funziona!  
**Status**: COMPLETATO

**Note**: Fix risolve definitivamente l'errore "unrecognized encoding: base64url". Token generati correttamente in formato URL-safe.

---

### APPLY_006 - RLS Policies Accesso Pubblico Anonimo ✅ APPLICATO
**Data**: 2025-08-23  
**Problema**: Query getByToken fallisce con 400 - RLS blocca accesso anonimo ai link pubblici  
**Obiettivo**: Abilitare accesso pubblico anonimo per i link attivi senza autenticazione

```sql
-- APPLY_006: Fix RLS policies per accesso pubblico anonimo
-- Problema: Query getByToken fallisce con 400 - RLS blocca accesso anonimo

-- 1. Policy per accesso pubblico ai link attivi (senza auth)
CREATE POLICY "Public access to active links"
ON public_share_links FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- 2. Policy per accesso pubblico ai diagrammi condivisi (senza auth) 
CREATE POLICY "Public access to shared diagrams"
ON diagrams FOR SELECT
USING (
  id IN (
    SELECT diagram_id 
    FROM public_share_links 
    WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
  )
);

-- 3. Policy per accesso pubblico ai profili dei creatori (senza auth)
CREATE POLICY "Public access to creator profiles"
ON profiles FOR SELECT
USING (
  id IN (
    SELECT created_by 
    FROM public_share_links 
    WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
  )
);
```

**Risultato**: ✅ SUCCESSO - Policies create senza errori  
**Test Frontend**: ✅ SUCCESSO - Pagine pubbliche ora accessibili!  
**Status**: COMPLETATO

**Note**: Permette accesso pubblico anonimo ai diagrammi condivisi tramite link attivi. Query JOIN iniziali ancora problematiche ma risolte con query separate.

---

### Template per prossimi fix:
```
### APPLY_XXX - [Titolo Fix] ⏳ IN PREPARAZIONE
**Data**: YYYY-MM-DD  
**Problema**: [Descrizione errore]  
**Obiettivo**: [Cosa deve risolvere]  

```sql
-- APPLY_XXX: [Descrizione breve]
[Codice SQL qui]
```

**Risultato**: ⏳ IN ATTESA - Da applicare in SQL Editor  
**Test Frontend**: ⏳ PENDING  
**Status**: PREPARATO
```

---

## 📊 Changelog & Evolution Log

### 2025-08-22 - Implementazione Selezione Componenti

#### 🎯 Obiettivo
Implementare selezione interattiva dei componenti Mermaid con auto-zoom e salvataggio vista/commento.

#### ✅ Completato
1. **Selezione Componenti**: Click sui nodi per selezionarli
2. **Auto-zoom**: Centratura a 750% (7.5x) su componente selezionato
3. **Modal Pre-compilato**: Testo nodo + bullet point per commento
4. **Salvataggio Vista**: Funziona correttamente
5. **Gestione Errori**: Vista salvata anche se commento fallisce

#### ❌ Problemi Identificati

**1. Constraint Zoom Level** (RISOLTO ✅)
- **Errore**: `zoom_level` limitato a 5.0, cercavamo di salvare 11.0
- **Soluzione**: Migrazione per aumentare limite a 20.0x
- **Status**: Applicato e funzionante

**2. Foreign Key Comments** (IN CORSO ❌)
- **Errore**: `Could not find a relationship between 'comments' and 'user_id'`
- **Causa**: Missing/broken foreign key constraint
- **Impatto**: Viste salvate OK, commenti falliscono
- **Status**: Fix pronto, da applicare

#### 🔄 Workaround Attivi
- **Salvataggio Separato**: Vista e commento salvati indipendentemente
- **Toast Informativi**: User sa cosa è salvato e cosa no
- **No Rollback**: Vista rimane anche se commento fallisce

#### 📈 Metriche Performance
- **Zoom Level**: 7.5x (750%) - bilanciato tra dettaglio e visibilità
- **Centratura**: Algoritmo migliorato con coordinate SVG relative
- **Selezione**: Multi-strategy text extraction per vari tipi nodi

#### 🚀 Prossimi Steps
1. **PRIORITÀ 1**: Applicare fix foreign key comments
2. **PRIORITÀ 2**: Testare salvataggio completo vista+commento
3. **PRIORITÀ 3**: Ottimizzare algoritmo centratura se necessario

---

## 🛠️ Note Tecniche

### Database Schema Issues
- **Supabase PostgREST**: Difficoltà nel trovare relazioni `auth.users`
- **RLS Policies**: Potrebbero interferire con foreign key resolution
- **Schema Cache**: PostgREST potrebbe non aver aggiornato cache delle relazioni

### Frontend Mitigations
- **Error Separation**: Vista e commento gestiti indipendentemente
- **User Feedback**: Toast specifici per ogni scenario
- **Debug Logging**: Console logs per troubleshooting

### Zoom Algorithm
- **Target**: 7.5x per compromesso dettaglio/visibilità
- **Constraint DB**: Max 20.0x per futuro headroom
- **Centering**: Usa coordinate SVG per precisione

---

## 📞 Support Commands

```sql
-- Reset tutto se necessario
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.saved_views CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Poi ricreare da migrations esistenti
```

---

*Ultimo aggiornamento: 2025-08-22*  
*Mantieni questo documento aggiornato ad ogni fix/modifica!*