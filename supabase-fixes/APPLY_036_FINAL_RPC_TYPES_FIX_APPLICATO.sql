-- APPLY 036: Final RPC function with all correct data types
-- Status: PENDING  
-- Purpose: Fix all data type mismatches using schema reference and screenshots

-- Drop and recreate RPC function with ALL correct data types
DROP FUNCTION IF EXISTS get_pending_invitations_with_details(UUID);

CREATE OR REPLACE FUNCTION get_pending_invitations_with_details(p_user_id UUID)
RETURNS TABLE (
  invitation_id UUID,
  diagram_id UUID,
  diagram_title VARCHAR,         -- diagrams.title is VARCHAR
  diagram_description TEXT,      -- diagrams.description is TEXT  
  permission_level TEXT,         -- diagram_shares.permission_level is TEXT
  invitation_message TEXT,       -- diagram_shares.invitation_message is TEXT
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  owner_id UUID,
  owner_email VARCHAR,           -- auth.users.email is VARCHAR
  owner_username TEXT,           -- profiles.username is TEXT
  owner_avatar_url TEXT,         -- profiles.avatar_url is TEXT
  invited_by_id UUID,
  invited_by_email VARCHAR,      -- auth.users.email is VARCHAR
  invited_by_username TEXT,      -- profiles.username is TEXT
  invited_by_avatar_url TEXT     -- profiles.avatar_url is TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id as invitation_id,
    ds.diagram_id,
    d.title as diagram_title,
    d.description as diagram_description,
    ds.permission_level,
    ds.invitation_message,
    ds.created_at,
    ds.expires_at,
    ds.owner_id,
    owner_user.email as owner_email,
    owner_profile.username as owner_username,
    owner_profile.avatar_url as owner_avatar_url,
    ds.invited_by as invited_by_id,
    invited_by_user.email as invited_by_email,
    invited_by_profile.username as invited_by_username,
    invited_by_profile.avatar_url as invited_by_avatar_url
  FROM diagram_shares ds
  JOIN diagrams d ON ds.diagram_id = d.id
  JOIN auth.users owner_user ON ds.owner_id = owner_user.id
  LEFT JOIN profiles owner_profile ON ds.owner_id = owner_profile.id
  LEFT JOIN auth.users invited_by_user ON ds.invited_by = invited_by_user.id
  LEFT JOIN profiles invited_by_profile ON ds.invited_by = invited_by_profile.id
  WHERE ds.shared_with_id = p_user_id 
    AND ds.status = 'pending'
  ORDER BY ds.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_pending_invitations_with_details(UUID) TO authenticated;