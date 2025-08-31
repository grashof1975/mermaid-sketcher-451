-- Create RPC function to get shared views for a user
-- This function retrieves all views shared with a specific user along with owner info

-- Drop existing function if it exists (to handle return type changes)
DROP FUNCTION IF EXISTS get_shared_views_for_user(uuid);

CREATE OR REPLACE FUNCTION get_shared_views_for_user(p_user_id uuid)
RETURNS TABLE (
  view_id uuid,
  view_name text,
  view_zoom numeric,
  view_pan_x numeric,
  view_pan_y numeric,
  view_created_at timestamptz,
  view_tags text[],
  owner_id uuid,
  owner_email text,
  permission_level text,
  shared_at timestamptz
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
    svs.owner_id,
    p.email as owner_email,
    svs.permission_level,
    svs.created_at as shared_at
  FROM saved_views_shares svs
  JOIN saved_views sv ON svs.saved_view_id = sv.id
  JOIN auth.users au ON svs.owner_id = au.id
  JOIN profiles p ON svs.owner_id = p.id
  WHERE svs.shared_with_id = p_user_id
    AND svs.status = 'accepted'
    AND sv.user_id = svs.owner_id -- Ensure view belongs to owner
  ORDER BY svs.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_shared_views_for_user(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_shared_views_for_user(uuid) IS 'Retrieves all views shared with a specific user along with owner information';