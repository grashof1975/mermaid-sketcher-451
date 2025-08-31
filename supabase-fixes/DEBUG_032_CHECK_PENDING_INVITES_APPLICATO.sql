-- DEBUG 032: Check if pending invitations were created correctly
-- Status: PENDING
-- Purpose: Verify that invitations to grashof@gmail.com are in the database

-- 1. Check all pending invitations in the system
SELECT 
    'DEBUG_032_RESULT - All Pending Invitations' as check_type,
    ds.id,
    ds.diagram_id,
    ds.permission_level,
    ds.status,
    ds.created_at,
    owner.email as owner_email,
    shared_with.email as shared_with_email,
    d.title as diagram_title
FROM diagram_shares ds
JOIN auth.users owner ON ds.owner_id = owner.id
JOIN auth.users shared_with ON ds.shared_with_id = shared_with.id
JOIN diagrams d ON ds.diagram_id = d.id
WHERE ds.status = 'pending'
ORDER BY ds.created_at DESC;

-- 2. Specifically check invitations for grashof@gmail.com
SELECT 
    'DEBUG_032_RESULT - Grashof Pending Invitations' as check_type,
    ds.id,
    ds.permission_level,
    ds.invitation_message,
    ds.status,
    ds.created_at,
    owner.email as from_user,
    d.title as diagram_title,
    CASE 
        WHEN ds.expires_at IS NULL THEN 'Never expires'
        WHEN ds.expires_at > NOW() THEN 'Active'
        ELSE 'Expired'
    END as invite_status
FROM diagram_shares ds
JOIN auth.users owner ON ds.owner_id = owner.id
JOIN auth.users shared_with ON ds.shared_with_id = shared_with.id
JOIN diagrams d ON ds.diagram_id = d.id
WHERE shared_with.email = 'grashof@gmail.com'
AND ds.status = 'pending';

-- 3. Count invitations by status for grashof
SELECT 
    'DEBUG_032_RESULT - Grashof Invitation Summary' as check_type,
    ds.status,
    COUNT(*) as invitation_count
FROM diagram_shares ds
JOIN auth.users shared_with ON ds.shared_with_id = shared_with.id
WHERE shared_with.email = 'grashof@gmail.com'
GROUP BY ds.status;

-- 4. Check if grashof user ID is correct in shares
SELECT 
    'DEBUG_032_RESULT - Grashof User ID Check' as check_type,
    u.id as grashof_user_id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    COUNT(ds.id) as total_shares_as_recipient
FROM auth.users u
LEFT JOIN diagram_shares ds ON ds.shared_with_id = u.id
WHERE u.email = 'grashof@gmail.com'
GROUP BY u.id, u.email, u.email_confirmed_at;