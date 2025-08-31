-- POPULATE 021: Create test users for sharing functionality testing
-- SCHEMA CORRECTED: Must create in auth.users first, then profiles
-- Note: profiles table does NOT have email field - email is in auth.users

⚠️ WARNING: This SQL is BROKEN and needs major revision
-- Problem: Cannot insert directly into auth.users from SQL
-- Solution: Use APPLY_022B_CREATE_SAFE_TEST_USER_PENDING.sql instead

-- This file is kept for reference but should NOT be executed
-- The correct approach is in APPLY_022B which creates users safely

SELECT 'POPULATE_021_RESULT - FILE STATUS' as status,
       'DEPRECATED - Use APPLY_022B instead' as message,
       'This SQL has schema errors and cannot work' as reason;

-- CORRECTED QUERIES: Check existing users instead
SELECT 
    'POPULATE_021_RESULT - Existing auth.users' as status,
    u.id,
    u.email,
    u.created_at,
    CASE WHEN p.id IS NOT NULL THEN 'Has profile' ELSE 'Missing profile' END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN ('grashof@gmail.com', 'test1@example.com', 'test2@example.com')
ORDER BY u.email;

-- Count all users correctly
SELECT 
    'POPULATE_021_RESULT - Total users in system' as info,
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
    'POPULATE_021_RESULT - Total users in system' as info,
    'profiles' as table_name,
    COUNT(*) as user_count
FROM profiles;

-- Show recent auth.users (created in last hour)
SELECT 
    'POPULATE_021_RESULT - Recent auth.users (1 hour)' as info,
    u.email,
    u.created_at,
    COALESCE(p.username, split_part(u.email, '@', 1)) as display_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC;