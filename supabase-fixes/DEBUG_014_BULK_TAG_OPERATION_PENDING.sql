-- DEBUG_014: Debug Bulk Tag Operations on Views
-- Data: 2025-08-25
-- Descrizione: Debug perché handleBulkTagOperation dice "successo" ma le viste non sono taggate
-- Problema: Toast di successo ma tag non applicati realmente alle viste

-- =============================================================================
-- 1. VERIFICA STRUTTURA CARTELLA 20250824_c
-- =============================================================================

-- Query 1: Verifica cartella e le sue viste
SELECT 
    id,
    name,
    is_folder,
    parent_folder_id,
    tags,
    array_length(tags, 1) as tags_count,
    CASE WHEN is_folder THEN 'CARTELLA' ELSE 'VISTA' END as tipo
FROM saved_views 
WHERE id = '51153393-d34d-47e1-aaa1-e41fe4767175' -- Cartella 20250824_c
   OR parent_folder_id = '51153393-d34d-47e1-aaa1-e41fe4767175' -- Viste nella cartella
ORDER BY is_folder DESC, name;

-- =============================================================================
-- 2. VERIFICA CAMPO TAGS NELLE VISTE
-- =============================================================================

-- Query 2: Verifica se le viste hanno il campo tags
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'saved_views' 
    AND column_name = 'tags'
    AND table_schema = 'public';

-- =============================================================================
-- 3. TEST MANUALE UPDATE TAG SU VISTA
-- =============================================================================

-- Query 3: Test manuale update tag su una vista specifica
-- PRIMA: Trova una vista nella cartella 20250824_c
SELECT 
    id,
    name,
    parent_folder_id,
    tags,
    'PRIMA del test update' as status
FROM saved_views 
WHERE parent_folder_id = '51153393-d34d-47e1-aaa1-e41fe4767175'
    AND is_folder = false
LIMIT 1;

-- Test update manuale (UNCOMMENTA per eseguire):
/*
-- Sostituisci VIEW_ID_HERE con l'ID della vista dalla query sopra
UPDATE saved_views 
SET tags = ARRAY['test-manual', 'debug'] 
WHERE id = 'VIEW_ID_HERE';

-- Verifica risultato
SELECT 
    id,
    name,
    tags,
    'DOPO test update' as status
FROM saved_views 
WHERE id = 'VIEW_ID_HERE';
*/

-- =============================================================================
-- 4. VERIFICA RLS POLICIES PER UPDATE VISTE
-- =============================================================================

-- Query 4: Verifica RLS policies per update su saved_views
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
    AND cmd IN ('UPDATE', 'ALL')
ORDER BY policyname;

-- =============================================================================
-- 5. SIMULAZIONE BULK OPERATION
-- =============================================================================

-- Query 5: Simulazione di quello che dovrebbe fare handleBulkTagOperation
DO $$
DECLARE
    vista_record RECORD;
    folder_id UUID := '51153393-d34d-47e1-aaa1-e41fe4767175';
    tag_to_apply TEXT := 'test-simulation';
    updates_count INTEGER := 0;
BEGIN
    -- Log cartella target
    RAISE NOTICE 'Target folder: %', folder_id;
    
    -- Loop attraverso tutte le viste nella cartella
    FOR vista_record IN 
        SELECT id, name, tags 
        FROM saved_views 
        WHERE parent_folder_id = folder_id 
            AND is_folder = false
    LOOP
        RAISE NOTICE 'Processing vista: % (ID: %)', vista_record.name, vista_record.id;
        RAISE NOTICE 'Current tags: %', vista_record.tags;
        
        -- Simula update (NON eseguire realmente per ora)
        -- UPDATE saved_views SET tags = array_append(COALESCE(tags, '{}'), tag_to_apply) WHERE id = vista_record.id;
        
        updates_count := updates_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Trovate % viste da aggiornare nella cartella', updates_count;
    
    IF updates_count = 0 THEN
        RAISE NOTICE 'PROBLEMA: Nessuna vista trovata nella cartella %!', folder_id;
    END IF;
END $$;

-- =============================================================================
-- 6. RISULTATI ATTESI
-- =============================================================================

/*
COSA DOVREMMO VEDERE:

Query 1: Cartella + le sue viste child
Query 2: Campo tags esiste e è TEXT[]
Query 3: Update manuale funziona
Query 4: RLS policies permettono UPDATE 
Query 5: Simulation trova le viste nella cartella

SE QUALCOSA FALLISCE:
- Query 1: Nessuna vista nella cartella → problema parent_folder_id
- Query 2: Campo tags mancante → problema schema
- Query 3: Update fallisce → problema RLS
- Query 4: Policy blocca update → problema permissions  
- Query 5: Nessuna vista trovata → problema query logic
*/

-- Fine DEBUG_014