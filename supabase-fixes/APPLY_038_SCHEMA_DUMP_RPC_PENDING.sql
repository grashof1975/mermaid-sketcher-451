-- APPLY 038: RPC Function per supporto Edge Function dump schema
-- Status: PENDING
-- Purpose: Supportare Edge Function con RPC per eseguire query SQL dinamiche

-- Crea RPC function per eseguire query SQL (solo per dump schema)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TABLE (
  schema_dump TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sicurezza: solo query SELECT per information_schema e pg_tables
  IF sql_query !~ '^[\s\n]*WITH.*SELECT.*information_schema|pg_tables.*$' THEN
    RAISE EXCEPTION 'Only SELECT queries on information_schema and pg_tables are allowed';
  END IF;
  
  -- Esegui la query e restituisci risultati
  RETURN QUERY EXECUTE sql_query;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log errore e restituisci messaggio
    RAISE NOTICE 'exec_sql error: %', SQLERRM;
    RETURN QUERY SELECT ('-- Error: ' || SQLERRM)::TEXT;
END;
$$;

-- Concedi permessi per Edge Functions
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- Alternativa: RPC function semplificata per dump schema
CREATE OR REPLACE FUNCTION get_database_schema()
RETURNS TABLE (
  table_schema TEXT,
  table_name TEXT,
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  character_maximum_length INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.table_schema::TEXT,
    c.table_name::TEXT,
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT,
    c.character_maximum_length
  FROM information_schema.columns c
  JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
  WHERE c.table_schema IN ('public', 'auth')
  ORDER BY c.table_schema, c.table_name, c.ordinal_position;
END;
$$;

-- Concedi permessi
GRANT EXECUTE ON FUNCTION get_database_schema() TO service_role;
GRANT EXECUTE ON FUNCTION get_database_schema() TO authenticated;