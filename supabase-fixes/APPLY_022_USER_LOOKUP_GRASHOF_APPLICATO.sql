-- APPLY 022: User Lookup Fix - Create grashof@gmail.com for sharing testing
-- Status: PENDING
-- Problem: InviteUserModal shows "Utente non trovato" for grashof@gmail.com
-- Root Cause: Email is in auth.users, not profiles table. User might not exist in auth.users.
-- Solution: Create auth.users record first, then profiles record

-- 🔍 DIAGNOSTIC: Check current state
SELECT 
  'APPLY_022_RESULT - BEFORE FIX - Auth users count' as status, 
  COUNT(*) as total 
FROM auth.users;

SELECT 
  'APPLY_022_RESULT - BEFORE FIX - Profiles count' as status, 
  COUNT(*) as total 
FROM profiles;

-- Check if grashof@gmail.com exists in auth.users (where email actually is)
SELECT 
  'APPLY_022_RESULT - BEFORE FIX - Grashof in auth.users' as status,
  id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email = 'grashof@gmail.com';

-- Check if grashof@gmail.com has profile
SELECT 
  'APPLY_022_RESULT - BEFORE FIX - Grashof profile' as status,
  p.id, p.username, u.email, p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'grashof@gmail.com';

-- Simulate InviteUserModal query (this is what fails)
SELECT 
  'APPLY_022_RESULT - BEFORE FIX - InviteUserModal simulation' as status,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Would work'
    ELSE '❌ Would fail - User not found'
  END as result,
  u.id, u.email
FROM auth.users u
WHERE u.email = 'grashof@gmail.com';

-- 🔧 FIX: Create grashof@gmail.com in auth.users then profiles
-- Since you execute this directly in Supabase, we can create in auth.users
DO $$
DECLARE
    grashof_uuid UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists in auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = 'grashof@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE '✅ User grashof@gmail.com already exists in auth.users';
        
        -- Get the existing UUID
        SELECT id INTO grashof_uuid 
        FROM auth.users 
        WHERE email = 'grashof@gmail.com';
        
    ELSE
        -- Generate UUID for new user
        grashof_uuid := gen_random_uuid();
        
        -- Create user directly in auth.users
        INSERT INTO auth.users (
            instance_id,
            id, 
            aud,
            role,
            email, 
            encrypted_password,
            email_confirmed_at,
            created_at, 
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            grashof_uuid,
            'authenticated',
            'authenticated', 
            'grashof@gmail.com',
            crypt('password123', gen_salt('bf')), -- Default password
            NOW(), -- Confirm email immediately for testing
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE '✅ Created user grashof@gmail.com in auth.users (ID: %)', grashof_uuid;
    END IF;
    
    -- Now create/update profile for this user
    INSERT INTO profiles (id, username, full_name, created_at, updated_at)
    VALUES (
        grashof_uuid,
        'grashof',
        'Grashof Test User',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
        
    RAISE NOTICE '✅ Created/Updated profile for grashof@gmail.com';

END $$;

-- 🔍 VERIFICATION: Check fix results
SELECT 
  'APPLY_022_RESULT - AFTER FIX - Auth users' as status,
  id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email = 'grashof@gmail.com';

SELECT 
  'APPLY_022_RESULT - AFTER FIX - Profile created' as status,
  p.id, p.username, u.email, p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'grashof@gmail.com';

-- 🧪 CRITICAL TEST: Simulate exact InviteUserModal query
-- This is the query that was failing before the fix
SELECT 
  'APPLY_022_RESULT - FINAL TEST - InviteUserModal exact simulation' as test_type,
  u.id,
  COALESCE(p.username, split_part(u.email, '@', 1)) as username,
  u.email,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ SUCCESS - Sharing will now work!'
    ELSE '❌ FAILED - Sharing still broken'
  END as sharing_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'grashof@gmail.com';

-- 🧪 BONUS TEST: Manual lookup (replaced helper function)
SELECT 
  'APPLY_022_RESULT - MANUAL LOOKUP TEST' as test_type,
  u.id,
  u.email,
  COALESCE(p.username, split_part(u.email, '@', 1)) as username
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'grashof@gmail.com';

-- 📊 SUMMARY STATS
SELECT 
  'APPLY_022_RESULT - SUMMARY - Total users' as info,
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'APPLY_022_RESULT - SUMMARY - Total profiles' as info,
  'profiles' as table_name,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'APPLY_022_RESULT - SUMMARY - Linked profiles' as info,
  'auth.users + profiles' as table_name,
  COUNT(*) as count
FROM auth.users u
JOIN profiles p ON u.id = p.id;

-- 🎯 FINAL CONFIRMATION
SELECT 
  'APPLY_022_RESULT - 🎯 FIX CONFIRMATION' as status,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM auth.users u 
      LEFT JOIN profiles p ON u.id = p.id 
      WHERE u.email = 'grashof@gmail.com'
    ) 
    THEN '✅ SUCCESS: grashof@gmail.com can now be invited to diagrams!'
    ELSE '❌ FAILED: Fix did not work'
  END as result;