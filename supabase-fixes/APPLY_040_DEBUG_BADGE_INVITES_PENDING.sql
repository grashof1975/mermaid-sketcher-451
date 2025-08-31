-- APPLY 040: Debug badge inviti per problema notifiche
-- Status: PENDING
-- Purpose: Controllo inviti nel database per debug problema badge notifiche

-- 1. Check all pending invitations in the system
SELECT 
    'All Pending Invitations' as check_type,
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
    'Grashof Pending Invitations' as check_type,
    ds.id,
    ds.permission_level,
    ds.invitation_message,
    ds.status,
    ds.created_at,
    owner.email as from_user,
    d.title as diagram_title
FROM diagram_shares ds
JOIN auth.users owner ON ds.owner_id = owner.id
JOIN auth.users shared_with ON ds.shared_with_id = shared_with.id
JOIN diagrams d ON ds.diagram_id = d.id
WHERE shared_with.email = 'grashof@gmail.com'
AND ds.status = 'pending';

-- 3. Count invitations by status for grashof
SELECT 
    'Grashof Invitation Summary' as check_type,
    ds.status,
    COUNT(*) as invitation_count
FROM diagram_shares ds
JOIN auth.users shared_with ON ds.shared_with_id = shared_with.id
WHERE shared_with.email = 'grashof@gmail.com'
GROUP BY ds.status;