-- DEBUG_019: VERIFICA STRUTTURA TABELLA PROFILES
-- Data: 2025-08-25
-- Scopo: Controllare struttura tabella profiles per correggere POPULATE_018

-- =============================================================================
-- 1. VERIFICA STRUTTURA TABELLA PROFILES
-- =============================================================================

-- Mostra tutte le colonne della tabella profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- =============================================================================
-- 2. MOSTRA CONSTRAINT E VINCOLI
-- =============================================================================

-- Mostra primary key e foreign key
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
ORDER BY tc.constraint_type, kcu.ordinal_position;

-- =============================================================================
-- 3. MOSTRA ALCUNI RECORD ESISTENTI (SE CI SONO)
-- =============================================================================

SELECT 
  'SAMPLE PROFILES' as tipo,
  *
FROM profiles 
LIMIT 5;