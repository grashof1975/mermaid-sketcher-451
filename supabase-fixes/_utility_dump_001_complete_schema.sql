-- UTILITY DUMP 001: Complete Database Schema Dump
-- Purpose: Generate complete schema dump for reference and debugging
-- Usage: Execute in Supabase SQL Editor, copy results to clipboard
-- Output: Complete CREATE TABLE statements for all public and auth tables

-- =============================================================================
-- QUERY OTTIMIZZATA PER DUMP COMPLETO SCHEMA
-- =============================================================================

WITH table_info AS (
  SELECT 
    t.schemaname,
    t.tablename,
    t.schemaname || '.' || t.tablename as full_table_name
  FROM pg_tables t
  WHERE t.schemaname IN ('public', 'auth')
),
table_definitions AS (
  SELECT 
    ti.schemaname,
    ti.tablename,
    ti.full_table_name,
    'CREATE TABLE ' || ti.full_table_name || ' (' || chr(10) ||
    string_agg(
      '  ' || c.column_name || ' ' || 
      CASE 
        WHEN c.data_type = 'character varying' AND c.character_maximum_length IS NOT NULL 
        THEN 'character varying'
        WHEN c.data_type = 'USER-DEFINED' THEN 'USER-DEFINED'
        WHEN c.data_type = 'ARRAY' THEN c.udt_name
        ELSE c.data_type
      END ||
      CASE 
        WHEN c.character_maximum_length IS NOT NULL AND c.data_type = 'character varying'
        THEN CASE WHEN c.character_maximum_length = -1 THEN '' ELSE '(' || c.character_maximum_length || ')' END
        ELSE ''
      END ||
      CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
      CASE 
        WHEN c.column_default IS NOT NULL 
        THEN ' DEFAULT ' || c.column_default 
        ELSE '' 
      END,
      ',' || chr(10)
      ORDER BY c.ordinal_position
    ) || 
    -- Add constraints
    COALESCE(
      ',' || chr(10) || string_agg(
        '  CONSTRAINT ' || tc.constraint_name || 
        CASE 
          WHEN tc.constraint_type = 'PRIMARY KEY' 
          THEN ' PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ')'
          WHEN tc.constraint_type = 'FOREIGN KEY'
          THEN ' FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' || ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')'
          WHEN tc.constraint_type = 'UNIQUE'
          THEN ' UNIQUE'
          ELSE ''
        END,
        ',' || chr(10)
      ), 
      ''
    ) ||
    chr(10) || ');' as create_statement
  FROM table_info ti
  JOIN information_schema.columns c ON ti.schemaname = c.table_schema AND ti.tablename = c.table_name
  LEFT JOIN information_schema.table_constraints tc ON ti.schemaname = tc.table_schema AND ti.tablename = tc.table_name
  LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
  GROUP BY ti.schemaname, ti.tablename, ti.full_table_name
)
SELECT 
  '-- WARNING: This schema is for context only and is not meant to be run.' as schema_dump
UNION ALL
SELECT '-- Table order and constraints may not be valid for execution.'
UNION ALL  
SELECT '-- Generated: ' || current_timestamp::text
UNION ALL
SELECT ''
UNION ALL
SELECT create_statement
FROM table_definitions
ORDER BY 
  CASE 
    WHEN schema_dump LIKE '---%' THEN 1
    WHEN schema_dump = '' THEN 2  
    ELSE 3
  END,
  schema_dump;

-- =============================================================================
-- ALTERNATIVE: Simplified version for manual execution
-- =============================================================================

-- Step 1: Get list of all tables
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('public', 'auth') ORDER BY schemaname, tablename;

-- Step 2: For each table, get detailed definition (execute one by one)
-- \d+ public.comments
-- \d+ public.diagrams  
-- \d+ public.saved_views
-- \d+ public.diagram_shares
-- \d+ public.saved_views_shares
-- \d+ public.profiles
-- \d+ auth.users
-- -- etc.

-- =============================================================================
-- USAGE INSTRUCTIONS:
-- =============================================================================
-- 1. Copy this entire query
-- 2. Paste in Supabase Dashboard → SQL Editor  
-- 3. Execute query
-- 4. Copy ALL results from output
-- 5. Paste in new file: supabase-fixes/schema-reference/20250829_complete_dump.txt
-- 6. Save and use as updated schema reference