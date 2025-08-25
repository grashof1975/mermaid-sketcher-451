-- QUERY per verificare tag applicati alla cartella specifica
-- Data: 2025-08-25
-- Obiettivo: Verificare se i tag sono salvati nel database ma non visualizzati nel frontend

-- =============================================================================
-- 1. VERIFICA TAG CARTELLA SPECIFICA: 20250824_c
-- =============================================================================

-- Query specifica per la cartella 20250824_c
SELECT 
    id,
    name,
    is_folder,
    tags,
    array_length(tags, 1) as tags_count,
    created_at,
    updated_at
FROM saved_views 
WHERE name = '20250824_c' 
    AND is_folder = true;

-- =============================================================================
-- 2. VERIFICA TUTTE LE CARTELLE CON TAG NON VUOTI
-- =============================================================================

-- Mostra tutte le cartelle che hanno tag applicati
SELECT 
    id,
    name,
    is_folder,
    tags,
    array_length(tags, 1) as tags_count,
    updated_at
FROM saved_views 
WHERE is_folder = true 
    AND tags IS NOT NULL 
    AND array_length(tags, 1) > 0
ORDER BY updated_at DESC;

-- =============================================================================
-- 3. CONFRONTO CON DIAGRAMMI (FUNZIONANTI)
-- =============================================================================

-- Per confronto: mostra alcuni diagrammi con tag
SELECT 
    id,
    title,
    tags,
    array_length(tags, 1) as tags_count,
    updated_at
FROM diagrams 
WHERE tags IS NOT NULL 
    AND array_length(tags, 1) > 0
LIMIT 5;

-- =============================================================================
-- 4. LOG DELLE ULTIME MODIFICHE ALLE CARTELLE
-- =============================================================================

-- Mostra le cartelle modificate di recente (nelle ultime ore)
SELECT 
    id,
    name,
    is_folder,
    tags,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_since_update
FROM saved_views 
WHERE is_folder = true 
    AND updated_at > NOW() - INTERVAL '2 hours'
ORDER BY updated_at DESC;

-- =============================================================================
-- 5. TEST UPDATE MANUALE PER DEBUG
-- =============================================================================

-- Test update manuale per verificare se il database accetta modifiche
-- UNCOMMENT per testare:
/*
UPDATE saved_views 
SET tags = ARRAY['manual-test-tag', 'debug-tag']
WHERE name = '20250824_c' 
    AND is_folder = true;

-- Verifica il risultato del test
SELECT 
    name,
    tags,
    updated_at
FROM saved_views 
WHERE name = '20250824_c' 
    AND is_folder = true;
*/