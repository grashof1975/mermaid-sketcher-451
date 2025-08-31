-- APPLY 037: Enhanced sharing system for views and folders
-- Status: PENDING
-- Purpose: Add owner and sharing metadata to support separate shared content system

-- Add sharing metadata to saved_views table
ALTER TABLE saved_views 
ADD COLUMN IF NOT EXISTS owner_email VARCHAR,
ADD COLUMN IF NOT EXISTS shared_with JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sharing_permissions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_shared_with_me BOOLEAN DEFAULT false;

-- Create folder sharing system for future use
CREATE TABLE IF NOT EXISTS folder_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('viewer', 'editor', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  invitation_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE(folder_id, shared_with_id)
);

-- Create view sharing system (separate from diagram sharing)
CREATE TABLE IF NOT EXISTS view_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id UUID NOT NULL REFERENCES saved_views(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('viewer', 'editor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  invitation_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE(view_id, shared_with_id)
);

-- RLS Policies for folder_shares
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view folder shares they're involved in" 
ON folder_shares FOR SELECT 
USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

CREATE POLICY "Users can create folder shares for their folders" 
ON folder_shares FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update folder shares they're involved in" 
ON folder_shares FOR UPDATE 
USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

-- RLS Policies for view_shares  
ALTER TABLE view_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view view shares they're involved in" 
ON view_shares FOR SELECT 
USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

CREATE POLICY "Users can create view shares for their views" 
ON view_shares FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update view shares they're involved in" 
ON view_shares FOR UPDATE 
USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

-- Function to get shared views for user
CREATE OR REPLACE FUNCTION get_shared_views_for_user(p_user_id UUID)
RETURNS TABLE (
  view_id UUID,
  view_name VARCHAR,
  view_zoom NUMERIC,
  view_pan_x NUMERIC,
  view_pan_y NUMERIC,
  view_created_at TIMESTAMPTZ,
  view_tags TEXT[],
  owner_id UUID,
  owner_email VARCHAR,
  permission_level TEXT,
  shared_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sv.id as view_id,
    sv.name as view_name,
    sv.zoom_level as view_zoom,
    sv.pan_x as view_pan_x,
    sv.pan_y as view_pan_y,
    sv.created_at as view_created_at,
    sv.tags as view_tags,
    vs.owner_id,
    owner_user.email as owner_email,
    vs.permission_level,
    vs.created_at as shared_at
  FROM view_shares vs
  JOIN saved_views sv ON vs.view_id = sv.id
  JOIN auth.users owner_user ON vs.owner_id = owner_user.id
  WHERE vs.shared_with_id = p_user_id 
    AND vs.status = 'accepted'
  ORDER BY vs.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_shared_views_for_user(UUID) TO authenticated;