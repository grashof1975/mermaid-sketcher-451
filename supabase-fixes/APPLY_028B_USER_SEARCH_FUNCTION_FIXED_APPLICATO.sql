-- APPLY 028B: Fixed user search function for sharing invitations
-- Status: PENDING
-- Purpose: Allow frontend to find users by email for sharing functionality
-- Fix: Corrected data types to match actual database schema

-- Drop the broken function if it exists
DROP FUNCTION IF EXISTS find_user_by_email_for_sharing(text);

-- Create corrected function with proper data types
CREATE OR REPLACE FUNCTION find_user_by_email_for_sharing(email_input text)
RETURNS TABLE (
    id uuid,
    username text,
    full_name text,
    email character varying(255)  -- Fixed: Use actual email type from auth.users
) 
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to access auth.users even with RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        p.username,
        p.full_name,
        u.email
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE u.email = email_input
    AND u.email_confirmed_at IS NOT NULL -- Only confirmed users
    AND u.deleted_at IS NULL; -- Only active users
    
    -- If no results found, return debug info
    IF NOT FOUND THEN
        RAISE NOTICE 'APPLY_028B_RESULT - No user found with email: %', email_input;
        RETURN;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_user_by_email_for_sharing(text) TO authenticated;

-- Test the function with grashof@gmail.com
SELECT 
    'APPLY_028B_RESULT - Function test with grashof' as status,
    id,
    username,
    full_name,
    email
FROM find_user_by_email_for_sharing('grashof@gmail.com');

-- Also test with a non-existent email
SELECT 
    'APPLY_028B_RESULT - Non-existent email test' as status,
    id,
    username, 
    full_name,
    email
FROM find_user_by_email_for_sharing('nonexistent@test.com');

-- Verify function was created successfully
SELECT 
    'APPLY_028B_RESULT - Function Status' as check_type,
    routine_name,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'find_user_by_email_for_sharing';