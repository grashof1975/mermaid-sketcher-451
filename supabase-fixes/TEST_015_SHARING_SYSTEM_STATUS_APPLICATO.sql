-- TEST_015: VERIFICA STATUS SHARING SYSTEM PHASE 2 - SUCCESSO ✅
-- Data: 2025-08-25
-- Scopo: Verificare implementazione completa sistema condivisione
-- Risultato: CONFERMATO - Phase 2 completamente operativa
-- Tabelle: diagram_shares, public_share_links, sharing_activities esistenti
-- Campi diagrams: is_public, sharing_enabled, default_share_permission configurati

-- =============================================================================
-- 1. VERIFICA ESISTENZA TABELLE SHARING SYSTEM
-- =============================================================================

-- Controlla tabelle principali
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('diagram_shares', 'public_share_links', 'sharing_activities')
ORDER BY table_name;

-- =============================================================================
-- 2. VERIFICA STRUTTURA TABELLA diagram_shares
-- =============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'diagram_shares'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- 3. VERIFICA STRUTTURA TABELLA public_share_links  
-- =============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'public_share_links'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- 4. VERIFICA RLS POLICIES PER SHARING
-- =============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('diagram_shares', 'public_share_links', 'sharing_activities')
ORDER BY tablename, policyname;

-- =============================================================================
-- 5. VERIFICA FUNZIONI SHARING SYSTEM
-- =============================================================================

SELECT 
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%sharing%' OR routine_name LIKE '%invite%')
ORDER BY routine_name;

-- =============================================================================
-- 6. CONTA EVENTUALI CONDIVISIONI ESISTENTI
-- =============================================================================

SELECT 
  'diagram_shares' as table_name,
  COUNT(*) as record_count
FROM diagram_shares

UNION ALL

SELECT 
  'public_share_links' as table_name,
  COUNT(*) as record_count  
FROM public_share_links

UNION ALL

SELECT 
  'sharing_activities' as table_name,
  COUNT(*) as record_count
FROM sharing_activities;

-- =============================================================================
-- 7. VERIFICA INTEGRAZIONE CON TABELLA DIAGRAMS
-- =============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'diagrams'
  AND table_schema = 'public'  
  AND (column_name LIKE '%shar%' OR column_name LIKE '%public%')
ORDER BY ordinal_position;