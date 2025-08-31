-- APPLY 030: Configure RLS policies for sharing system
-- Status: PENDING
-- Purpose: Ensure proper Row Level Security for diagram sharing functionality

-- 1. Enable RLS on diagram_shares table (if not already enabled)
ALTER TABLE diagram_shares ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users can see shares where they are involved (owner, shared_with, or invited_by)
CREATE POLICY "Users can access their diagram shares" ON diagram_shares
    FOR ALL USING (
        auth.uid() = owner_id OR 
        auth.uid() = shared_with_id OR 
        auth.uid() = invited_by
    );

-- 3. Policy: Users can insert shares for diagrams they own
CREATE POLICY "Users can create shares for owned diagrams" ON diagram_shares
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM diagrams 
            WHERE diagrams.id = diagram_shares.diagram_id 
            AND diagrams.user_id = auth.uid()
        )
    );

-- 4. Policy: Users can update shares where they are the owner or recipient
CREATE POLICY "Users can update relevant diagram shares" ON diagram_shares
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        auth.uid() = shared_with_id
    ) WITH CHECK (
        auth.uid() = owner_id OR 
        auth.uid() = shared_with_id
    );

-- 5. Policy: Users can delete shares for diagrams they own
CREATE POLICY "Users can delete shares for owned diagrams" ON diagram_shares
    FOR DELETE USING (
        auth.uid() = owner_id
    );

-- 6. Enhanced diagrams policy: Users can see diagrams shared with them
DROP POLICY IF EXISTS "Users can access shared diagrams" ON diagrams;
CREATE POLICY "Users can access shared diagrams" ON diagrams
    FOR SELECT USING (
        user_id = auth.uid() OR 
        is_public = true OR
        EXISTS (
            SELECT 1 FROM diagram_shares 
            WHERE diagram_shares.diagram_id = diagrams.id 
            AND diagram_shares.shared_with_id = auth.uid()
            AND diagram_shares.status = 'accepted'
        )
    );

-- 7. Policy: Users can update diagrams based on their permission level
DROP POLICY IF EXISTS "Users can update shared diagrams based on permissions" ON diagrams;
CREATE POLICY "Users can update shared diagrams based on permissions" ON diagrams
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM diagram_shares 
            WHERE diagram_shares.diagram_id = diagrams.id 
            AND diagram_shares.shared_with_id = auth.uid()
            AND diagram_shares.status = 'accepted'
            AND diagram_shares.permission_level = 'editor'
        )
    );

-- 8. Test the policies
SELECT 
    'APPLY_030_RESULT - RLS Policies Created' as status,
    'diagram_shares and diagrams policies configured' as message;

-- 9. Verify policies were created
SELECT 
    'APPLY_030_RESULT - Policy Verification' as status,
    schemaname,
    tablename,
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE tablename IN ('diagram_shares', 'diagrams')
AND policyname LIKE '%shared%' OR policyname LIKE '%diagram shares%'
ORDER BY tablename, policyname;