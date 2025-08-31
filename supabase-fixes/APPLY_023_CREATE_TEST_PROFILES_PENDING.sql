-- APPLY 023: Create test profiles for existing auth.users
-- Status: PENDING  
-- Problem: Need test users for sharing but cannot create auth.users directly
-- Solution: Create profiles for existing auth.users that don't have profiles yet

-- 🔍 DIAGNOSTIC: Check current state
SELECT 
  'APPLY_023_RESULT - Users without profiles' as status,
  u.id, 
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at
LIMIT 10;

-- Count users vs profiles
SELECT 
  'APPLY_023_RESULT - Total auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'APPLY_023_RESULT - Total profiles' as table_name,
  COUNT(*) as count  
FROM profiles
UNION ALL
SELECT 
  'APPLY_023_RESULT - Users missing profiles' as table_name,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 🔧 FIX: Create profiles for auth.users that don't have them
-- This creates profiles for existing authenticated users
INSERT INTO profiles (id, username, full_name, created_at, updated_at)
SELECT 
  u.id,
  CASE 
    -- If email contains @gmail.com, use part before @
    WHEN u.email LIKE '%@gmail.com' THEN split_part(u.email, '@', 1)
    -- For other emails, use first part + domain
    ELSE CONCAT(split_part(u.email, '@', 1), '_', split_part(split_part(u.email, '@', 2), '.', 1))
  END as username,
  CASE 
    WHEN u.email LIKE '%@gmail.com' THEN CONCAT(INITCAP(split_part(u.email, '@', 1)), ' User')
    ELSE CONCAT('User ', split_part(u.email, '@', 1))
  END as full_name,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL -- Only create for users without profiles
ON CONFLICT (id) DO NOTHING; -- In case profile gets created during execution

-- 🔍 VERIFICATION: Check what was created
SELECT 
  'APPLY_023_RESULT - AFTER FIX - New profiles created' as status,
  u.email,
  p.username,
  p.full_name,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.updated_at >= NOW() - INTERVAL '1 minute'
ORDER BY p.updated_at DESC;

-- 🧪 TEST: Now test sharing lookup with real users
SELECT 
  'APPLY_023_RESULT - SHARING TEST - Available users for invites' as test_type,
  u.email,
  p.username,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Can be invited'
    ELSE '❌ Missing profile'
  END as invite_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.email
LIMIT 5;

-- 🎯 SPECIFIC TEST: Check if any user has grashof in email
SELECT 
  'APPLY_023_RESULT - GRASHOF SEARCH' as test_type,
  u.email,
  p.username,
  CASE 
    WHEN u.email ILIKE '%grashof%' AND p.id IS NOT NULL THEN '✅ Found grashof user with profile'
    WHEN u.email ILIKE '%grashof%' AND p.id IS NULL THEN '⚠️ Found grashof user but no profile'
    ELSE 'No grashof found'
  END as grashof_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email ILIKE '%grashof%'
OR u.email ILIKE '%gmail%';

-- 📊 SUMMARY: Final counts  
SELECT 
  'APPLY_023_RESULT - FINAL SUMMARY' as summary,
  'After profile creation' as description,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as missing_profiles;