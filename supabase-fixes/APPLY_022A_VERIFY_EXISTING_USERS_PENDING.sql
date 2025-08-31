-- APPLY 022A: Verify existing users before creating test accounts
-- Status: PENDING
-- Purpose: Check what users already exist before creating grashof@gmail.com
-- Safety: Don't create fake accounts for real people

-- 🔍 DIAGNOSTIC: Check all existing users
SELECT 
  'APPLY_022A_RESULT - EXISTING USERS - All auth.users' as status,
  COUNT(*) as total_count
FROM auth.users;

-- Show first 10 users with details
SELECT 
  'APPLY_022A_RESULT - EXISTING USERS - Details' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Has profile'
    ELSE '❌ Missing profile'
  END as profile_status,
  p.username
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 🎯 SPECIFIC CHECK: Look for grashof
SELECT 
  'APPLY_022A_RESULT - GRASHOF CHECK' as check_type,
  u.email,
  u.id,
  u.created_at,
  CASE 
    WHEN u.email = 'grashof@gmail.com' THEN '⚠️ EXACT MATCH - Real user exists!'
    WHEN u.email ILIKE '%grashof%' THEN '⚠️ SIMILAR EMAIL - Check if real person'
    ELSE 'No grashof found'
  END as grashof_status
FROM auth.users u
WHERE u.email ILIKE '%grashof%'
UNION ALL
SELECT 
  'APPLY_022A_RESULT - GRASHOF CHECK' as check_type,
  'grashof@gmail.com' as email,
  NULL as id,
  NULL as created_at,
  'EMAIL NOT FOUND - Safe to create test user' as grashof_status
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email ILIKE '%grashof%');

-- 🔍 CHECK: Look for other gmail accounts that might be test accounts
SELECT 
  'APPLY_022A_RESULT - GMAIL ACCOUNTS' as check_type,
  u.email,
  u.created_at,
  CASE 
    WHEN u.email LIKE '%test%' OR u.email LIKE '%demo%' THEN '✅ Looks like test account'
    ELSE '⚠️ Might be real user'
  END as account_type
FROM auth.users u
WHERE u.email LIKE '%@gmail.com'
ORDER BY u.created_at DESC
LIMIT 5;

-- 📊 RECOMMENDATION BASED ON FINDINGS
SELECT 
  'APPLY_022A_RESULT - RECOMMENDATION' as advice_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'grashof@gmail.com') 
    THEN '❌ DO NOT CREATE - grashof@gmail.com already exists. Use existing user or choose different email.'
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email ILIKE '%grashof%') 
    THEN '⚠️ CAUTION - Similar grashof email exists. Verify if real person before creating.'
    ELSE '✅ SAFE TO CREATE - No grashof email found. Can create test user.'
  END as recommendation;

-- 🎯 ALTERNATIVE: Show available test-safe emails
SELECT 
  'APPLY_022A_RESULT - SAFE TEST EMAILS' as suggestion_type,
  email_suggestion,
  'These would be safe for testing' as note
FROM (
  VALUES 
    ('test-user-1@mermaid-sketcher.test'),
    ('demo-collaborator@mermaid-sketcher.test'), 
    ('sharing-test@mermaid-sketcher.test'),
    ('invite-test@example.test'),
    ('collab-demo@example.test')
) AS suggestions(email_suggestion)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users 
  WHERE email = suggestions.email_suggestion
);

-- 📋 SUMMARY: What to do next
SELECT 
  'APPLY_022A_RESULT - NEXT STEPS' as action_type,
  step_number,
  step_description
FROM (
  VALUES 
    (1, 'Review the EXISTING USERS list above'),
    (2, 'Check the GRASHOF CHECK results'),
    (3, 'Read the RECOMMENDATION'),
    (4, 'If safe: use APPLY_022B with chosen email'),
    (5, 'If not safe: pick alternative from SAFE TEST EMAILS')
) AS steps(step_number, step_description);