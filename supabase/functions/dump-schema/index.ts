// Edge Function per generare dump completo schema database
// URL: https://[PROJECT].supabase.co/functions/v1/dump-schema
// Uso: GET request restituisce schema completo come testo

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Generating database schema dump...')

    // Query per ottenere schema completo
    const schemaQuery = `
      WITH table_definitions AS (
        SELECT 
          t.schemaname,
          t.tablename,
          t.schemaname || '.' || t.tablename as full_table_name,
          'CREATE TABLE ' || t.schemaname || '.' || t.tablename || ' (' || chr(10) ||
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
          ) || chr(10) || ');' as create_statement
        FROM pg_tables t
        JOIN information_schema.columns c ON t.schemaname = c.table_schema AND t.tablename = c.table_name
        WHERE t.schemaname IN ('public', 'auth')
        GROUP BY t.schemaname, t.tablename
        ORDER BY t.schemaname, t.tablename
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
    `

    // Esegui query
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: schemaQuery 
    })

    if (error) {
      console.error('❌ Database error:', error)
      
      // Fallback: usa query semplice
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .in('table_schema', ['public', 'auth'])
      
      if (fallbackError) {
        throw new Error(`Database query failed: ${fallbackError.message}`)
      }
      
      const fallbackResult = '-- Fallback schema info:\n' + JSON.stringify(fallbackData, null, 2)
      
      return new Response(fallbackResult, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="schema_dump_fallback.sql"'
        },
      })
    }

    // Format risultato
    const schemaContent = Array.isArray(data) 
      ? data.map(row => row.schema_dump || JSON.stringify(row)).join('\n')
      : JSON.stringify(data, null, 2)

    console.log(`✅ Schema dump generated, ${schemaContent.length} characters`)

    return new Response(schemaContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="schema_dump.sql"'
      },
    })

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    
    const errorResponse = `-- Error generating schema dump: ${error.message}\n-- Generated: ${new Date().toISOString()}\n\n-- Please use manual method with Supabase Dashboard`
    
    return new Response(errorResponse, {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/plain' 
      },
    })
  }
})