-- APPLY 046: Create test versions of RPC functions for Query Editor testing
-- Status: APPLICATO  
-- Purpose: Creare versioni test delle RPC functions senza SECURITY DEFINER per testing dal Query Editor

-- =============================================================================
-- TEST VERSION: CREATE TEAM (bypasses authentication)
-- =============================================================================
CREATE OR REPLACE FUNCTION test_create_team(
    team_name TEXT,
    team_description TEXT DEFAULT NULL,
    test_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql  
AS $$
DECLARE
    new_team_id UUID;
    current_user_id UUID;
BEGIN
    -- Use provided test_user_id or first user found
    current_user_id := COALESCE(
        test_user_id, 
        (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
    );
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in database for testing';
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
-- TEST VERSION: GET USER TEAMS (bypasses authentication)
-- =============================================================================
CREATE OR REPLACE FUNCTION test_get_user_teams(test_user_id UUID DEFAULT NULL)
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
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_uuid UUID;
BEGIN
    -- Use provided test_user_id or first user found
    current_user_uuid := COALESCE(
        test_user_id,
        (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
    );
    
    IF current_user_uuid IS NULL THEN
        RAISE EXCEPTION 'No users found in database for testing';
    END IF;
    
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
-- TEST VERSION: GET TEAM MEMBERS (bypasses authentication)  
-- =============================================================================
CREATE OR REPLACE FUNCTION test_get_team_members(
    target_team_id UUID,
    test_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    role TEXT,
    status TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    invited_by_email TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_uuid UUID;
BEGIN
    -- Use provided test_user_id or first user found
    current_user_uuid := COALESCE(
        test_user_id,
        (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
    );
    
    -- For testing, skip access verification
    -- In production, this would verify team membership
    
    -- Return team members
    RETURN QUERY
    SELECT 
        tm.user_id,
        u.email::TEXT as user_email,
        tm.role,
        tm.status,
        tm.joined_at,
        inviter.email::TEXT as invited_by_email
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
-- GRANT PERMISSIONS FOR TEST FUNCTIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION test_create_team(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION test_get_user_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION test_get_team_members(UUID, UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT 'APPLY_046: Test RPC functions created' as status,
       'Functions can be used for Query Editor testing' as note;

-- Show available test functions
SELECT 'APPLY_046: Available test functions' as info, proname as function_name
FROM pg_proc 
WHERE proname LIKE 'test_%'
AND proname IN ('test_create_team', 'test_get_user_teams', 'test_get_team_members')
ORDER BY proname;