-- CHECK_011: Verification of Successful Folder Tags Implementation
-- Data: 2025-08-25
-- Descrizione: Verifica che il tag "test" sia stato salvato correttamente nella cartella 20250824_c
-- Status: SUCCESS VERIFICATION dopo fix completo

-- =============================================================================
-- 1. VERIFICA TAG NELLA CARTELLA SPECIFICA
-- =============================================================================

-- Query 1: Verifica tag nella cartella 20250824_c (dovrebbe mostrare "test")
SELECT 
    id,
    name,
    is_folder,
    tags,
    array_length(tags, 1) as tags_count,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_since_update
FROM saved_views 
WHERE name = '20250824_c' 
    AND is_folder = true;

-- =============================================================================
-- 2. VERIFICA TUTTE LE CARTELLE CON TAG APPLICATI DI RECENTE
-- =============================================================================

-- Query 2: Tutte le cartelle modificate nelle ultime 2 ore con tags
SELECT 
    id,
    name,
    is_folder,
    tags,
    array_length(tags, 1) as tags_count,
    updated_at,
    ROUND(EXTRACT(EPOCH FROM (NOW() - updated_at))/60) as minutes_ago
FROM saved_views 
WHERE is_folder = true 
    AND updated_at > NOW() - INTERVAL '2 hours'
    AND (tags IS NOT NULL AND array_length(tags, 1) > 0)
ORDER BY updated_at DESC;

-- =============================================================================
-- 3. CONFRONTO PRIMA/DOPO IL FIX
-- =============================================================================

-- Query 3: Confronto timestamps per vedere l'evoluzione
SELECT 
    name,
    tags,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > created_at + INTERVAL '1 minute' THEN 'MODIFIED'
        ELSE 'ORIGINAL'
    END as modification_status
FROM saved_views 
WHERE name = '20250824_c' 
    AND is_folder = true;

-- =============================================================================
-- 4. STATISTICHE COMPLETE SISTEMA TAG CARTELLE
-- =============================================================================

-- Query 4: Statistiche complete sistema tag per cartelle
SELECT 
    'TOTAL_FOLDERS' as metric,
    COUNT(*) as value
FROM saved_views 
WHERE is_folder = true

UNION ALL

SELECT 
    'FOLDERS_WITH_TAGS' as metric,
    COUNT(*) as value
FROM saved_views 
WHERE is_folder = true 
    AND tags IS NOT NULL 
    AND array_length(tags, 1) > 0

UNION ALL

SELECT 
    'TOTAL_FOLDER_TAGS' as metric,
    SUM(array_length(tags, 1)) as value
FROM saved_views 
WHERE is_folder = true 
    AND tags IS NOT NULL;

-- =============================================================================
-- 5. VERIFICA FUNZIONALITÀ BULK OPERATIONS
-- =============================================================================

-- Query 5: Preparazione per test bulk operations
-- Mostra struttura per testare le frecce ↓/↑
SELECT 
    folder.id as folder_id,
    folder.name as folder_name,
    folder.tags as folder_tags,
    COUNT(views.id) as views_in_folder
FROM saved_views folder
LEFT JOIN saved_views views ON views.parent_folder_id = folder.id
WHERE folder.is_folder = true
    AND folder.name = '20250824_c'
GROUP BY folder.id, folder.name, folder.tags;

-- =============================================================================
-- 6. SUCCESS CONFIRMATION
-- =============================================================================

-- Query 6: Confirmation finale del successo
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM saved_views 
            WHERE name = '20250824_c' 
                AND is_folder = true 
                AND 'test' = ANY(tags)
        ) THEN '✅ SUCCESS: Tag "test" salvato correttamente nella cartella 20250824_c'
        ELSE '❌ FAIL: Tag "test" NON trovato nella cartella'
    END as final_verification;

-- Fine CHECK_011