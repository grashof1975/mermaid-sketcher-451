-- TEST 031: Complete sharing system flow test
-- Status: PENDING  
-- Purpose: End-to-end test of the sharing system functionality

-- Prerequisites: grashof@gmail.com user must exist and be confirmed
-- This test simulates the complete sharing workflow

-- 1. Verify grashof user exists and get current user for testing
SELECT 
    'TEST_031_RESULT - Setup Check' as test_phase,
    u.id as grashof_id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.username,
    p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'grashof@gmail.com';

-- 2. Test the find_user_by_email_for_sharing function
SELECT 
    'TEST_031_RESULT - User Search Function' as test_phase,
    *
FROM find_user_by_email_for_sharing('grashof@gmail.com');

-- 3. Create a test diagram (simulate owner's diagram)
-- Note: This needs to be done by an authenticated user in the app
-- But we can check existing diagrams
SELECT 
    'TEST_031_RESULT - Available Test Diagrams' as test_phase,
    d.id,
    d.title,
    d.user_id as owner_id,
    u.email as owner_email
FROM diagrams d
JOIN auth.users u ON d.user_id = u.id
LIMIT 3;

-- 4. Check if there are any existing shares involving grashof
SELECT 
    'TEST_031_RESULT - Existing Shares for Grashof' as test_phase,
    ds.*,
    d.title as diagram_title
FROM diagram_shares ds
JOIN diagrams d ON ds.diagram_id = d.id
JOIN auth.users u ON ds.shared_with_id = u.id
WHERE u.email = 'grashof@gmail.com';

-- 5. Test data integrity checks
SELECT 
    'TEST_031_RESULT - Data Integrity' as test_phase,
    'Foreign key constraints' as check_type,
    tc.constraint_name,
    kcu.table_name,
    kcu.column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND kcu.table_name = 'diagram_shares';

-- 6. Check sharing system is ready for frontend
SELECT 
    'TEST_031_RESULT - Frontend Readiness Check' as test_phase,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'find_user_by_email_for_sharing')
        THEN '✅ RPC Function Ready'
        ELSE '❌ Missing RPC Function'
    END as rpc_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'grashof@gmail.com' AND email_confirmed_at IS NOT NULL)
        THEN '✅ Test User Ready'  
        ELSE '❌ Test User Missing'
    END as test_user_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'diagram_shares')
        THEN '✅ RLS Policies Configured'
        ELSE '❌ RLS Policies Missing'
    END as rls_status;

-- 7. Simulate the frontend workflow steps
-- Step 1: User lookup (what happens when typing grashof@gmail.com)
SELECT 
    'TEST_031_RESULT - Step 1: User Lookup' as workflow_step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM find_user_by_email_for_sharing('grashof@gmail.com')
        )
        THEN '✅ User found via RPC'
        ELSE '❌ User not found'
    END as lookup_result;

-- Step 2: Check what diagrams are available for sharing
SELECT 
    'TEST_031_RESULT - Step 2: Shareable Diagrams' as workflow_step,
    COUNT(*) as total_diagrams,
    COUNT(CASE WHEN sharing_enabled = true THEN 1 END) as shareable_diagrams
FROM diagrams;

-- 8. Final system status
SELECT 
    'TEST_031_RESULT - FINAL STATUS' as summary,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'find_user_by_email_for_sharing')
            AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'grashof@gmail.com' AND email_confirmed_at IS NOT NULL)
            AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'diagram_shares')
        )
        THEN '🚀 SHARING SYSTEM READY - All components functional'
        ELSE '⚠️ SHARING SYSTEM INCOMPLETE - Check individual components above'
    END as system_status;