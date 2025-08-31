-- CHECK 029: Verify sharing system backend requirements
-- Status: PENDING
-- Purpose: Check all necessary functions and permissions for sharing system

-- 1. Check if find_user_by_email_for_sharing function exists
SELECT 
    'CHECK_029_RESULT - RPC Function Status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'find_user_by_email_for_sharing'
        ) THEN '✅ Function exists'
        ELSE '❌ Function missing - Execute APPLY_028'
    END as function_status;

-- 2. Test if the function works (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'find_user_by_email_for_sharing'
    ) THEN
        -- Test the function
        PERFORM find_user_by_email_for_sharing('grashof@gmail.com');
        RAISE NOTICE 'CHECK_029_RESULT - Function test: Function callable';
    ELSE
        RAISE NOTICE 'CHECK_029_RESULT - Function test: Function does not exist';
    END IF;
END $$;

-- 3. Check if other needed RPC functions exist
SELECT 
    'CHECK_029_RESULT - Other RPC Functions' as check_type,
    routine_name,
    CASE 
        WHEN routine_name = 'get_user_diagram_permission' THEN '📝 Permission checker'
        WHEN routine_name = 'log_sharing_activity' THEN '📊 Activity logger'
        WHEN routine_name = 'get_folder_views' THEN '📁 Folder views'
        WHEN routine_name = 'move_view_to_folder' THEN '📁 Move views'
        ELSE '🔧 Other function'
    END as function_purpose
FROM information_schema.routines 
WHERE routine_name IN (
    'get_user_diagram_permission',
    'log_sharing_activity', 
    'get_folder_views',
    'move_view_to_folder'
)
ORDER BY routine_name;

-- 4. Check diagram_shares table structure
SELECT 
    'CHECK_029_RESULT - diagram_shares table' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diagram_shares'
ORDER BY ordinal_position;

-- 5. Check RLS policies on diagram_shares
SELECT 
    'CHECK_029_RESULT - RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'diagram_shares';

-- 6. Test basic sharing operations (if grashof exists)
SELECT 
    'CHECK_029_RESULT - Test Data Available' as check_type,
    u.email,
    p.username,
    p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'grashof@gmail.com';