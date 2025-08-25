-- APPLY_009: Diagnostic Folder Tags System
-- Data: 2025-08-25
-- Descrizione: Diagnostica problema "Impossibile aggiornare i tag della cartella"
-- Obiettivo: Identificare root cause dell'errore update tags per cartelle

-- =============================================================================
-- 1. VERIFICA SCHEMA SAVED_VIEWS - CAMPO TAGS
-- =============================================================================

-- Controlla se il campo 'tags' esiste nella tabella saved_views
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'saved_views' 
    AND table_schema = 'public'
    AND column_name = 'tags';

-- Se non esiste, mostra tutti i campi per verificare la struttura completa
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'saved_views' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- 2. VERIFICA ESISTENZA CARTELLE NEL DATABASE
-- =============================================================================

-- Cerca cartelle esistenti (is_folder = true)
SELECT 
    id,
    name,
    is_folder,
    tags,
    user_id,
    created_at
FROM saved_views 
WHERE is_folder = true 
LIMIT 10;

-- Conta totale cartelle vs viste
SELECT 
    is_folder,
    COUNT(*) as count
FROM saved_views 
GROUP BY is_folder;

-- =============================================================================  
-- 3. TEST UPDATE TAGS SU CARTELLA SPECIFICA
-- =============================================================================

-- Prima prova a creare una cartella test se non esiste
DO $$
DECLARE
    test_folder_id UUID;
    current_user_id UUID;
BEGIN
    -- Ottieni current user (sostituire con UUID reale se necessario)
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'ATTENZIONE: Nessun utente autenticato. Usa UUID manuale per test.';
        -- current_user_id := 'f6c4da3e-7c23-4d5b-9a2f-1e8d4b7c9f0a'; -- UUID esempio
    END IF;
    
    -- Cerca cartella esistente o creane una
    SELECT id INTO test_folder_id
    FROM saved_views 
    WHERE is_folder = true 
        AND user_id = current_user_id
    LIMIT 1;
    
    IF test_folder_id IS NULL THEN
        INSERT INTO saved_views (
            user_id, 
            name, 
            is_folder, 
            tags, 
            folder_icon, 
            folder_color
        ) VALUES (
            current_user_id,
            'Test Cartella Debug',
            true,
            '{}',
            'folder',
            '#FF0000'
        ) RETURNING id INTO test_folder_id;
        
        RAISE NOTICE 'Cartella test creata con ID: %', test_folder_id;
    ELSE
        RAISE NOTICE 'Cartella test trovata con ID: %', test_folder_id;
    END IF;
    
    -- Test update tags sulla cartella
    UPDATE saved_views 
    SET tags = ARRAY['test-tag', 'debug-tag']
    WHERE id = test_folder_id AND is_folder = true;
    
    -- Verifica risultato
    SELECT tags FROM saved_views WHERE id = test_folder_id;
    
    RAISE NOTICE 'Test update completato per cartella ID: %', test_folder_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRORE durante test update: % - %', SQLSTATE, SQLERRM;
END $$;

-- =============================================================================
-- 4. VERIFICA RLS POLICIES PER SAVED_VIEWS
-- =============================================================================

-- Controlla tutte le RLS policies sulla tabella saved_views
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'saved_views'
    AND schemaname = 'public'
ORDER BY policyname;

-- Verifica se RLS è abilitato
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'saved_views' 
    AND schemaname = 'public';

-- =============================================================================
-- 5. CONFRONTO CON TABELLA DIAGRAMS (FUNZIONANTE)
-- =============================================================================

-- Verifica struttura campo tags in diagrams (che funziona)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diagrams' 
    AND table_schema = 'public'
    AND column_name = 'tags';

-- Test update su diagrams per confronto
SELECT id, title, tags 
FROM diagrams 
WHERE user_id = auth.uid() 
LIMIT 3;

-- =============================================================================
-- 6. VERIFICA ERRORI CONSTRAINT E TRIGGER
-- =============================================================================

-- Controlla constraint sulla tabella saved_views
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.constraint_column_usage ccu
JOIN information_schema.table_constraints tc ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'saved_views'
    AND tc.table_schema = 'public'
ORDER BY constraint_type;

-- Controlla trigger attivi
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'saved_views'
    AND trigger_schema = 'public';

-- =============================================================================
-- 7. LOG DETTAGLIATO PER DEBUGGING
-- =============================================================================

-- Query finale riassuntiva per il report
SELECT 
    'SCHEMA_CHECK' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'saved_views' 
                AND column_name = 'tags'
                AND table_schema = 'public'
        ) THEN 'PASS: Campo tags esiste'
        ELSE 'FAIL: Campo tags NON esiste'
    END as result;

SELECT 
    'RLS_CHECK' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'saved_views' 
                AND rowsecurity = true
                AND schemaname = 'public'
        ) THEN 'RLS abilitato'
        ELSE 'RLS disabilitato'
    END as result;

SELECT 
    'FOLDER_COUNT' as test_type,
    CONCAT(COUNT(*), ' cartelle trovate') as result
FROM saved_views 
WHERE is_folder = true;

-- Fine diagnostic
-- Risultati da analizzare per identificare il problema