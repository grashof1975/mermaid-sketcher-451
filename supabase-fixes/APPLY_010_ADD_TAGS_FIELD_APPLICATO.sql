-- APPLY_010: Add Missing Tags Field to saved_views
-- Data: 2025-08-25
-- Descrizione: Aggiunge campo 'tags' mancante alla tabella saved_views per supportare tag su cartelle
-- Problema: "Impossibile aggiornare i tag della cartella" - campo 'tags' non esiste

-- =============================================================================
-- ROOT CAUSE IDENTIFIED
-- =============================================================================
-- Il campo 'tags' è completamente assente dalla tabella saved_views
-- APPLY_007 ha aggiunto campi cartelle ma ha dimenticato il campo tags fondamentale
-- Frontend prova a fare: UPDATE saved_views SET tags = [...] WHERE id = folder_id
-- Database risponde: ERROR 42703: column "tags" does not exist

-- =============================================================================
-- 1. AGGIUNTA CAMPO TAGS
-- =============================================================================

-- Aggiungi campo tags come array di testi (same type as diagrams table)
ALTER TABLE saved_views 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Aggiungi commento per documentazione
COMMENT ON COLUMN saved_views.tags IS 'Array of tags for organizing folders and views - supports both folders (is_folder=true) and views (is_folder=false)';

-- =============================================================================
-- 2. AGGIORNA INDICI PER PERFORMANCE 
-- =============================================================================

-- Crea indice per query tag-based (utile per filtri futuri)
CREATE INDEX IF NOT EXISTS idx_saved_views_tags ON saved_views USING GIN(tags);

-- Indice specifico per cartelle con tags (query comuni)
CREATE INDEX IF NOT EXISTS idx_saved_views_folder_tags ON saved_views(is_folder, tags) 
WHERE is_folder = true;

-- =============================================================================
-- 3. VERIFICA E TEST
-- =============================================================================

-- Test 1: Verifica che il campo sia stato creato
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'saved_views' 
    AND table_schema = 'public'
    AND column_name = 'tags';

-- Test 2: Prova inserimento cartella con tags
DO $$
DECLARE
    test_folder_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user
    SELECT auth.uid() INTO current_user_id;
    
    -- Crea cartella test con tags
    INSERT INTO saved_views (
        user_id, 
        name, 
        is_folder, 
        tags,
        folder_icon, 
        folder_color
    ) VALUES (
        current_user_id,
        'Test Folder with Tags',
        true,
        ARRAY['test-tag', 'folder-tag', 'debug'],
        'folder',
        '#00FF00'
    ) RETURNING id INTO test_folder_id;
    
    RAISE NOTICE 'Test folder created with ID: % and tags: %', 
        test_folder_id, 
        (SELECT tags FROM saved_views WHERE id = test_folder_id);
        
    -- Test update tags
    UPDATE saved_views 
    SET tags = ARRAY['updated-tag', 'new-tag']
    WHERE id = test_folder_id;
    
    RAISE NOTICE 'Tags updated successfully to: %', 
        (SELECT tags FROM saved_views WHERE id = test_folder_id);
        
    -- Cleanup test data (optional)
    -- DELETE FROM saved_views WHERE id = test_folder_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR during test: % - %', SQLSTATE, SQLERRM;
END $$;

-- Test 3: Query diagnostica finale
SELECT 
    'FIELD_CHECK' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'saved_views' 
                AND column_name = 'tags'
                AND data_type = 'ARRAY'
        ) THEN 'PASS: Campo tags TEXT[] creato correttamente'
        ELSE 'FAIL: Campo tags non trovato o tipo errato'
    END as result;

-- Test 4: Verifica cartelle esistenti ora hanno campo tags
SELECT 
    id,
    name, 
    is_folder,
    tags,
    CASE 
        WHEN is_folder = true THEN 'FOLDER'
        ELSE 'VIEW'
    END as item_type
FROM saved_views 
WHERE is_folder = true
LIMIT 10;

-- =============================================================================
-- 4. RISULTATO ATTESO
-- =============================================================================

/*
PRIMA del fix:
- Frontend: db.savedViews.update(folderId, { tags: newTags })
- Database: ERROR 42703: column "tags" does not exist
- UI: Errore "Impossibile aggiornare i tag della cartella"

DOPO il fix:
- Frontend: db.savedViews.update(folderId, { tags: newTags }) 
- Database: UPDATE successful
- UI: Tags appaiono immediatamente nella cartella
- Bulk operations ↓/↑ diventano disponibili
*/

-- Fine APPLY_010