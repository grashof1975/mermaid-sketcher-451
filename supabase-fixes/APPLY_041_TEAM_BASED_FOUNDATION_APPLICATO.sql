-- APPLY 041: Team-Based Sharing Strategy - Foundation
-- Status: APPLICATO
-- Purpose: Implementare tabelle base per sistema team-based sharing

-- =============================================================================
-- STEP 1: CREATE TEAMS TABLE
-- =============================================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT teams_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT teams_name_length CHECK (LENGTH(name) <= 100)
);

-- =============================================================================  
-- STEP 2: CREATE TEAM_MEMBERS TABLE
-- =============================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer')) DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
  
  -- Unique constraint: un utente può appartenere a un team una sola volta
  UNIQUE(team_id, user_id)
);

-- =============================================================================
-- STEP 3: ADD TEAM COLUMNS TO EXISTING TABLES  
-- =============================================================================

-- Add team support to diagrams table
ALTER TABLE diagrams 
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT CHECK (visibility IN ('private', 'team', 'public')) DEFAULT 'private';

-- Add team support to saved_views table  
ALTER TABLE saved_views
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT CHECK (visibility IN ('private', 'team', 'public')) DEFAULT 'private';

-- =============================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Teams indexes
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_active ON teams(is_active) WHERE is_active = true;

-- Team members indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_active_members ON team_members(team_id, status) WHERE status = 'active';

-- Diagrams team indexes
CREATE INDEX idx_diagrams_team_id ON diagrams(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_diagrams_visibility ON diagrams(visibility);
CREATE INDEX idx_diagrams_team_visibility ON diagrams(team_id, visibility) WHERE team_id IS NOT NULL;

-- Saved views team indexes  
CREATE INDEX idx_saved_views_team_id ON saved_views(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_saved_views_visibility ON saved_views(visibility);

-- =============================================================================
-- STEP 5: CREATE TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for teams table
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Teams policies: Users can see teams they belong to
CREATE POLICY "Users can view teams they belong to" ON teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Teams policies: Only team owners/admins can update teams
CREATE POLICY "Team owners and admins can update teams" ON teams
    FOR UPDATE USING (
        id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND status = 'active' 
            AND role IN ('owner', 'admin')
        )
    );

-- Team members policies: Users can see members of teams they belong to
CREATE POLICY "Users can view team members of their teams" ON team_members
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Team members policies: Only team owners/admins can manage members
CREATE POLICY "Team owners and admins can manage members" ON team_members
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND status = 'active' 
            AND role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify tables were created successfully
SELECT 'APPLY_041: Teams table created' as status, COUNT(*) as count FROM teams;
SELECT 'APPLY_041: Team members table created' as status, COUNT(*) as count FROM team_members;

-- Verify columns were added
SELECT 'APPLY_041: Diagrams team_id column added' as status, 
       COUNT(*) as total_diagrams,
       COUNT(team_id) as diagrams_with_team
FROM diagrams;

SELECT 'APPLY_041: Saved views team_id column added' as status,
       COUNT(*) as total_views,  
       COUNT(team_id) as views_with_team
FROM saved_views;