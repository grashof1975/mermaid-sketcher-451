-- TEST_017: VERIFICA SCHEMA CONDIVISIONE VISTE INDIVIDUALI
-- Data: 2025-08-25
-- Scopo: Testare che il sistema di condivisione viste sia correttamente implementato
-- Test per: APPLY_016_VIEWS_SHARING_SYSTEM_PENDING.sql

-- =============================================================================
-- 1. VERIFICA ESISTENZA TABELLE
-- =============================================================================

-- Test 1: Verifica che le tabelle esistano
SELECT 
  'saved_views_shares' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'saved_views_shares'
  ) THEN '✅ ESISTENTE' ELSE '❌ MANCANTE' END as status
UNION ALL
SELECT 
  'public_view_links' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'public_view_links'
  ) THEN '✅ ESISTENTE' ELSE '❌ MANCANTE' END as status
UNION ALL
SELECT 
  'view_sharing_activities' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'view_sharing_activities'
  ) THEN '✅ ESISTENTE' ELSE '❌ MANCANTE' END as status;

-- =============================================================================
-- 2. VERIFICA STRUTTURA COLONNE
-- =============================================================================

-- Test 2: Verifica colonne della tabella saved_views_shares
SELECT 
  'SAVED_VIEWS_SHARES COLUMNS' as test_category,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'saved_views_shares'
ORDER BY ordinal_position;

-- Test 3: Verifica colonne della tabella public_view_links  
SELECT 
  'PUBLIC_VIEW_LINKS COLUMNS' as test_category,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'public_view_links'
ORDER BY ordinal_position;

-- Test 4: Verifica colonne della tabella view_sharing_activities
SELECT 
  'VIEW_SHARING_ACTIVITIES COLUMNS' as test_category,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'view_sharing_activities'
ORDER BY ordinal_position;

-- =============================================================================
-- 3. VERIFICA VINCOLI E CONSTRAINTS
-- =============================================================================

-- Test 5: Verifica CHECK constraints
SELECT 
  'CHECK CONSTRAINTS' as test_category,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
ORDER BY tc.table_name, tc.constraint_name;

-- Test 6: Verifica UNIQUE constraints
SELECT 
  'UNIQUE CONSTRAINTS' as test_category,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;

-- =============================================================================
-- 4. VERIFICA FOREIGN KEYS
-- =============================================================================

-- Test 7: Verifica FOREIGN KEY constraints
SELECT 
  'FOREIGN KEY CONSTRAINTS' as test_category,
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- 5. VERIFICA INDICI
-- =============================================================================

-- Test 8: Verifica indici creati per performance
SELECT 
  'INDEXES' as test_category,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
ORDER BY tablename, indexname;

-- =============================================================================
-- 6. VERIFICA RLS POLICIES
-- =============================================================================

-- Test 9: Verifica che RLS sia abilitato
SELECT 
  'ROW LEVEL SECURITY' as test_category,
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ ABILITATO' ELSE '❌ DISABILITATO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
ORDER BY tablename;

-- Test 10: Verifica policies RLS
SELECT 
  'RLS POLICIES' as test_category,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
ORDER BY tablename, policyname;

-- =============================================================================
-- 7. VERIFICA FUNZIONI
-- =============================================================================

-- Test 11: Verifica esistenza funzioni utility
SELECT 
  'FUNCTIONS' as test_category,
  routine_name,
  routine_type,
  CASE WHEN routine_name IS NOT NULL THEN '✅ ESISTENTE' ELSE '❌ MANCANTE' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_view_share_token', 'get_shared_views_for_user', 'log_view_share_activity')
ORDER BY routine_name;

-- =============================================================================
-- 8. VERIFICA TRIGGER
-- =============================================================================

-- Test 12: Verifica trigger di logging
SELECT 
  'TRIGGERS' as test_category,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- 9. TEST FUNZIONALE - GENERAZIONE TOKEN
-- =============================================================================

-- Test 13: Test funzione generazione token (deve generare token diversi)
SELECT 
  'TOKEN GENERATION TEST' as test_category,
  'Test 1' as test_name,
  generate_view_share_token() as generated_token
UNION ALL
SELECT 
  'TOKEN GENERATION TEST' as test_category,
  'Test 2' as test_name,
  generate_view_share_token() as generated_token
UNION ALL
SELECT 
  'TOKEN GENERATION TEST' as test_category,
  'Test 3' as test_name,
  generate_view_share_token() as generated_token;

-- =============================================================================
-- 10. RIEPILOGO FINALE
-- =============================================================================

-- Test 14: Riepilogo generale dello stato
SELECT 
  '📊 RIEPILOGO FINALE' as categoria,
  'Tabelle create' as elemento,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities'))::text || '/3' as status
UNION ALL
SELECT 
  '📊 RIEPILOGO FINALE' as categoria,
  'Funzioni create' as elemento,
  (SELECT COUNT(*) FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('generate_view_share_token', 'get_shared_views_for_user', 'log_view_share_activity'))::text || '/3' as status
UNION ALL
SELECT 
  '📊 RIEPILOGO FINALE' as categoria,
  'RLS abilitato' as elemento,
  (SELECT COUNT(*) FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities')
   AND rowsecurity = true)::text || '/3' as status
UNION ALL
SELECT 
  '📊 RIEPILOGO FINALE' as categoria,
  'Policies create' as elemento,
  (SELECT COUNT(*) FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN ('saved_views_shares', 'public_view_links', 'view_sharing_activities'))::text as status;

-- =============================================================================
-- CONCLUSIONI: 
-- Se tutti i test mostrano ✅ ESISTENTE/ABILITATO, il sistema è pronto
-- Se qualche test mostra ❌, verificare l'applicazione di APPLY_016
-- =============================================================================