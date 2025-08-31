-- DEBUG 033: Quick check of all pending invitations with user details
-- Status: PENDING
-- Purpose: Simple check to see who has pending invites

SELECT 
    'All Pending Invites' as check_type,
    shared_with.email as recipient_email,
    shared_with.id as recipient_user_id,
    owner.email as sender_email,
    ds.permission_level,
    ds.created_at,
    d.title as diagram_title
FROM diagram_shares ds
JOIN auth.users shared_with ON ds.shared_with_id = shared_with.id
JOIN auth.users owner ON ds.owner_id = owner.id
JOIN diagrams d ON ds.diagram_id = d.id
WHERE ds.status = 'pending'
ORDER BY ds.created_at DESC;