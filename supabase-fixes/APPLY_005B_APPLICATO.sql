-- APPLY_005B: Fix definitivo base64url encoding error - ✅ APPLICATO
-- Data: 2025-08-23
-- Problema: APPLY_005 non aveva completamente risolto l'errore "base64url"
-- Soluzione: Modifica diretta del default della colonna esistente

-- 1. Rimuovi constraint esistente
ALTER TABLE public_share_links DROP CONSTRAINT public_share_links_share_token_key;

-- 2. Modifica SOLO il default della colonna esistente
ALTER TABLE public_share_links 
ALTER COLUMN share_token SET DEFAULT 
replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');

-- 3. Ripristina constraint con nome diverso
ALTER TABLE public_share_links 
ADD CONSTRAINT public_share_links_token_unique UNIQUE (share_token);

-- 4. Test: genera nuovo token per verificare
SELECT replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_') AS test_token;

-- 5. Riabilita RLS
ALTER TABLE public_share_links ENABLE ROW LEVEL SECURITY;

-- RISULTATO: ✅ SUCCESSO - Token URL-safe generato correttamente
-- TEST TOKEN: zeyxbCNUrvjVuJKHmf2i0b0ySZ1lMnyWR4dmsCJQ5Zo=