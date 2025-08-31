-- APPLY 047: Fix ambiguous created_at reference in test functions
-- Status: APPLICATO
-- Purpose: Correggere errore ambiguous created_at in test_get_user_teams()

-- =============================================================================
-- FIX: TEST GET USER TEAMS FUNCTION
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
    -- Qualify created_at with table name to avoid ambiguity
    current_user_uuid := COALESCE(
        test_user_id,
        (SELECT u.id FROM auth.users u ORDER BY u.created_at LIMIT 1)
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
-- FIX: TEST CREATE TEAM FUNCTION (preventive fix)
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
    -- Qualify created_at with table name to avoid ambiguity
    current_user_id := COALESCE(
        test_user_id, 
        (SELECT u.id FROM auth.users u ORDER BY u.created_at LIMIT 1)
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
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION test_get_user_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION test_create_team(TEXT, TEXT, UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT 'APPLY_047: test_get_user_teams function updated' as status,
       'Fixed ambiguous created_at reference' as fix_applied;
       
SELECT 'APPLY_047: test_create_team function updated' as status,
       'Added preventive created_at qualification' as fix_applied;