-- COMPLETE SCHEMA DUMP WITH FOREIGN KEY CONSTRAINTS
-- Usage: Run this in Supabase SQL Editor or pgAdmin
-- Output: Complete schema including tables, foreign keys, indexes, constraints

-- ================================================
-- SECTION 1: TABLES STRUCTURE
-- ================================================

SELECT 'DROP SCHEMA IF EXISTS public CASCADE;' as sql_statement
UNION ALL
SELECT 'CREATE SCHEMA public;'
UNION ALL
SELECT 'GRANT ALL ON SCHEMA public TO postgres;'
UNION ALL
SELECT 'GRANT ALL ON SCHEMA public TO public;'
UNION ALL

-- Generate CREATE TABLE statements
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    array_to_string(
        array_agg(
            column_name || ' ' || data_type ||
            case when character_maximum_length is not null 
                 then '(' || character_maximum_length || ')' 
                 else '' end ||
            case when is_nullable = 'NO' then ' NOT NULL' else '' end ||
            case when column_default is not null 
                 then ' DEFAULT ' || column_default 
                 else '' end
            order by ordinal_position
        ), 
        ', '
    ) || ');' as sql_statement
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.tablename 
WHERE t.schemaname IN ('public', 'auth') 
  AND t.tablename NOT LIKE 'pg_%'
GROUP BY schemaname, tablename

UNION ALL

-- ================================================
-- SECTION 2: FOREIGN KEY CONSTRAINTS  
-- ================================================

SELECT '-- FOREIGN KEY CONSTRAINTS' as sql_statement
UNION ALL

SELECT 
    'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 
    ' ADD CONSTRAINT ' || tc.constraint_name || 
    ' FOREIGN KEY (' || kcu.column_name || ')' ||
    ' REFERENCES ' || ccu.table_schema || '.' || ccu.table_name || 
    ' (' || ccu.column_name || ')' ||
    CASE 
        WHEN rc.update_rule != 'NO ACTION' THEN ' ON UPDATE ' || rc.update_rule
        ELSE ''
    END ||
    CASE 
        WHEN rc.delete_rule != 'NO ACTION' THEN ' ON DELETE ' || rc.delete_rule  
        ELSE ''
    END || ';' as sql_statement
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema IN ('public', 'auth')

UNION ALL

-- ================================================
-- SECTION 3: INDEXES (non-unique)
-- ================================================

SELECT '-- INDEXES' as sql_statement
UNION ALL

SELECT 
    'CREATE INDEX ' || indexname || ' ON ' || schemaname || '.' || tablename || 
    ' USING ' || am.amname || ' (' || 
    array_to_string(array_agg(attname order by attnum), ', ') || ');' as sql_statement
FROM pg_indexes pi
JOIN pg_class pc ON pc.relname = pi.indexname
JOIN pg_am am ON am.oid = pc.relam
JOIN pg_index pgi ON pgi.indexrelid = pc.oid
JOIN pg_attribute pa ON pa.attrelid = pgi.indrelid AND pa.attnum = ANY(pgi.indkey)
WHERE pi.schemaname IN ('public', 'auth')
  AND NOT pgi.indisprimary 
  AND NOT pgi.indisunique
GROUP BY pi.schemaname, pi.tablename, pi.indexname, am.amname

UNION ALL

-- ================================================
-- SECTION 4: PRIMARY KEY CONSTRAINTS
-- ================================================

SELECT '-- PRIMARY KEY CONSTRAINTS' as sql_statement
UNION ALL

SELECT 
    'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 
    ' ADD CONSTRAINT ' || tc.constraint_name || 
    ' PRIMARY KEY (' || 
    array_to_string(array_agg(kcu.column_name order by kcu.ordinal_position), ', ') || 
    ');' as sql_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema IN ('public', 'auth')
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name

UNION ALL

-- ================================================
-- SECTION 5: UNIQUE CONSTRAINTS
-- ================================================

SELECT '-- UNIQUE CONSTRAINTS' as sql_statement
UNION ALL

SELECT 
    'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 
    ' ADD CONSTRAINT ' || tc.constraint_name || 
    ' UNIQUE (' || 
    array_to_string(array_agg(kcu.column_name order by kcu.ordinal_position), ', ') || 
    ');' as sql_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema IN ('public', 'auth')
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name

ORDER BY sql_statement;