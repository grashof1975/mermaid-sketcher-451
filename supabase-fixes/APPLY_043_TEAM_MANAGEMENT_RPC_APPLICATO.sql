-- APPLY 043: RPC Functions per Team Management
-- Status: APPLICATO
-- Purpose: Creare funzioni RPC per gestione team, inviti e permessi

-- =============================================================================
-- FUNCTION 1: GET USER TEAMS
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
    user_id UUID;
BEGIN
    -- Use provided user_id or current authenticated user
    user_id := COALESCE(target_user_id, auth.uid());
    
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
    JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = user_id AND tm.status = 'active'
    LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.status = 'active'
    LEFT JOIN diagrams d ON t.id = d.team_id
    WHERE t.is_active = true
    GROUP BY t.id, t.name, t.description, tm.role, t.created_at
    ORDER BY is_personal DESC, t.created_at DESC;
END;
$$;

-- =============================================================================
-- FUNCTION 2: GET TEAM MEMBERS  
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
        u.email as user_email,
        tm.role,
        tm.status,
        tm.joined_at,
        inviter.email as invited_by_email
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
-- FUNCTION 3: CREATE TEAM
-- =============================================================================  
CREATE OR REPLACE FUNCTION create_team(
    team_name TEXT,
    team_description TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql  
AS $$
DECLARE
    new_team_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    IF LENGTH(TRIM(team_name)) = 0 THEN
        RAISE EXCEPTION 'Team name cannot be empty';
    END IF;
    
    -- Create the team
    INSERT INTO teams (name, description, created_by)
    VALUES (TRIM(team_name), team_description, current_user_id)
    RETURNING id INTO new_team_id;
    
    -- Add creator as owner
    INSERT INTO team_members (team_id, user_id, role, status, invited_by)
    VALUES (new_team_id, current_user_id, 'owner', 'active', current_user_id);
    
    RETURN new_team_id;
END;
$$;

-- =============================================================================
-- FUNCTION 4: INVITE USER TO TEAM
-- =============================================================================
CREATE OR REPLACE FUNCTION invite_user_to_team(
    target_team_id UUID,
    user_email TEXT,
    user_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE  
    target_user_id UUID;
    current_user_id UUID;
    current_user_role TEXT;
BEGIN
    current_user_id := auth.uid();
    
    -- Verify current user can invite to this team
    SELECT tm.role INTO current_user_role
    FROM team_members tm
    WHERE tm.team_id = target_team_id 
    AND tm.user_id = current_user_id 
    AND tm.status = 'active';
    
    IF current_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Insufficient permissions to invite users';
    END IF;
    
    -- Find target user
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = LOWER(TRIM(user_email));
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = target_team_id AND tm.user_id = target_user_id
    ) THEN
        RAISE EXCEPTION 'User is already a member of this team';
    END IF;
    
    -- Validate role
    IF user_role NOT IN ('viewer', 'editor', 'admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be: viewer, editor, or admin';
    END IF;
    
    -- Create invitation
    INSERT INTO team_members (team_id, user_id, role, status, invited_by)
    VALUES (target_team_id, target_user_id, user_role, 'pending', current_user_id);
    
    RETURN TRUE;
END;
$$;

-- =============================================================================
-- FUNCTION 5: RESPOND TO TEAM INVITATION  
-- =============================================================================
CREATE OR REPLACE FUNCTION respond_to_team_invitation(
    target_team_id UUID,
    accept_invitation BOOLEAN
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$  
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Verify pending invitation exists
    IF NOT EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = target_team_id 
        AND tm.user_id = current_user_id 
        AND tm.status = 'pending'
    ) THEN
        RAISE EXCEPTION 'No pending invitation found for this team';
    END IF;
    
    IF accept_invitation THEN
        -- Accept invitation
        UPDATE team_members 
        SET status = 'active', joined_at = NOW()
        WHERE team_id = target_team_id 
        AND user_id = current_user_id 
        AND status = 'pending';
    ELSE
        -- Decline invitation
        DELETE FROM team_members
        WHERE team_id = target_team_id 
        AND user_id = current_user_id 
        AND status = 'pending';
    END IF;
    
    RETURN TRUE;
END;
$$;

-- =============================================================================
-- FUNCTION 6: GET PENDING TEAM INVITATIONS
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
        inviter.email as invited_by_email,
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
-- GRANT PERMISSIONS  
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_user_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_team(TEXT, TEXT) TO authenticated;  
GRANT EXECUTE ON FUNCTION invite_user_to_team(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_team_invitation(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_team_invitations() TO authenticated;