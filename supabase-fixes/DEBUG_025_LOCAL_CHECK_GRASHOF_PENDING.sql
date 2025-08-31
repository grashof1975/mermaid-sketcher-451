-- DEBUG 025: Check local database for grashof@gmail.com location
-- Status: PENDING
-- Purpose: Find exactly where grashof@gmail.com is stored in the current database
-- Note: User will execute this locally and paste results

-- 1. CHECK auth.users for grashof@gmail.com
SELECT 
  'DEBUG_025_RESULT - auth.users search' as table_check,
  COUNT(*) as total_rows_with_grashof
FROM auth.users 
WHERE email ILIKE '%grashof%';

SELECT 
  'DEBUG_025_RESULT - auth.users details' as table_check,
  id,
  email,
  email_confirmed_at,
  created_at,
  aud,
  role
FROM auth.users 
WHERE email ILIKE '%grashof%'
LIMIT 5;

-- 2. CHECK profiles for any grashof reference
SELECT 
  'DEBUG_025_RESULT - profiles search by username' as table_check,
  COUNT(*) as total_rows_with_grashof
FROM profiles 
WHERE username ILIKE '%grashof%';

SELECT 
  'DEBUG_025_RESULT - profiles details by username' as table_check,
  id,
  username,
  full_name,
  created_at
FROM profiles 
WHERE username ILIKE '%grashof%'
LIMIT 5;

-- 3. CONFIRMED: profiles table does NOT have email field (as expected from schema)
SELECT 'DEBUG_025_RESULT - profiles email field test' as table_check,
       'CONFIRMED: profiles table has NO email field' as result;

-- 4. CROSS CHECK - Join auth.users with profiles for grashof
SELECT 
  'DEBUG_025_RESULT - JOIN auth.users + profiles' as table_check,
  u.email,
  u.id as user_id,
  p.id as profile_id,
  p.username,
  p.full_name,
  u.created_at as user_created,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email ILIKE '%grashof%';

-- 5. CHECK all email addresses in auth.users (to see the pattern)
SELECT 
  'DEBUG_025_RESULT - All emails in auth.users' as table_check,
  email,
  created_at,
  CASE WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED' ELSE 'CONFIRMED' END as status
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 6. CHECK all usernames in profiles (to see the pattern)
SELECT 
  'DEBUG_025_RESULT - All usernames in profiles' as table_check,
  username,
  full_name,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 7. SUMMARY - Where is grashof?
SELECT 
  'DEBUG_025_RESULT - SUMMARY' as summary_type,
  'auth.users' as table_name,
  COUNT(*) as grashof_count
FROM auth.users 
WHERE email ILIKE '%grashof%'
UNION ALL
SELECT 
  'DEBUG_025_RESULT - SUMMARY' as summary_type,
  'profiles (username)' as table_name,
  COUNT(*) as grashof_count
FROM profiles 
WHERE username ILIKE '%grashof%';