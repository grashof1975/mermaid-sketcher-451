
-- Fix search paths for all database functions to prevent injection attacks
-- This sets a secure search path for each function with SECURITY DEFINER

-- 1. get_user_storage_stats function
CREATE OR REPLACE FUNCTION public.get_user_storage_stats(user_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_files', COALESCE(COUNT(*), 0),
    'total_size_mb', COALESCE(SUM(metadata->>'size')::bigint / 1048576, 0),
    'avatars_count', COALESCE(SUM(CASE WHEN bucket_id = 'avatars' THEN 1 ELSE 0 END), 0),
    'exports_count', COALESCE(SUM(CASE WHEN bucket_id = 'diagram-exports' THEN 1 ELSE 0 END), 0),
    'temp_files_count', COALESCE(SUM(CASE WHEN bucket_id = 'temp-uploads' THEN 1 ELSE 0 END), 0)
  ) INTO stats
  FROM storage.objects 
  WHERE (storage.foldername(name))[1] = user_uuid::text;
  
  RETURN stats;
END;
$function$;

-- 2. cleanup_temp_files function
CREATE OR REPLACE FUNCTION public.cleanup_temp_files()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Rimuovi file temporanei > 24h
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp-uploads' 
  AND created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;

-- 3. get_prompt_recommendation function
CREATE OR REPLACE FUNCTION public.get_prompt_recommendation(description_text text, preferred_category text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  recommended_prompt JSON;
BEGIN
  SELECT json_build_object(
    'prompt_key', prompt_key,
    'template', template,
    'category', category,
    'complexity', complexity,
    'tokens_avg', tokens_avg,
    'success_rate', success_rate
  ) INTO recommended_prompt
  FROM prompt_pool
  WHERE (preferred_category IS NULL OR category = preferred_category)
  ORDER BY 
    success_rate DESC,
    usage_count DESC,
    CASE 
      WHEN lower(description_text) LIKE '%' || category || '%' THEN 1
      ELSE 0
    END DESC
  LIMIT 1;
  
  RETURN recommended_prompt;
END;
$function$;

-- 4. get_table_info function
CREATE OR REPLACE FUNCTION public.get_table_info(table_num character varying)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  table_info JSON;
BEGIN
  SELECT json_build_object(
    'number', table_number,
    'name', table_name,
    'display', display_name,
    'purpose', purpose,
    'type', entity_type,
    'keys', primary_keys,
    'relationships', main_relationships,
    'common_queries', typical_queries
  ) INTO table_info
  FROM table_registry
  WHERE table_number = table_num;
  
  RETURN table_info;
END;
$function$;

-- 5. list_all_tables function
CREATE OR REPLACE FUNCTION public.list_all_tables()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  tables_list JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'number', table_number,
      'name', table_name,
      'display', display_name,
      'purpose', left(purpose, 50) || '...',
      'type', entity_type
    ) ORDER BY table_number
  ) INTO tables_list
  FROM table_registry;
  
  RETURN tables_list;
END;
$function$;

-- 6. search_tables function
CREATE OR REPLACE FUNCTION public.search_tables(search_term text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  search_results JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'number', table_number,
      'name', table_name,
      'display', display_name,
      'purpose', purpose,
      'relevance', 
        CASE 
          WHEN lower(display_name) LIKE lower('%' || search_term || '%') THEN 'high'
          WHEN lower(purpose) LIKE lower('%' || search_term || '%') THEN 'medium'
          WHEN lower(entity_type) LIKE lower('%' || search_term || '%') THEN 'low'
          ELSE 'none'
        END
    )
  ) INTO search_results
  FROM table_registry
  WHERE lower(display_name) LIKE lower('%' || search_term || '%')
     OR lower(purpose) LIKE lower('%' || search_term || '%')
     OR lower(entity_type) LIKE lower('%' || search_term || '%')
  ORDER BY 
    CASE 
      WHEN lower(display_name) LIKE lower('%' || search_term || '%') THEN 1
      WHEN lower(purpose) LIKE lower('%' || search_term || '%') THEN 2
      WHEN lower(entity_type) LIKE lower('%' || search_term || '%') THEN 3
    END,
    table_number;
  
  RETURN search_results;
END;
$function$;

-- 7. get_user_stats function
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_diagrams', COALESCE(d.count, 0),
    'public_diagrams', COALESCE(d.public_count, 0),
    'total_views', COALESCE(v.count, 0),
    'total_comments', COALESCE(c.count, 0),
    'ai_prompts_used', COALESCE(a.count, 0)
  ) INTO stats
  FROM (
    SELECT 
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE is_public = true) as public_count
    FROM diagrams WHERE user_id = user_uuid
  ) d
  CROSS JOIN (
    SELECT COUNT(*) as count FROM saved_views WHERE user_id = user_uuid
  ) v
  CROSS JOIN (
    SELECT COUNT(*) as count FROM comments WHERE user_id = user_uuid
  ) c
  CROSS JOIN (
    SELECT COUNT(*) as count FROM ai_prompts WHERE user_id = user_uuid
  ) a;
  
  RETURN stats;
END;
$function$;

-- 8. cleanup_expired_data function
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  result JSON;
  shares_deleted INTEGER := 0;
BEGIN
  DELETE FROM diagram_shares 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS shares_deleted = ROW_COUNT;
  
  SELECT json_build_object(
    'shares_deleted', shares_deleted,
    'cleanup_timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- 9. validate_database_integrity function
CREATE OR REPLACE FUNCTION public.validate_database_integrity()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  validation_result JSON;
  table_count INTEGER;
  index_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Conta risorse del database
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO index_count 
  FROM pg_indexes 
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO function_count 
  FROM information_schema.routines 
  WHERE routine_schema = 'public';
  
  SELECT COUNT(*) INTO trigger_count 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  SELECT json_build_object(
    'validation_timestamp', NOW(),
    'status', 'completed',
    'tables_count', table_count,
    'indices_count', index_count,
    'functions_count', function_count,
    'triggers_count', trigger_count,
    'policies_count', policy_count,
    'registry_entries', (SELECT COUNT(*) FROM table_registry),
    'expected_tables', 11, -- 10 main tables + table_registry
    'integrity_ok', table_count >= 11
  ) INTO validation_result;
  
  RETURN validation_result;
END;
$function$;

-- 10. update_updated_at_column function (trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
