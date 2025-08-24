-- APPLY_004: SHARING SYSTEM - Database Schema per Condivisione Diagrammi
-- Data: 2025-08-23
-- Descrizione: Implementazione completa sistema condivisione con privilegi granulari

-- =============================================================================
-- 1. TABELLA CONDIVISIONI DIAGRAMMI
-- =============================================================================
CREATE TABLE IF NOT EXISTS diagram_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Livelli di accesso granulari
  permission_level TEXT NOT NULL CHECK (permission_level IN ('viewer', 'commenter', 'editor')),
  
  -- Metadati condivisione
  invited_by UUID REFERENCES auth.users(id), -- Chi ha fatto l'invito
  invitation_message TEXT, -- Messaggio personalizzato invito
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE, -- Quando l'utente ha risposto
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'), -- Scadenza invito
  
  -- Vincoli unici
  UNIQUE(diagram_id, shared_with_id)
);

-- =============================================================================
-- 2. TABELLA LINK PUBBLICI
-- =============================================================================
CREATE TABLE IF NOT EXISTS public_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Token pubblico unico
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  
  -- Configurazione accesso
  is_active BOOLEAN DEFAULT true,
  allow_comments BOOLEAN DEFAULT false, -- Se true, anche non-registrati possono commentare
  password_protected BOOLEAN DEFAULT false,
  access_password TEXT, -- Password opzionale per accesso
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  unique_visitors JSONB DEFAULT '[]', -- Array IP/fingerprint per tracking unique
  
  -- Scadenza
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = mai scade
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- 3. TABELLA ATTIVITÀ CONDIVISIONE (Audit Log)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sharing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Tipo attività
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'invited_user', 'accepted_invite', 'declined_invite', 'removed_user',
    'permission_changed', 'link_created', 'link_revoked', 'public_access'
  )),
  
  -- Dettagli attività
  target_user_id UUID REFERENCES auth.users(id), -- Su chi è stata fatta l'azione
  old_permission TEXT, -- Permesso precedente
  new_permission TEXT, -- Nuovo permesso
  metadata JSONB, -- Dati aggiuntivi (IP, user agent, etc.)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. ESTENSIONE TABELLA DIAGRAMMI
-- =============================================================================
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS sharing_enabled BOOLEAN DEFAULT true;
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS default_share_permission TEXT DEFAULT 'viewer' CHECK (default_share_permission IN ('viewer', 'commenter', 'editor'));

-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- Policy per diagram_shares
CREATE POLICY "Users can view shares for their diagrams" 
ON diagram_shares FOR SELECT 
USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Owners can manage all shares"
ON diagram_shares FOR ALL
USING (owner_id = auth.uid());

CREATE POLICY "Users can respond to their invites"
ON diagram_shares FOR UPDATE
USING (shared_with_id = auth.uid());

-- Policy per public_share_links  
CREATE POLICY "Owners manage public links"
ON public_share_links FOR ALL
USING (created_by = auth.uid());

-- Policy per sharing_activities
CREATE POLICY "Users see activities for their diagrams"
ON sharing_activities FOR SELECT
USING (
  diagram_id IN (
    SELECT id FROM diagrams WHERE user_id = auth.uid()
    UNION
    SELECT diagram_id FROM diagram_shares WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

-- =============================================================================
-- 6. INDICI PER PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_diagram_shares_diagram_id ON diagram_shares(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_shares_shared_with ON diagram_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_diagram_shares_status ON diagram_shares(status);
CREATE INDEX IF NOT EXISTS idx_public_share_links_token ON public_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_public_share_links_diagram ON public_share_links(diagram_id);
CREATE INDEX IF NOT EXISTS idx_sharing_activities_diagram ON sharing_activities(diagram_id);

-- =============================================================================
-- 7. FUNZIONI UTILITY
-- =============================================================================

-- Funzione per ottenere permesso utente su diagramma
CREATE OR REPLACE FUNCTION get_user_diagram_permission(p_diagram_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  -- Controlla se è il proprietario
  IF EXISTS (SELECT 1 FROM diagrams WHERE id = p_diagram_id AND user_id = p_user_id) THEN
    RETURN 'owner';
  END IF;
  
  -- Controlla se ha condivisione attiva
  RETURN (
    SELECT permission_level 
    FROM diagram_shares 
    WHERE diagram_id = p_diagram_id 
      AND shared_with_id = p_user_id 
      AND status = 'accepted'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per logging attività condivisione
CREATE OR REPLACE FUNCTION log_sharing_activity(
  p_diagram_id UUID,
  p_activity_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_old_permission TEXT DEFAULT NULL,
  p_new_permission TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO sharing_activities (
    diagram_id, user_id, activity_type, target_user_id,
    old_permission, new_permission, metadata
  )
  VALUES (
    p_diagram_id, auth.uid(), p_activity_type, p_target_user_id,
    p_old_permission, p_new_permission, p_metadata
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. ENABLE RLS
-- =============================================================================
ALTER TABLE diagram_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_activities ENABLE ROW LEVEL SECURITY;