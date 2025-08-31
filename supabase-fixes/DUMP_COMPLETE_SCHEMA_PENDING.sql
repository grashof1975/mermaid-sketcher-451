-- DUMP COMPLETE SCHEMA: Generate full database schema dump
-- Status: PENDING 
-- Purpose: Create comprehensive schema dump for reference

-- Create function to generate complete schema dump
CREATE OR REPLACE FUNCTION dump_complete_schema()
RETURNS TABLE (
  dump_line TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_rec RECORD;
  column_rec RECORD;
  constraint_rec RECORD;
  table_sql TEXT;
  columns_sql TEXT;
BEGIN
  -- Header
  RETURN QUERY SELECT '-- WARNING: This schema is for context only and is not meant to be run.' as dump_line;
  RETURN QUERY SELECT '-- Table order and constraints may not be valid for execution.' as dump_line;
  RETURN QUERY SELECT '' as dump_line;
  
  -- Loop through all tables in public and auth schemas
  FOR table_rec IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname IN ('public', 'auth')
    ORDER BY schemaname, tablename
  LOOP
    -- Build CREATE TABLE statement
    table_sql := 'CREATE TABLE ' || table_rec.schemaname || '.' || table_rec.tablename || ' (';
    columns_sql := '';
    
    -- Get columns for this table
    FOR column_rec IN
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = table_rec.schemaname 
        AND table_name = table_rec.tablename
      ORDER BY ordinal_position
    LOOP
      IF columns_sql != '' THEN
        columns_sql := columns_sql || ',';
      END IF;
      
      columns_sql := columns_sql || chr(10) || '  ' || column_rec.column_name || ' ' || 
        CASE 
          WHEN column_rec.data_type = 'character varying' AND column_rec.character_maximum_length IS NOT NULL 
          THEN 'character varying(' || column_rec.character_maximum_length || ')'
          WHEN column_rec.data_type = 'USER-DEFINED' THEN 'USER-DEFINED'
          ELSE column_rec.data_type
        END ||
        CASE WHEN column_rec.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_rec.column_default IS NOT NULL THEN ' DEFAULT ' || column_rec.column_default ELSE '' END;
    END LOOP;
    
    -- Add primary key and constraints info
    FOR constraint_rec IN
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = table_rec.schemaname 
        AND table_name = table_rec.tablename
        AND constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
    LOOP
      columns_sql := columns_sql || ',';
      columns_sql := columns_sql || chr(10) || '  CONSTRAINT ' || constraint_rec.constraint_name || 
        ' ' || constraint_rec.constraint_type;
    END LOOP;
    
    table_sql := table_sql || columns_sql || chr(10) || ');';
    
    RETURN QUERY SELECT table_sql as dump_line;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION dump_complete_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION dump_complete_schema() TO service_role;