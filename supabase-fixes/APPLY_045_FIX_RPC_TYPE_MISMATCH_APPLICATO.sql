-- APPLY 045: Fix type mismatch in get_pending_team_invitations RPC
-- Status: APPLICATO
-- Purpose: Correggere errore character varying vs TEXT in get_pending_team_invitations()

-- =============================================================================
-- FIX: GET PENDING TEAM INVITATIONS FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION get_pending_team_invitations()
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_description TEXT,
    invited_role TEXT,
    invited_by_email TEXT,
    invited_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        t.description as team_description,
        tm.role as invited_role,
        inviter.email::TEXT as invited_by_email,  -- Cast to TEXT
        tm.joined_at as invited_at
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id  
    JOIN auth.users inviter ON tm.invited_by = inviter.id
    WHERE tm.user_id = current_user_id 
    AND tm.status = 'pending'
    AND t.is_active = true
    ORDER BY tm.joined_at DESC;
END;
$$;

-- =============================================================================
-- FIX: GET TEAM MEMBERS FUNCTION (preventive fix)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_team_members(target_team_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    role TEXT,
    status TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    invited_by_email TEXT
)
SECURITY DEFINER  
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify user has access to this team
    IF NOT EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = target_team_id 
        AND tm.user_id = auth.uid() 
        AND tm.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Access denied to team members';
    END IF;
    
    -- Return team members
    RETURN QUERY
    SELECT 
        tm.user_id,
        u.email::TEXT as user_email,  -- Cast to TEXT
        tm.role,
        tm.status,
        tm.joined_at,
        inviter.email::TEXT as invited_by_email  -- Cast to TEXT
    FROM team_members tm
    JOIN auth.users u ON tm.user_id = u.id
    LEFT JOIN auth.users inviter ON tm.invited_by = inviter.id  
    WHERE tm.team_id = target_team_id
    ORDER BY 
        CASE tm.role 
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2  
            WHEN 'editor' THEN 3
            ELSE 4
        END,
        tm.joined_at ASC;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_pending_team_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members(UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT 'APPLY_045: get_pending_team_invitations function updated' as status, 
       'Fixed character varying to TEXT cast' as fix_applied;
       
SELECT 'APPLY_045: get_team_members function updated' as status, 
       'Added preventive TEXT casts' as fix_applied;