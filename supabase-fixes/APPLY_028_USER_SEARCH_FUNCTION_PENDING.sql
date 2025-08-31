-- APPLY 028: Create user search function for sharing invitations
-- Status: PENDING
-- Purpose: Allow frontend to find users by email for sharing functionality

-- Create a function to find user by email that returns profile info
-- This function can access both auth.users and profiles tables
CREATE OR REPLACE FUNCTION find_user_by_email_for_sharing(email_input text)
RETURNS TABLE (
    id uuid,
    username text,
    full_name text,
    email text
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
        RAISE NOTICE 'APPLY_028_RESULT - No user found with email: %', email_input;
        RETURN;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_user_by_email_for_sharing(text) TO authenticated;

-- Test the function with grashof@gmail.com
SELECT 
    'APPLY_028_RESULT - Function test' as status,
    *
FROM find_user_by_email_for_sharing('grashof@gmail.com');

-- Also test with a non-existent email
SELECT 
    'APPLY_028_RESULT - Non-existent test' as status,
    *
FROM find_user_by_email_for_sharing('nonexistent@test.com');