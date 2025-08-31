-- DEBUG 024: Check all registered users after APPLY_022
-- Status: PENDING
-- Problem: InviteUserModal still shows "Utente non trovato" for grashof@gmail.com
-- Purpose: Debug what users actually exist and why lookup fails

-- 🔍 DIAGNOSTIC: Check all users in system
SELECT 
  'DEBUG_024_RESULT - All auth.users' as status,
  COUNT(*) as total_users
FROM auth.users;

SELECT 
  'DEBUG_024_RESULT - All profiles' as status,
  COUNT(*) as total_profiles
FROM profiles;

-- Show first 10 auth.users with details
SELECT 
  'DEBUG_024_RESULT - First 10 auth.users' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as email_status
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 10;

-- Show all profiles with their auth.users
SELECT 
  'DEBUG_024_RESULT - All profiles with emails' as status,
  p.id,
  p.username,
  p.full_name,
  u.email,
  u.email_confirmed_at,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 🎯 SPECIFIC CHECK: grashof@gmail.com 
SELECT 
  'DEBUG_024_RESULT - grashof@gmail.com in auth.users' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.aud,
  u.role,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ EMAIL NOT CONFIRMED - This might be the issue!'
    ELSE '✅ EMAIL CONFIRMED'
  END as confirmation_status
FROM auth.users u
WHERE u.email = 'grashof@gmail.com';

-- Check if grashof has a profile
SELECT 
  'DEBUG_024_RESULT - grashof@gmail.com profile' as status,
  p.id,
  p.username,
  p.full_name,
  u.email,
  p.created_at as profile_created,
  u.created_at as user_created
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'grashof@gmail.com';

-- 🧪 SIMULATE EXACT InviteUserModal QUERY
-- This is probably what the frontend is doing
SELECT 
  'DEBUG_024_RESULT - InviteUserModal exact simulation' as status,
  u.id,
  u.email,
  COALESCE(p.username, split_part(u.email, '@', 1)) as display_name,
  u.email_confirmed_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ User not found in auth.users'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ User exists but email not confirmed'
    WHEN p.id IS NULL THEN '⚠️ User exists but no profile'
    ELSE '✅ User ready for invites'
  END as invite_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email ILIKE '%grashof@gmail.com%';

-- Check for partial matches (case insensitive)
SELECT 
  'DEBUG_024_RESULT - Partial email matches' as status,
  u.email,
  u.id,
  u.email_confirmed_at,
  CASE 
    WHEN u.email ILIKE '%grashof%' THEN '🎯 Contains grashof'
    WHEN u.email ILIKE '%gmail%' THEN '📧 Contains gmail'
    ELSE 'Other match'
  END as match_type
FROM auth.users u
WHERE u.email ILIKE '%grashof%' OR u.email ILIKE '%gmail%'
ORDER BY u.email;

-- 📊 SUMMARY: What might be wrong
SELECT 
  'DEBUG_024_RESULT - DIAGNOSIS' as status,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM auth.users WHERE email = 'grashof@gmail.com') 
    THEN '❌ grashof@gmail.com does not exist in auth.users - APPLY_022 failed!'
    
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'grashof@gmail.com' AND email_confirmed_at IS NULL)
    THEN '⚠️ grashof@gmail.com exists but email not confirmed - Frontend might require confirmation'
    
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'grashof@gmail.com') 
         AND NOT EXISTS(SELECT 1 FROM profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = 'grashof@gmail.com')
    THEN '⚠️ grashof@gmail.com exists in auth.users but missing profile - Frontend might require profile'
    
    ELSE '✅ grashof@gmail.com should work - Check frontend query logic'
  END as diagnosis;

-- 🎯 RECOMMENDATION
SELECT 
  'DEBUG_024_RESULT - NEXT STEPS' as status,
  step_number,
  recommendation
FROM (
  VALUES 
    (1, 'Check if grashof@gmail.com actually exists in auth.users'),
    (2, 'Check if email confirmation is required by frontend'),
    (3, 'Check if profile is required by frontend'),
    (4, 'Check exact frontend query in InviteUserModal code'),
    (5, 'Try with a different email that definitely works')
) AS steps(step_number, recommendation);