-- DEBUG 035: Check diagram_shares table schema
-- Status: PENDING  
-- Purpose: Verify actual columns in diagram_shares table

-- Check the actual schema of diagram_shares
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diagram_shares' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data to see actual column names
SELECT * FROM diagram_shares LIMIT 1;