-- APPLY 034: Create RPC function for pending invitations with user data
-- Status: PENDING
-- Purpose: Fix crash in PendingInvitationsModal by creating secure RPC function

-- Create RPC function to get pending invitations with enriched user and diagram data
CREATE OR REPLACE FUNCTION get_pending_invitations_with_details(p_user_id UUID)
RETURNS TABLE (
  invitation_id UUID,
  diagram_id UUID,
  diagram_title TEXT,
  diagram_description TEXT,
  permission_level TEXT,
  invitation_message TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  owner_id UUID,
  owner_email TEXT,
  owner_username TEXT,
  owner_avatar_url TEXT,
  invited_by_id UUID,
  invited_by_email TEXT,
  invited_by_username TEXT,
  invited_by_avatar_url TEXT
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