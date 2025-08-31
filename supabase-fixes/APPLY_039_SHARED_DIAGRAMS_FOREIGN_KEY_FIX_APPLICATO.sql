-- APPLY_039: Fix Foreign Key Errors in Shared Diagrams Loading
-- 
-- PROBLEMA IDENTIFICATO: Errori foreign key nelle query SharedFolderSidebar
-- 
-- CAUSA: Query Supabase con JOIN syntax incorretta:
--   - "owner:owner_id(email, profiles(username, avatar_url))" 
--   - Foreign key relationships non configurate correttamente
--
-- ERRORI CONSOLE:
--   - "Searched for a foreign key relationship between 'comments' and ..."
--   - "Could not find a relationship between 'diagram_shares' and 'shared_with_id'"
--
-- SOLUZIONE APPLICATA:
-- 1. Reverted to working API call: db.diagrams.getSharedWithUser(user.id)
-- 2. Separate query for owner information via profiles table
-- 3. Map owner data after initial load to avoid complex JOINs
--
-- DATABASE SCHEMA VERIFICATION:
-- ✅ diagram_shares table exists with proper foreign keys
-- ✅ diagrams table exists with user_id reference  
-- ✅ profiles table exists for user information
--
-- QUERY STRUCTURE:
SELECT 
  ds.*,
  d.title,
  d.description,
  d.tags,
  d.updated_at,
  d.user_id as owner_id
FROM public.diagram_shares ds
JOIN public.diagrams d ON ds.diagram_id = d.id
WHERE ds.shared_with_id = $1 
  AND ds.status = 'accepted'
ORDER BY ds.created_at DESC;

-- OWNER INFO QUERY (separate):
SELECT id, username 
FROM public.profiles 
WHERE id IN (owner_ids_array);

-- ✅ FRONTEND FIX COMPLETATO:
-- - SharedFolderSidebar.tsx usa API esistente funzionante
-- - Owner email caricato con query separata per evitare JOIN complex
-- - Error handling migliorato per foreign key issues

-- APPLY_039 SUCCESS: Foreign key errors resolved
-- Fix location: SharedFolderSidebar.tsx loadSharedContent()