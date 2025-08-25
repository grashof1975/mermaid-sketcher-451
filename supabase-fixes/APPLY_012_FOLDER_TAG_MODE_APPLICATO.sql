-- APPLY_012: Folder Tag Application Mode System
-- Data: 2025-08-25
-- Descrizione: Aggiunge campo per gestire modalità applicazione tag alle cartelle
-- Funzionalità: Toggle frecce ↓ (apply to views) / ↑ (folder only) mutuamente esclusivo

-- =============================================================================
-- 1. AGGIUNTA CAMPO TAG APPLICATION MODE
-- =============================================================================

-- Aggiungi campo per modalità applicazione tag
ALTER TABLE saved_views 
ADD COLUMN IF NOT EXISTS tag_application_mode VARCHAR(20) DEFAULT 'apply_to_views'
CHECK (tag_application_mode IN ('apply_to_views', 'folder_only'));

-- Commento documentazione
COMMENT ON COLUMN saved_views.tag_application_mode IS 
'Modalità applicazione tag per cartelle: apply_to_views (freccia ↓ attiva) o folder_only (freccia ↑ attiva)';

-- =============================================================================
-- 2. INDICE PER PERFORMANCE
-- =============================================================================

-- Indice per query cartelle con modalità specifica
CREATE INDEX IF NOT EXISTS idx_saved_views_folder_tag_mode 
ON saved_views(is_folder, tag_application_mode) 
WHERE is_folder = true;

-- =============================================================================
-- 3. FUNZIONE UPDATE TAG MODE
-- =============================================================================

-- Funzione per cambiare modalità tag (toggle frecce)
CREATE OR REPLACE FUNCTION toggle_folder_tag_mode(
    p_folder_id UUID,
    p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
    current_mode TEXT;
    new_mode TEXT;
BEGIN
    -- Verifica ownership e ottieni modalità corrente
    SELECT tag_application_mode INTO current_mode
    FROM saved_views 
    WHERE id = p_folder_id 
        AND user_id = p_user_id 
        AND is_folder = true;
    
    IF current_mode IS NULL THEN
        RETURN 'ERROR: Cartella non trovata o non autorizzato';
    END IF;
    
    -- Toggle logico
    IF current_mode = 'apply_to_views' THEN
        new_mode := 'folder_only';
    ELSE
        new_mode := 'apply_to_views';
    END IF;
    
    -- Applica il cambio
    UPDATE saved_views 
    SET tag_application_mode = new_mode,
        updated_at = NOW()
    WHERE id = p_folder_id 
        AND user_id = p_user_id;
    
    RETURN new_mode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION toggle_folder_tag_mode(UUID, UUID) TO authenticated;

-- =============================================================================
-- 4. FUNZIONE APPLICAZIONE TAG INTELLIGENTE
-- =============================================================================

-- Funzione che applica tag secondo la modalità della cartella
CREATE OR REPLACE FUNCTION apply_folder_tags_with_mode(
    p_folder_id UUID,
    p_new_tags TEXT[],
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    folder_mode TEXT;
    views_updated INTEGER := 0;
    result JSON;
BEGIN
    -- Ottieni modalità cartella
    SELECT tag_application_mode INTO folder_mode
    FROM saved_views 
    WHERE id = p_folder_id 
        AND user_id = p_user_id 
        AND is_folder = true;
    
    IF folder_mode IS NULL THEN
        RETURN '{"error": "Cartella non trovata", "updated": 0}';
    END IF;
    
    -- Aggiorna sempre la cartella
    UPDATE saved_views 
    SET tags = p_new_tags,
        updated_at = NOW()
    WHERE id = p_folder_id AND user_id = p_user_id;
    
    -- Se modalità apply_to_views, aggiorna anche le viste
    IF folder_mode = 'apply_to_views' THEN
        UPDATE saved_views 
        SET tags = p_new_tags,
            updated_at = NOW()
        WHERE parent_folder_id = p_folder_id 
            AND user_id = p_user_id
            AND is_folder = false;
        
        GET DIAGNOSTICS views_updated = ROW_COUNT;
    END IF;
    
    -- Risultato JSON
    result := json_build_object(
        'success', true,
        'mode', folder_mode,
        'folder_updated', true,
        'views_updated', views_updated,
        'total_updated', views_updated + 1
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION apply_folder_tags_with_mode(UUID, TEXT[], UUID) TO authenticated;

-- =============================================================================
-- 5. DEFAULT MODE PER CARTELLE ESISTENTI
-- =============================================================================

-- Imposta modalità default per cartelle esistenti (freccia ↓ attiva di default)
UPDATE saved_views 
SET tag_application_mode = 'apply_to_views'
WHERE is_folder = true 
    AND tag_application_mode IS NULL;

-- =============================================================================
-- 6. TEST E VERIFICA
-- =============================================================================

-- Test 1: Verifica campo aggiunto
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'saved_views' 
    AND column_name = 'tag_application_mode';

-- Test 2: Verifica cartelle con nuova modalità
SELECT 
    id,
    name,
    is_folder,
    tags,
    tag_application_mode,
    CASE 
        WHEN tag_application_mode = 'apply_to_views' THEN '↓ Attiva (applica a viste)'
        WHEN tag_application_mode = 'folder_only' THEN '↑ Attiva (solo cartella)'
        ELSE 'Modalità sconosciuta'
    END as mode_description
FROM saved_views 
WHERE is_folder = true 
LIMIT 10;

-- Test 3: Test funzione toggle (decommentare per testare)
/*
SELECT toggle_folder_tag_mode(
    '51153393-d34d-47e1-aaa1-e41fe4767175', -- ID cartella 20250824_c
    auth.uid()
) as new_mode;
*/

-- =============================================================================
-- 7. DOCUMENTAZIONE COMPORTAMENTO
-- =============================================================================

/*
COMPORTAMENTO ATTESO DOPO APPLY_012:

1. MODALITÀ apply_to_views (default):
   - UI: Freccia ↓ attiva (evidenziata), Freccia ↑ disattiva (grigia)
   - Comportamento: Nuovo tag si applica a cartella + tutte le viste contenute
   
2. MODALITÀ folder_only:
   - UI: Freccia ↑ attiva (evidenziata), Freccia ↓ disattiva (grigia)  
   - Comportamento: Nuovo tag si applica SOLO alla cartella

3. TOGGLE:
   - Click ↓: Attiva apply_to_views, disattiva folder_only
   - Click ↑: Attiva folder_only, disattiva apply_to_views
   - MAI entrambe attive o disattive contemporaneamente

4. DATABASE FUNCTIONS:
   - toggle_folder_tag_mode(): Cambia modalità cartella
   - apply_folder_tags_with_mode(): Applica tag secondo modalità
*/

-- Fine APPLY_012