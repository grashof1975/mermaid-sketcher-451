-- APPLY 044: Fix ambiguous column reference in get_user_teams RPC
-- Status: APPLICATO
-- Purpose: Correggere errore ambiguous reference user_id in get_user_teams()

-- =============================================================================
-- FIX: GET USER TEAMS FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_teams(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_description TEXT,
    user_role TEXT,
    member_count BIGINT,
    diagram_count BIGINT,
    is_personal BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_uuid UUID;
BEGIN
    -- Use provided user_id or current authenticated user
    -- Renamed variable to avoid ambiguity
    current_user_uuid := COALESCE(target_user_id, auth.uid());
    
    -- Return teams where user is a member
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        t.description as team_description,
        tm.role as user_role,
        COUNT(DISTINCT tm2.id) as member_count,
        COUNT(DISTINCT d.id) as diagram_count,
        (t.name LIKE '%Personal Team') as is_personal,
        t.created_at
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = current_user_uuid AND tm.status = 'active'
    LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.status = 'active'
    LEFT JOIN diagrams d ON t.id = d.team_id
    WHERE t.is_active = true
    GROUP BY t.id, t.name, t.description, tm.role, t.created_at
    ORDER BY is_personal DESC, t.created_at DESC;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_user_teams(UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT 'APPLY_044: get_user_teams function updated' as status, 
       'Fixed ambiguous user_id reference' as fix_applied;