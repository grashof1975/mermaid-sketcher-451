-- APPLY 022B: Create safe test user for sharing tests
-- Status: PENDING
-- Purpose: Create test user with safe email that doesn't belong to real person
-- Usage: Execute APPLY_022A first to verify safety

-- ⚠️ SAFETY CHECK: Verify no real users will be affected
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM auth.users WHERE email IN (
        'sharing-test@mermaid-sketcher.test',
        'demo-collaborator@mermaid-sketcher.test'
    )) THEN
        RAISE EXCEPTION 'Safety check failed: Test users already exist. Review existing users first.';
    END IF;
    
    RAISE NOTICE '✅ Safety check passed - proceeding with test user creation';
END $$;

-- 🔧 FIX: Create safe test users for sharing functionality
DO $$
DECLARE
    test_user_1_uuid UUID;
    test_user_2_uuid UUID;
BEGIN
    -- Create first test user
    test_user_1_uuid := gen_random_uuid();
    
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
        test_user_1_uuid,
        'authenticated',
        'authenticated', 
        'sharing-test@mermaid-sketcher.test',
        crypt('testpassword123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Create profile for first test user
    INSERT INTO profiles (id, username, full_name, created_at, updated_at)
    VALUES (
        test_user_1_uuid,
        'sharing_test',
        'Sharing Test User',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Created test user: sharing-test@mermaid-sketcher.test (ID: %)', test_user_1_uuid;
    
    -- Create second test user
    test_user_2_uuid := gen_random_uuid();
    
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
        test_user_2_uuid,
        'authenticated',
        'authenticated', 
        'demo-collaborator@mermaid-sketcher.test',
        crypt('testpassword123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Create profile for second test user  
    INSERT INTO profiles (id, username, full_name, created_at, updated_at)
    VALUES (
        test_user_2_uuid,
        'demo_collaborator',
        'Demo Collaborator',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Created test user: demo-collaborator@mermaid-sketcher.test (ID: %)', test_user_2_uuid;
    
END $$;

-- 🔍 VERIFICATION: Check created test users
SELECT 
  'APPLY_022B_RESULT - TEST USERS CREATED' as status,
  u.email,
  p.username,
  p.full_name,
  u.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email IN (
  'sharing-test@mermaid-sketcher.test',
  'demo-collaborator@mermaid-sketcher.test'
)
ORDER BY u.email;

-- 🧪 FINAL TEST: Simulate InviteUserModal lookup
SELECT 
  'APPLY_022B_RESULT - SHARING TEST - InviteUserModal simulation' as test_type,
  u.email,
  u.id,
  COALESCE(p.username, split_part(u.email, '@', 1)) as display_name,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ SUCCESS - User can be invited!'
    ELSE '❌ FAILED - User lookup failed'
  END as sharing_result
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN (
  'sharing-test@mermaid-sketcher.test',
  'demo-collaborator@mermaid-sketcher.test'
);

-- 📋 USAGE INSTRUCTIONS
SELECT 
  'APPLY_022B_RESULT - USAGE INSTRUCTIONS' as info_type,
  instruction_step,
  instruction_text
FROM (
  VALUES 
    (1, 'Test sharing with: sharing-test@mermaid-sketcher.test'),
    (2, 'Test collaboration with: demo-collaborator@mermaid-sketcher.test'),
    (3, 'Both users have password: testpassword123'),
    (4, 'These are safe test accounts - not real people'),
    (5, 'Use these emails in your InviteUserModal for testing')
) AS instructions(instruction_step, instruction_text);