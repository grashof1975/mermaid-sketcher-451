-- DEBUG 020: Search for users and check grashof@gmail.com
-- This query will help us debug the sharing functionality

-- 1. Check all registered users in auth.users
SELECT 
  'DEBUG_020_RESULT - auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Check all profiles
SELECT 
  'DEBUG_020_RESULT - profiles' as table_name,
  id,
  username,
  full_name,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC;

-- 3. Specifically search for grashof@gmail.com in auth.users
SELECT 
  'DEBUG_020_RESULT - Specific search - auth.users' as search_type,
  id,
  email,
  email_confirmed_at,
  created_at,
  case 
    when email_confirmed_at IS NULL then 'NOT CONFIRMED'
    else 'CONFIRMED'
  end as email_status
FROM auth.users 
WHERE email ILIKE '%grashof@gmail.com%';

-- 4. Specifically search for grashof@gmail.com in profiles
-- NOTE: profiles table doesn't have email field - checking username instead
SELECT 
  'DEBUG_020_RESULT - Specific search - profiles' as search_type,
  id,
  username,
  full_name,
  created_at
FROM profiles 
WHERE username ILIKE '%grashof%';

-- 5. Check if there are any partial matches or similar emails
SELECT 
  'DEBUG_020_RESULT - Similar emails - auth.users' as search_type,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email ILIKE '%grashof%' OR email ILIKE '%gmail%';

-- 6. Check if there are any partial matches in profiles
SELECT 
  'DEBUG_020_RESULT - Similar emails - profiles' as search_type,
  id,
  username,
  full_name,
  created_at
FROM profiles 
WHERE username ILIKE '%grashof%' OR full_name ILIKE '%grashof%';

-- 7. Count total users by table
SELECT 
  'DEBUG_020_RESULT - Total users count' as info,
  'auth.users' as table_name,
  COUNT(*) as total_count
FROM auth.users
UNION ALL
SELECT 
  'DEBUG_020_RESULT - Total users count' as info,
  'profiles' as table_name,
  COUNT(*) as total_count
FROM profiles;

-- 8. Check recent registrations (last 7 days)
SELECT 
  'DEBUG_020_RESULT - Recent registrations (7 days)' as info,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 9. Check for any sharing invitations sent to grashof@gmail.com
-- NOTE: diagram_shares uses shared_with_id (UUID), not shared_with_email
SELECT 
  'DEBUG_020_RESULT - Sharing invitations' as info,
  ds.*,
  u.email as shared_with_email
FROM diagram_shares ds
JOIN auth.users u ON ds.shared_with_id = u.id
WHERE u.email ILIKE '%grashof@gmail.com%';