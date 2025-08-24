-- APPLY_005: Fix base64url encoding error in public_share_links - ✅ APPLICATO
-- Data: 2025-08-23
-- Problema: PostgreSQL non riconosce encoding "base64url" - errore 22023
-- Soluzione: Usare 'base64' standard + replace per URL-safe

-- 1. Rimuovi constraint per modifica colonna
ALTER TABLE public_share_links DROP CONSTRAINT IF EXISTS public_share_links_share_token_key;

-- 2. Modifica default della colonna share_token per usare base64 standard + replace
ALTER TABLE public_share_links 
ALTER COLUMN share_token SET DEFAULT 
  replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');

-- 3. Ripristina constraint UNIQUE
ALTER TABLE public_share_links 
ADD CONSTRAINT public_share_links_share_token_key UNIQUE (share_token);

-- 4. Test inserimento per verificare fix
INSERT INTO public_share_links (diagram_id, created_by, share_token) 
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid, 
  'b0000000-0000-0000-0000-000000000001'::uuid,
  replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_')
);

-- 5. Verifica inserimento riuscito
SELECT id, share_token, created_at 
FROM public_share_links 
ORDER BY created_at DESC 
LIMIT 1;

-- 6. Pulizia test (rimuovi record test)
DELETE FROM public_share_links 
WHERE diagram_id = 'a0000000-0000-0000-0000-000000000001'::uuid;