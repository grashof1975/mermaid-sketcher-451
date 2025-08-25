-- APPLY_007: Advanced Tags System + View Folders System
-- Data: 2025-08-24  
-- Descrizione: Sistema filtri tag cumulativi + organizzazione viste in cartelle

-- =============================================================================
-- 1. ESTENSIONE TABELLA SAVED_VIEWS PER CARTELLE
-- =============================================================================

-- Aggiungi campo per identificare se è una cartella
ALTER TABLE saved_views ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT false;

-- Aggiungi campo per gerarchia parent/child
ALTER TABLE saved_views ADD COLUMN IF NOT EXISTS parent_folder_id UUID REFERENCES saved_views(id) ON DELETE CASCADE;

-- Aggiungi campo per ordine visualizzazione all'interno della cartella
ALTER TABLE saved_views ADD COLUMN IF NOT EXISTS folder_sort_order INTEGER DEFAULT 0;

-- Aggiungi campo per icona personalizzata cartella (opzionale)
ALTER TABLE saved_views ADD COLUMN IF NOT EXISTS folder_icon VARCHAR(50) DEFAULT 'folder';

-- Aggiungi campo per colore cartella (opzionale)  
ALTER TABLE saved_views ADD COLUMN IF NOT EXISTS folder_color VARCHAR(7); -- hex color

-- =============================================================================
-- 2. TABELLA CONFIGURAZIONI FILTRI TAG UTENTE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_tag_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE, -- NULL per filtri globali
  
  -- Configurazione filtro
  active_tags TEXT[] DEFAULT '{}', -- Array tag attualmente selezionati
  filter_mode VARCHAR(10) DEFAULT 'AND' CHECK (filter_mode IN ('AND', 'OR')), -- Modalità combinazione
  is_active BOOLEAN DEFAULT true, -- Se il filtro è attivo
  
  -- Preset filtri (per salvare combinazioni frequenti)
  preset_name VARCHAR(100), -- Nome preset opzionale
  is_preset BOOLEAN DEFAULT false, -- Se è un preset salvato
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utente può avere un solo filtro attivo per diagramma
  UNIQUE(user_id, diagram_id) DEFERRABLE INITIALLY DEFERRED
);

-- =============================================================================
-- 3. TABELLA STATISTICHE TAG USAGE 
-- =============================================================================

CREATE TABLE IF NOT EXISTS tag_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  
  -- Statistiche utilizzo
  usage_count INTEGER DEFAULT 0, -- Quante volte usato
  filter_count INTEGER DEFAULT 0, -- Quante volte usato nei filtri
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Associazioni
  diagram_count INTEGER DEFAULT 0, -- In quanti diagrammi appare
  view_count INTEGER DEFAULT 0, -- In quante viste appare
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, tag_name)
);

-- =============================================================================
-- 4. VINCOLI E INDICI PER PERFORMANCE
-- =============================================================================

-- Vincoli per cartelle (non possono contenere se stesse)
ALTER TABLE saved_views ADD CONSTRAINT check_folder_not_self_parent 
  CHECK (parent_folder_id != id);

-- Indici per migliorare performance query
CREATE INDEX IF NOT EXISTS idx_saved_views_is_folder ON saved_views(is_folder);
CREATE INDEX IF NOT EXISTS idx_saved_views_parent_folder ON saved_views(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_folder_sort ON saved_views(folder_sort_order);

CREATE INDEX IF NOT EXISTS idx_user_tag_filters_user_diagram ON user_tag_filters(user_id, diagram_id);
CREATE INDEX IF NOT EXISTS idx_user_tag_filters_active ON user_tag_filters(is_active);

CREATE INDEX IF NOT EXISTS idx_tag_statistics_user_tag ON tag_statistics(user_id, tag_name);
CREATE INDEX IF NOT EXISTS idx_tag_statistics_usage ON tag_statistics(usage_count DESC);

-- =============================================================================
-- 5. FUNZIONI UTILITY PER GESTIONE CARTELLE
-- =============================================================================

-- Funzione per ottenere tutte le viste di una cartella (con ricorsione se necessario)
CREATE OR REPLACE FUNCTION get_folder_views(p_folder_id UUID, p_user_id UUID)
RETURNS TABLE (
  view_id UUID,
  view_name VARCHAR(255),
  view_type TEXT, -- 'view' o 'folder'
  sort_order INTEGER,
  folder_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    -- Base case: viste dirette nella cartella
    SELECT 
      sv.id as view_id,
      sv.name as view_name,
      CASE WHEN sv.is_folder THEN 'folder' ELSE 'view' END as view_type,
      sv.folder_sort_order as sort_order,
      0 as folder_level
    FROM saved_views sv
    WHERE sv.parent_folder_id = p_folder_id 
      AND sv.user_id = p_user_id
    
    UNION ALL
    
    -- Recursive case: viste nelle sottocartelle (se implementiamo più livelli)
    SELECT 
      sv.id,
      sv.name,
      CASE WHEN sv.is_folder THEN 'folder' ELSE 'view' END,
      sv.folder_sort_order,
      ft.folder_level + 1
    FROM saved_views sv
    INNER JOIN folder_tree ft ON sv.parent_folder_id = ft.view_id
    WHERE sv.user_id = p_user_id
      AND ft.folder_level < 1 -- Limita a 1 livello per ora
  )
  SELECT * FROM folder_tree
  ORDER BY sort_order, view_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per spostare vista in cartella
CREATE OR REPLACE FUNCTION move_view_to_folder(
  p_view_id UUID,
  p_target_folder_id UUID,
  p_user_id UUID,
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_new_sort_order INTEGER;
BEGIN
  -- Verifica che l'utente possieda entrambi gli elementi
  SELECT COUNT(*) INTO v_count
  FROM saved_views 
  WHERE id IN (p_view_id, p_target_folder_id) 
    AND user_id = p_user_id;
    
  IF v_count != 2 THEN
    RETURN FALSE;
  END IF;
  
  -- Calcola sort order se non specificato
  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(folder_sort_order), 0) + 1 INTO v_new_sort_order
    FROM saved_views
    WHERE parent_folder_id = p_target_folder_id AND user_id = p_user_id;
  ELSE
    v_new_sort_order := p_sort_order;
  END IF;
  
  -- Sposta la vista
  UPDATE saved_views 
  SET 
    parent_folder_id = p_target_folder_id,
    folder_sort_order = v_new_sort_order,
    updated_at = NOW()
  WHERE id = p_view_id AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiornare statistiche tag
CREATE OR REPLACE FUNCTION update_tag_stats(p_user_id UUID, p_tag_name VARCHAR(100), p_action VARCHAR(20))
RETURNS VOID AS $$
BEGIN
  INSERT INTO tag_statistics (user_id, tag_name, usage_count, filter_count, last_used)
  VALUES (p_user_id, p_tag_name, 
    CASE WHEN p_action = 'usage' THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'filter' THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, tag_name) 
  DO UPDATE SET
    usage_count = tag_statistics.usage_count + (CASE WHEN p_action = 'usage' THEN 1 ELSE 0 END),
    filter_count = tag_statistics.filter_count + (CASE WHEN p_action = 'filter' THEN 1 ELSE 0 END),
    last_used = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. RLS POLICIES PER NUOVE TABELLE
-- =============================================================================

-- Policies per user_tag_filters
ALTER TABLE user_tag_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tag filters"
ON user_tag_filters FOR ALL
USING (auth.uid() = user_id);

-- Policies per tag_statistics  
ALTER TABLE tag_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own tag statistics"
ON tag_statistics FOR ALL  
USING (auth.uid() = user_id);

-- =============================================================================
-- 7. TRIGGER PER AUTO-UPDATE TIMESTAMPS
-- =============================================================================

-- Trigger per user_tag_filters
CREATE OR REPLACE FUNCTION update_user_tag_filters_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_tag_filters_updated_at
  BEFORE UPDATE ON user_tag_filters
  FOR EACH ROW EXECUTE FUNCTION update_user_tag_filters_timestamp();

-- Trigger per tag_statistics
CREATE OR REPLACE FUNCTION update_tag_statistics_timestamp()  
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tag_statistics_updated_at
  BEFORE UPDATE ON tag_statistics
  FOR EACH ROW EXECUTE FUNCTION update_tag_statistics_timestamp();

-- =============================================================================
-- 8. DATI DI ESEMPIO E TEST
-- =============================================================================

-- Inserisci alcune cartelle di esempio per utente test (opzionale)
/*
INSERT INTO saved_views (user_id, diagram_id, name, is_folder, folder_icon, folder_color)
VALUES 
  (auth.uid(), NULL, 'Architettura', true, 'building', '#3B82F6'),
  (auth.uid(), NULL, 'UI Components', true, 'palette', '#10B981'),
  (auth.uid(), NULL, 'Database Design', true, 'database', '#F59E0B');
*/

-- =============================================================================
-- 9. QUERY DI VERIFICA
-- =============================================================================

-- Verifica struttura tabelle
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('saved_views', 'user_tag_filters', 'tag_statistics')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Test funzioni (decommentare per testare)
/*
SELECT * FROM get_folder_views('uuid-cartella-test', auth.uid());
SELECT update_tag_stats(auth.uid(), 'test-tag', 'usage');
*/