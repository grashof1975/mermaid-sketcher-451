-- APPLY_016: SISTEMA CONDIVISIONE VISTE INDIVIDUALI
-- Data: 2025-08-25
-- Scopo: Implementare condivisione di singole viste tra utenti
-- Phase: 3A - Views Individual Sharing

-- =============================================================================
-- 1. TABELLA CONDIVISIONI VISTE
-- =============================================================================

CREATE TABLE IF NOT EXISTS saved_views_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias principali
  saved_view_id UUID NOT NULL REFERENCES saved_views(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sistema permessi
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
  
  -- Vincoli unici: un utente può essere condiviso una sola volta per vista
  UNIQUE(saved_view_id, shared_with_id)
);

-- =============================================================================
-- 2. TABELLA LINK PUBBLICI PER VISTE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public_view_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vista condivisa
  saved_view_id UUID NOT NULL REFERENCES saved_views(id) ON DELETE CASCADE,
  
  -- Token e accesso
  share_token TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Password opzionale per accesso protetto
  
  -- Chi ha creato il link
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configurazioni accesso
  allows_comments BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Statistiche
  view_count INTEGER DEFAULT 0,
  unique_visitors TEXT[] DEFAULT '{}', -- Array di IP/fingerprints per conteggio unici
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = non scade mai
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- 3. TABELLA ATTIVITÀ CONDIVISIONE VISTE
-- =============================================================================

CREATE TABLE IF NOT EXISTS view_sharing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vista coinvolta
  saved_view_id UUID NOT NULL REFERENCES saved_views(id) ON DELETE CASCADE,
  
  -- Utenti coinvolti
  actor_id UUID REFERENCES auth.users(id), -- Chi ha fatto l'azione (NULL per accesso pubblico)
  target_user_id UUID REFERENCES auth.users(id), -- Su chi è stata fatta l'azione (per inviti)
  
  -- Tipo di attività
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'view_shared', 'view_invite_sent', 'view_invite_accepted', 'view_invite_declined',
    'view_permission_changed', 'view_access_revoked', 'public_link_created',
    'public_view_accessed', 'view_comment_added'
  )),
  
  -- Dettagli attività
  activity_details JSONB, -- Dettagli specifici dell'attività
  ip_address TEXT, -- Per accesso pubblico
  user_agent TEXT, -- Per accesso pubblico
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. INDICI PER PERFORMANCE
-- =============================================================================

-- Indice per query condivisioni per vista
CREATE INDEX IF NOT EXISTS idx_saved_views_shares_view_id ON saved_views_shares(saved_view_id);

-- Indice per query condivisioni per utente
CREATE INDEX IF NOT EXISTS idx_saved_views_shares_user_id ON saved_views_shares(shared_with_id);

-- Indice per link pubblici attivi
CREATE INDEX IF NOT EXISTS idx_public_view_links_active ON public_view_links(is_active) WHERE is_active = true;

-- Indice per token lookup
CREATE INDEX IF NOT EXISTS idx_public_view_links_token ON public_view_links(share_token);

-- Indice per attività per vista
CREATE INDEX IF NOT EXISTS idx_view_sharing_activities_view_id ON view_sharing_activities(saved_view_id);

-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- Enable RLS su tutte le tabelle
ALTER TABLE saved_views_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_view_links ENABLE ROW LEVEL SECURITY;  
ALTER TABLE view_sharing_activities ENABLE ROW LEVEL SECURITY;

-- Policy per saved_views_shares
CREATE POLICY "Users can manage shares of their own views" ON saved_views_shares
  FOR ALL USING (
    owner_id = auth.uid() OR 
    shared_with_id = auth.uid()
  );

-- Policy per public_view_links  
CREATE POLICY "Users can manage public links of their own views" ON public_view_links
  FOR ALL USING (
    created_by = auth.uid() OR
    saved_view_id IN (
      SELECT id FROM saved_views WHERE user_id = auth.uid()
    )
  );

-- Policy per view_sharing_activities - read only per coinvolti
CREATE POLICY "Users can view activities of their shared views" ON view_sharing_activities
  FOR SELECT USING (
    actor_id = auth.uid() OR
    target_user_id = auth.uid() OR
    saved_view_id IN (
      SELECT id FROM saved_views WHERE user_id = auth.uid()
    ) OR
    saved_view_id IN (
      SELECT saved_view_id FROM saved_views_shares WHERE shared_with_id = auth.uid()
    )
  );

-- =============================================================================
-- 6. FUNZIONI UTILITY
-- =============================================================================

-- Funzione per generare token sicuri per link pubblici
CREATE OR REPLACE FUNCTION generate_view_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_token BOOLEAN;
BEGIN
  LOOP
    -- Genera token base64url di 32 caratteri
    token := encode(gen_random_bytes(24), 'base64');
    -- Rendi URL-safe
    token := replace(replace(token, '+', '-'), '/', '_');
    token := rtrim(token, '=');
    
    -- Verifica che non esista già
    SELECT EXISTS(SELECT 1 FROM public_view_links WHERE share_token = token) INTO exists_token;
    
    IF NOT exists_token THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere viste condivise con un utente
CREATE OR REPLACE FUNCTION get_shared_views_for_user(user_uuid UUID)
RETURNS TABLE(
  view_id UUID,
  view_name TEXT,
  permission_level TEXT,
  owner_name TEXT,
  shared_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sv.id,
    sv.name,
    svs.permission_level,
    p.username,
    svs.created_at
  FROM saved_views_shares svs
  JOIN saved_views sv ON svs.saved_view_id = sv.id
  JOIN profiles p ON svs.owner_id = p.id
  WHERE svs.shared_with_id = user_uuid 
    AND svs.status = 'accepted';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. TRIGGER PER LOGGING ATTIVITÀ
-- =============================================================================

-- Trigger per loggare creazione condivisioni
CREATE OR REPLACE FUNCTION log_view_share_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO view_sharing_activities (
      saved_view_id, 
      actor_id, 
      target_user_id, 
      activity_type,
      activity_details
    ) VALUES (
      NEW.saved_view_id,
      NEW.invited_by,
      NEW.shared_with_id,
      'view_invite_sent',
      jsonb_build_object(
        'permission_level', NEW.permission_level,
        'message', NEW.invitation_message
      )
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_view_share_trigger
  AFTER INSERT ON saved_views_shares
  FOR EACH ROW EXECUTE FUNCTION log_view_share_activity();

-- =============================================================================
-- COMPLETATO: Schema per condivisione viste individuali
-- =============================================================================