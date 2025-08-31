-- APPLY 042: Migrazione dati esistenti al sistema team-based
-- Status: APPLICATO  
-- Purpose: Migrare dati esistenti da sistema individuale a team-based
-- DEPENDENCIES: APPLY_041_TEAM_BASED_FOUNDATION_PENDING.sql

-- =============================================================================
-- STEP 1: CREATE PERSONAL TEAMS FOR ALL EXISTING USERS
-- =============================================================================

-- Create personal teams for all users
INSERT INTO teams (name, description, created_by)
SELECT 
    COALESCE(
        NULLIF(TRIM(u.email), ''), 
        'User ' || SUBSTRING(u.id::TEXT, 1, 8)
    ) || ' Personal Team' as name,
    'Personal workspace for ' || COALESCE(u.email, 'user') as description,
    u.id as created_by
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM teams t WHERE t.created_by = u.id
);

-- =============================================================================
-- STEP 2: ADD USERS AS OWNERS OF THEIR PERSONAL TEAMS  
-- =============================================================================

-- Make each user the owner of their personal team
INSERT INTO team_members (team_id, user_id, role, status, invited_by)
SELECT 
    t.id as team_id,
    u.id as user_id,
    'owner' as role,
    'active' as status,
    u.id as invited_by  -- Self-invited
FROM auth.users u
JOIN teams t ON t.created_by = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = t.id AND tm.user_id = u.id
);

-- =============================================================================  
-- STEP 3: MIGRATE EXISTING DIAGRAMS TO PERSONAL TEAMS
-- =============================================================================

-- Assign all existing diagrams to their owner's personal team
UPDATE diagrams SET 
    team_id = t.id,
    visibility = 'private'
FROM teams t 
WHERE diagrams.user_id = t.created_by 
AND diagrams.team_id IS NULL;

-- =============================================================================
-- STEP 4: MIGRATE EXISTING SAVED VIEWS TO PERSONAL TEAMS  
-- =============================================================================

-- Assign all existing saved views to their owner's personal team
UPDATE saved_views SET
    team_id = t.id,
    visibility = 'private'  
FROM teams t
WHERE saved_views.user_id = t.created_by
AND saved_views.team_id IS NULL;

-- =============================================================================
-- STEP 5: CONVERT EXISTING DIAGRAM SHARES TO TEAM MEMBERSHIPS
-- =============================================================================

-- For each diagram share, create a shared team if it doesn't exist
-- This is more complex - we'll create teams for each shared diagram group

-- First, let's create teams for diagrams that are currently shared
WITH shared_diagrams AS (
    SELECT DISTINCT 
        ds.diagram_id,
        d.title as diagram_title,
        ds.owner_id,
        owner.email as owner_email
    FROM diagram_shares ds
    JOIN diagrams d ON ds.diagram_id = d.id  
    JOIN auth.users owner ON ds.owner_id = owner.id
    WHERE ds.status = 'accepted'
),
shared_teams_to_create AS (
    SELECT 
        sd.diagram_id,
        sd.owner_id,
        COALESCE(sd.diagram_title, 'Shared Diagram') || ' Team' as team_name,
        'Collaborative team for: ' || COALESCE(sd.diagram_title, 'Untitled Diagram') as team_description
    FROM shared_diagrams sd
    WHERE NOT EXISTS (
        SELECT 1 FROM teams t 
        WHERE t.name = COALESCE(sd.diagram_title, 'Shared Diagram') || ' Team'
        AND t.created_by = sd.owner_id
    )
)
INSERT INTO teams (name, description, created_by)
SELECT team_name, team_description, owner_id
FROM shared_teams_to_create;

-- Add original owners as team owners
INSERT INTO team_members (team_id, user_id, role, status)
SELECT DISTINCT
    t.id as team_id,
    ds.owner_id as user_id,
    'owner' as role,
    'active' as status
FROM diagram_shares ds
JOIN diagrams d ON ds.diagram_id = d.id
JOIN teams t ON t.name = COALESCE(d.title, 'Shared Diagram') || ' Team' 
                AND t.created_by = ds.owner_id
WHERE ds.status = 'accepted'
AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = t.id AND tm.user_id = ds.owner_id
);

-- Add shared users as team members  
INSERT INTO team_members (team_id, user_id, role, status, invited_by)
SELECT DISTINCT
    t.id as team_id,
    ds.shared_with_id as user_id,
    CASE ds.permission_level
        WHEN 'editor' THEN 'editor'
        WHEN 'commenter' THEN 'editor' -- Map commenter to editor for now
        ELSE 'viewer'
    END as role,
    'active' as status,
    ds.owner_id as invited_by
FROM diagram_shares ds  
JOIN diagrams d ON ds.diagram_id = d.id
JOIN teams t ON t.name = COALESCE(d.title, 'Shared Diagram') || ' Team'
                AND t.created_by = ds.owner_id  
WHERE ds.status = 'accepted'
AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = t.id AND tm.user_id = ds.shared_with_id
);

-- Move shared diagrams to their team  
UPDATE diagrams SET
    team_id = t.id,
    visibility = 'team'
FROM diagram_shares ds
JOIN diagrams d ON ds.diagram_id = d.id
JOIN teams t ON t.name = COALESCE(d.title, 'Shared Diagram') || ' Team'
                AND t.created_by = ds.owner_id
WHERE diagrams.id = ds.diagram_id
AND ds.status = 'accepted'
AND diagrams.team_id IS NULL;

-- =============================================================================
-- VERIFICATION QUERIES  
-- =============================================================================

-- Count personal teams created
SELECT 'APPLY_042: Personal teams created' as status, COUNT(*) as count 
FROM teams t
JOIN auth.users u ON t.created_by = u.id
WHERE t.name LIKE '%Personal Team';

-- Count team memberships
SELECT 'APPLY_042: Team memberships created' as status, 
       role, 
       COUNT(*) as count
FROM team_members 
GROUP BY role
ORDER BY role;

-- Count diagrams with teams assigned
SELECT 'APPLY_042: Diagrams with teams' as status,
       visibility,
       COUNT(*) as count  
FROM diagrams
WHERE team_id IS NOT NULL
GROUP BY visibility;

-- Count saved views with teams assigned  
SELECT 'APPLY_042: Saved views with teams' as status,
       visibility, 
       COUNT(*) as count
FROM saved_views  
WHERE team_id IS NOT NULL
GROUP BY visibility;

-- Show sample team structure
SELECT 'APPLY_042: Sample team structure' as status,
       t.name as team_name,
       t.description,
       COUNT(tm.id) as member_count,
       COUNT(d.id) as diagram_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'  
LEFT JOIN diagrams d ON t.id = d.team_id
GROUP BY t.id, t.name, t.description
ORDER BY member_count DESC, diagram_count DESC
LIMIT 10;