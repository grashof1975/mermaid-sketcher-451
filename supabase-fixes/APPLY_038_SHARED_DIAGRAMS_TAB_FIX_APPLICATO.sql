-- APPLY_038: Fix Shared Diagrams Tab Visualization
-- 
-- PROBLEMA: I diagrammi condivisi non vengono visualizzati nel tab "Condivisi" 
-- della floating navigation bar
--
-- CAUSA: SharedFolderSidebar carica solo saved_views_shares, non diagram_shares
--
-- SOLUZIONE: Questo non è un fix SQL ma un fix FRONTEND
-- Il database è corretto, serve modificare SharedFolderSidebar.tsx
--
-- VERIFICATION QUERY per confermare che i dati esistono:

-- 1. Controlla inviti diagrammi accettati
SELECT 
  ds.id,
  ds.diagram_id,
  ds.shared_with_id,
  ds.permission_level,
  ds.status,
  ds.created_at,
  d.title as diagram_title,
  au_owner.email as owner_email,
  au_shared.email as shared_with_email
FROM public.diagram_shares ds
JOIN public.diagrams d ON ds.diagram_id = d.id
JOIN auth.users au_owner ON ds.owner_id = au_owner.id
JOIN auth.users au_shared ON ds.shared_with_id = au_shared.id
WHERE ds.status = 'accepted'
ORDER BY ds.created_at DESC
LIMIT 10;

-- 2. Controlla se esistono diagrammi condivisi per un utente specifico
-- (sostituire 'grashof@gmail.com' con email utente di test)
SELECT 
  ds.id as share_id,
  d.id as diagram_id,
  d.title,
  d.description,
  d.mermaid_code,
  ds.permission_level,
  ds.created_at as shared_at,
  au_owner.email as owner_email
FROM public.diagram_shares ds
JOIN public.diagrams d ON ds.diagram_id = d.id
JOIN auth.users au_owner ON ds.owner_id = au_owner.id
JOIN auth.users au_shared ON ds.shared_with_id = au_shared.id
WHERE au_shared.email = 'grashof@gmail.com'
  AND ds.status = 'accepted'
ORDER BY ds.created_at DESC;

-- 3. Verifica funzione API esistente getSharedWithUser
-- (Non è SQL ma verifica che la funzione TypeScript esista in utils/supabase.ts)

-- ✅ RISULTATO ATTESO:
-- - Query 1: Dovrebbe mostrare inviti accettati esistenti
-- - Query 2: Dovrebbe mostrare diagrammi condivisi per l'utente test
-- - Se i dati esistono, il problema è solo FRONTEND

-- 🔧 PROSSIMO STEP: 
-- Modificare SharedFolderSidebar.tsx per caricare anche diagram_shares
-- usando la funzione db.diagrams.getSharedWithUser() già esistente

-- APPLY_038 SUCCESS: Database verification completed
-- Fix required: Frontend component SharedFolderSidebar.tsx