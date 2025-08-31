-- TEST 034: Create test invitation for current user to see badge
-- Status: PENDING
-- Purpose: Create invitation for currently logged user to test badge functionality

-- First, let's see who is the current owner (gianni.conte@gmail.com)
SELECT 
    'Current User Check' as check_type,
    id as user_id,
    email
FROM auth.users 
WHERE email = 'gianni.conte@gmail.com';

-- Get one of gianni's diagrams to share back to him (for testing)
SELECT 
    'Gianni Diagrams' as check_type,
    id as diagram_id,
    title,
    user_id
FROM diagrams 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'gianni.conte@gmail.com'
)
LIMIT 3;

-- Create a test invitation from grashof to gianni (reverse direction for testing)
-- Note: This is just for testing the badge - normally you'd use the frontend
INSERT INTO diagram_shares (
    diagram_id,
    owner_id,
    shared_with_id,
    permission_level,
    status,
    invitation_message,
    created_at,
    expires_at
)
SELECT 
    d.id as diagram_id,
    grashof.id as owner_id,
    gianni.id as shared_with_id,
    'viewer' as permission_level,
    'pending' as status,
    'Test invitation to see badge functionality' as invitation_message,
    NOW() as created_at,
    NOW() + INTERVAL '7 days' as expires_at
FROM diagrams d
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'grashof@gmail.com') grashof
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'gianni.conte@gmail.com') gianni
WHERE d.user_id = grashof.id
LIMIT 1;

-- Verify the test invitation was created
SELECT 
    'Test Invitation Created' as check_type,
    ds.id,
    shared_with.email as recipient,
    owner.email as sender,
    ds.permission_level,
    ds.status,
    d.title as diagram_title
FROM diagram_shares ds
JOIN auth.users shared_with ON ds.shared_with_id = shared_with.id
JOIN auth.users owner ON ds.owner_id = owner.id
JOIN diagrams d ON ds.diagram_id = d.id
WHERE shared_with.email = 'gianni.conte@gmail.com'
AND ds.status = 'pending'
ORDER BY ds.created_at DESC
LIMIT 1;