-- DEBUG 027: Check exact username for grashof@gmail.com
-- Status: PENDING
-- Purpose: Find out what username grashof@gmail.com actually has in profiles

-- Check what username grashof@gmail.com has
SELECT 
  'DEBUG_027_RESULT - grashof username check' as status,
  u.email,
  u.id,
  p.username,
  p.full_name,
  CASE 
    WHEN p.username IS NULL THEN '❌ NO PROFILE - This is the problem!'
    WHEN p.username = 'grashof' THEN '✅ Username matches email prefix'
    ELSE '⚠️ Username different from email prefix'
  END as username_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'grashof@gmail.com';

-- Check what the frontend search would find
SELECT 
  'DEBUG_027_RESULT - Frontend search simulation' as status,
  p.username,
  p.full_name,
  u.email,
  'Found by username=grashof search' as search_method
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.username = 'grashof';

-- Also check similar usernames
SELECT 
  'DEBUG_027_RESULT - Similar usernames' as status,
  p.username,
  p.full_name,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.username ILIKE '%grashof%';