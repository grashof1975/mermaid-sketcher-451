-- DEBUG 036: Test accepting an invitation manually
-- Status: PENDING
-- Purpose: Test if we can manually update invitation status

-- First, let's see the current invitations for grashof
SELECT 
    'Before Update' as test_phase,
    id as invitation_id,
    diagram_id,
    status,
    permission_level,
    created_at
FROM diagram_shares 
WHERE shared_with_id = 'ab4871e2-2956-4816-8c48-2305d1bf575d'
AND status = 'pending'
ORDER BY created_at DESC;

-- Try to accept the first invitation (use the ID from the result above)
-- Replace 'invitation-id-here' with actual ID from the query above
UPDATE diagram_shares 
SET status = 'accepted' 
WHERE id = (
    SELECT id FROM diagram_shares 
    WHERE shared_with_id = 'ab4871e2-2956-4816-8c48-2305d1bf575d'
    AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
);

-- Check if the update worked
SELECT 
    'After Update' as test_phase,
    id as invitation_id,
    diagram_id,
    status,
    permission_level,
    created_at
FROM diagram_shares 
WHERE shared_with_id = 'ab4871e2-2956-4816-8c48-2305d1bf575d'
ORDER BY created_at DESC;