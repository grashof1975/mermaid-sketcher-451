-- TEST_013: Test Toggle Folder Tag Mode Function
-- Data: 2025-08-25
-- Descrizione: Test della funzione toggle_folder_tag_mode per verificare cambio modalità frecce
-- Obiettivo: Verificare che il toggle da ↓ (apply_to_views) a ↑ (folder_only) funzioni

-- =============================================================================
-- 1. STATO INIZIALE - VERIFICA MODALITÀ CORRENTE
-- =============================================================================

-- Query 1: Verifica stato iniziale cartella 20250824_c
SELECT 
    id,
    name,
    tag_application_mode,
    CASE 
        WHEN tag_application_mode = 'apply_to_views' THEN '↓ Attiva (applica a viste)'
        WHEN tag_application_mode = 'folder_only' THEN '↑ Attiva (solo cartella)'
        ELSE 'Modalità sconosciuta'
    END as stato_corrente,
    updated_at
FROM saved_views 
WHERE name = '20250824_c' 
    AND is_folder = true;

-- =============================================================================
-- 2. TEST TOGGLE FUNCTION
-- =============================================================================

-- Query 2: Esegui toggle modalità (da ↓ a ↑)
SELECT toggle_folder_tag_mode(
    '51153393-d34d-47e1-aaa1-e41fe4767175', -- ID cartella 20250824_c
    auth.uid()
) as new_mode;

-- =============================================================================
-- 3. VERIFICA RISULTATO TOGGLE
-- =============================================================================

-- Query 3: Verifica il cambiamento dopo toggle
SELECT 
    name, 
    tag_application_mode,
    CASE 
        WHEN tag_application_mode = 'apply_to_views' THEN '↓ Attiva'
        ELSE '↑ Attiva'
    END as freccia_attiva,
    updated_at
FROM saved_views 
WHERE name = '20250824_c' 
    AND is_folder = true;

-- =============================================================================
-- 4. TEST TOGGLE INVERSO (TORNA ALLO STATO ORIGINALE)
-- =============================================================================

-- Query 4: Ri-toggle per tornare allo stato originale (da ↑ a ↓)
SELECT toggle_folder_tag_mode(
    '51153393-d34d-47e1-aaa1-e41fe4767175', -- ID cartella 20250824_c
    auth.uid()
) as returned_mode;

-- Query 5: Verifica ritorno allo stato originale
SELECT 
    name, 
    tag_application_mode,
    CASE 
        WHEN tag_application_mode = 'apply_to_views' THEN '↓ Attiva (stato originale ripristinato)'
        ELSE '↑ Attiva'
    END as stato_finale,
    updated_at
FROM saved_views 
WHERE name = '20250824_c' 
    AND is_folder = true;

-- =============================================================================
-- 5. RISULTATI ATTESI
-- =============================================================================

/*
RISULTATI ATTESI:

Query 1 (stato iniziale):
- tag_application_mode: 'apply_to_views'
- stato_corrente: '↓ Attiva (applica a viste)'

Query 2 (primo toggle):
- new_mode: 'folder_only'

Query 3 (verifica dopo toggle):
- tag_application_mode: 'folder_only' 
- freccia_attiva: '↑ Attiva'
- updated_at: timestamp aggiornato

Query 4 (toggle inverso):
- returned_mode: 'apply_to_views'

Query 5 (stato finale):
- tag_application_mode: 'apply_to_views'
- stato_finale: '↓ Attiva (stato originale ripristinato)'

Se tutti i risultati corrispondono agli attesi:
✅ Funzione toggle_folder_tag_mode() funziona correttamente
✅ Database pronto per implementazione frontend
*/

-- Fine TEST_013