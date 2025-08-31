-- APPLY 039: Fix RPC Function data type error
-- Status: PENDING
-- Purpose: Correggere il tipo di dato character_maximum_length nella RPC function

-- Drop della funzione esistente
DROP FUNCTION IF EXISTS get_database_schema();

-- Ricreare la funzione con il tipo di dato corretto
CREATE OR REPLACE FUNCTION get_database_schema()
RETURNS TABLE (
  table_schema TEXT,
  table_name TEXT,
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  character_maximum_length TEXT  -- Cambiato da INTEGER a TEXT
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
    c.character_maximum_length::TEXT  -- Cast esplicito a TEXT
  FROM information_schema.columns c
  JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
  WHERE c.table_schema IN ('public', 'auth')
  ORDER BY c.table_schema, c.table_name, c.ordinal_position;
END;
$$;

-- Concedi permessi
GRANT EXECUTE ON FUNCTION get_database_schema() TO service_role;
GRANT EXECUTE ON FUNCTION get_database_schema() TO authenticated;