-- APPLY 026: Confirm grashof@gmail.com email to enable sharing
-- Status: PENDING
-- Problem: grashof@gmail.com exists but email_confirmed_at is NULL
-- Solution: Set email_confirmed_at to enable user lookup in InviteUserModal

-- 🔍 DIAGNOSTIC: Check current email confirmation status
SELECT 
  'APPLY_026_RESULT - BEFORE FIX - grashof email status' as status,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NOT CONFIRMED'
    ELSE '✅ EMAIL CONFIRMED'
  END as confirmation_status,
  created_at
FROM auth.users 
WHERE email = 'grashof@gmail.com';

-- 🔧 FIX: Confirm the email by setting email_confirmed_at
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'grashof@gmail.com' 
  AND email_confirmed_at IS NULL;

-- 🔍 VERIFICATION: Check fix results
SELECT 
  'APPLY_026_RESULT - AFTER FIX - grashof email status' as status,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL STILL NOT CONFIRMED'
    ELSE '✅ EMAIL NOW CONFIRMED'
  END as confirmation_status,
  updated_at
FROM auth.users 
WHERE email = 'grashof@gmail.com';

-- 🧪 TEST: Verify user is now findable for sharing
SELECT 
  'APPLY_026_RESULT - SHARING TEST' as status,
  u.email,
  u.id,
  u.email_confirmed_at,
  COALESCE(p.username, split_part(u.email, '@', 1)) as display_name,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Ready for sharing invites'
    ELSE '❌ Still cannot be invited'
  END as sharing_ready
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'grashof@gmail.com';

-- 🎯 FINAL CONFIRMATION
SELECT 
  'APPLY_026_RESULT - 🎯 FIX CONFIRMATION' as status,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM auth.users 
      WHERE email = 'grashof@gmail.com' 
      AND email_confirmed_at IS NOT NULL
    ) 
    THEN '✅ SUCCESS: grashof@gmail.com email confirmed - sharing should work now!'
    ELSE '❌ FAILED: Email confirmation failed'
  END as result;