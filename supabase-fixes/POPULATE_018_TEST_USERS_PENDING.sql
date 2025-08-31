-- POPULATE_018: POPOLAZIONE UTENTI DI TEST
-- Data: 2025-08-25
-- Scopo: Creare 5 utenti di test per verificare sistema condivisione
-- Per testing: Sistema condivisione diagrammi e viste

-- =============================================================================
-- IMPORTANTE: QUESTO SCRIPT È PER SOLO TESTING/DEVELOPMENT
-- NON UTILIZZARE IN PRODUCTION!
-- =============================================================================

-- =============================================================================
-- 1. CREAZIONE UTENTI IN AUTH.USERS (Supabase Auth)
-- =============================================================================

-- NOTA: In un ambiente reale, questi utenti dovrebbero essere creati tramite
-- Supabase Auth (signup), non direttamente nel database.
-- Questo è solo per testing rapido dello sviluppo.

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES 
-- Utente 1
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente1@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe', -- password: test123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
-- Utente 2
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente2@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe', -- password: test123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
-- Utente 3
(
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente3@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe', -- password: test123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
-- Utente 4
(
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente4@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe', -- password: test123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
-- Utente 5
(
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente5@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe', -- password: test123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING; -- Non sovrascrivere se esistono già

-- =============================================================================
-- 2. CREAZIONE PROFILI CORRISPONDENTI
-- =============================================================================

INSERT INTO profiles (
  id,
  username
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'utente1'
),
(
  '22222222-2222-2222-2222-222222222222',
  'utente2'
),
(
  '33333333-3333-3333-3333-333333333333',
  'utente3'
),
(
  '44444444-4444-4444-4444-444444444444',
  'utente4'
),
(
  '55555555-5555-5555-5555-555555555555',
  'utente5'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username;

-- =============================================================================
-- 3. CREAZIONE DIAGRAMMI DI TEST PER CONDIVISIONE
-- =============================================================================

-- Creo alcuni diagrammi di esempio per testare la condivisione
-- (assumendo che esista già un utente principale che li possiede)

-- Ottengo l'ID del primo utente registrato per usarlo come proprietario
DO $$
DECLARE
    main_user_id UUID;
BEGIN
    -- Trova il primo utente (probabilmente il tuo utente principale)
    SELECT id INTO main_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF main_user_id IS NOT NULL THEN
        -- Crea diagrammi di test
        INSERT INTO diagrams (
            id,
            user_id,
            title,
            content,
            created_at,
            updated_at
        ) VALUES 
        (
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            main_user_id,
            'Diagramma Test Condivisione 1',
            'graph TD\n  A[Start] --> B[Process]\n  B --> C[End]',
            NOW(),
            NOW()
        ),
        (
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            main_user_id,
            'Diagramma Test Condivisione 2',
            'graph LR\n  X[Input] --> Y[Transform]\n  Y --> Z[Output]',
            NOW(),
            NOW()
        ),
        (
            'cccccccc-cccc-cccc-cccc-cccccccccccc',
            main_user_id,
            'Diagramma Test Condivisione 3',
            'flowchart TB\n  P[Plan] --> E[Execute]\n  E --> R[Review]',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- 4. CREAZIONE CONDIVISIONI DI TEST
-- =============================================================================

-- Creo condivisioni di esempio per testare la visualizzazione
DO $$
DECLARE
    main_user_id UUID;
BEGIN
    -- Trova il primo utente (proprietario dei diagrammi)
    SELECT id INTO main_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF main_user_id IS NOT NULL THEN
        -- Condividi Diagramma 1 con utenti 1, 2 e 3
        INSERT INTO diagram_shares (
            diagram_id,
            shared_with_id,
            permission_level,
            status,
            created_at
        ) VALUES 
        -- Diagramma 1 condiviso con 3 utenti
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'editor', 'accepted', NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'commenter', 'accepted', NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'viewer', 'accepted', NOW()),
        
        -- Diagramma 2 condiviso con tutti e 5 gli utenti (per testare overflow +N)
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'editor', 'accepted', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'editor', 'accepted', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'commenter', 'accepted', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'viewer', 'accepted', NOW()),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'viewer', 'accepted', NOW()),
        
        -- Diagramma 3 condiviso con 1 solo utente
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'commenter', 'accepted', NOW())
        
        ON CONFLICT (diagram_id, shared_with_id) DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- 5. CREAZIONE VISTE DI TEST PER CONDIVISIONE
-- =============================================================================

-- Creo anche alcune viste di test per il sistema di condivisione viste
DO $$
DECLARE
    main_user_id UUID;
BEGIN
    -- Trova il primo utente (proprietario delle viste)
    SELECT id INTO main_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF main_user_id IS NOT NULL THEN
        -- Crea viste di test
        INSERT INTO saved_views (
            id,
            user_id,
            diagram_id,
            name,
            zoom_level,
            pan_x,
            pan_y,
            created_at
        ) VALUES 
        (
            'vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv1',
            main_user_id,
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'Vista Test Condivisione 1',
            1.5,
            100,
            200,
            NOW()
        ),
        (
            'vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv2',
            main_user_id,
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            'Vista Test Condivisione 2',
            2.0,
            150,
            250,
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Condividi le viste con alcuni utenti
        INSERT INTO saved_views_shares (
            saved_view_id,
            owner_id,
            shared_with_id,
            permission_level,
            invited_by,
            status,
            created_at
        ) VALUES 
        -- Vista 1 condivisa con utenti 1 e 2
        ('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv1', main_user_id, '11111111-1111-1111-1111-111111111111', 'editor', main_user_id, 'accepted', NOW()),
        ('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv1', main_user_id, '22222222-2222-2222-2222-222222222222', 'viewer', main_user_id, 'accepted', NOW()),
        
        -- Vista 2 condivisa con utente 3
        ('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv2', main_user_id, '33333333-3333-3333-3333-333333333333', 'commenter', main_user_id, 'accepted', NOW())
        
        ON CONFLICT (saved_view_id, shared_with_id) DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- 6. VERIFICA POPOLAZIONE
-- =============================================================================

-- Query per verificare che tutto sia stato creato correttamente
SELECT 
  '📊 RIEPILOGO POPOLAZIONE' as categoria,
  'Utenti creati' as elemento,
  COUNT(*)::text as count
FROM auth.users 
WHERE email LIKE 'utente%@mail.com'

UNION ALL

SELECT 
  '📊 RIEPILOGO POPOLAZIONE' as categoria,
  'Profili creati' as elemento,
  COUNT(*)::text as count
FROM profiles 
WHERE username LIKE 'utente%'

UNION ALL

SELECT 
  '📊 RIEPILOGO POPOLAZIONE' as categoria,
  'Diagrammi test' as elemento,
  COUNT(*)::text as count
FROM diagrams 
WHERE title LIKE 'Diagramma Test Condivisione%'

UNION ALL

SELECT 
  '📊 RIEPILOGO POPOLAZIONE' as categoria,
  'Condivisioni diagrammi' as elemento,
  COUNT(*)::text as count
FROM diagram_shares 
WHERE status = 'accepted'

UNION ALL

SELECT 
  '📊 RIEPILOGO POPOLAZIONE' as categoria,
  'Viste test' as elemento,
  COUNT(*)::text as count
FROM saved_views 
WHERE name LIKE 'Vista Test Condivisione%'

UNION ALL

SELECT 
  '📊 RIEPILOGO POPOLAZIONE' as categoria,
  'Condivisioni viste' as elemento,
  COUNT(*)::text as count
FROM saved_views_shares 
WHERE status = 'accepted';

-- =============================================================================
-- DETTAGLIO CONDIVISIONI CREATE
-- =============================================================================

-- Mostra i dettagli delle condivisioni create
SELECT 
  '🔗 CONDIVISIONI DIAGRAMMI' as tipo,
  d.title as elemento,
  p.username as utente_condiviso,
  ds.permission_level as permesso
FROM diagram_shares ds
JOIN diagrams d ON ds.diagram_id = d.id
JOIN profiles p ON ds.shared_with_id = p.id
WHERE ds.status = 'accepted'
  AND d.title LIKE 'Diagramma Test Condivisione%'
ORDER BY d.title, p.username;

SELECT 
  '👁️ CONDIVISIONI VISTE' as tipo,
  sv.name as elemento,
  p.username as utente_condiviso,
  svs.permission_level as permesso
FROM saved_views_shares svs
JOIN saved_views sv ON svs.saved_view_id = sv.id
JOIN profiles p ON svs.shared_with_id = p.id
WHERE svs.status = 'accepted'
  AND sv.name LIKE 'Vista Test Condivisione%'
ORDER BY sv.name, p.username;

-- =============================================================================
-- NOTE FINALI
-- =============================================================================

-- CREDENZIALI UTENTI TEST:
-- Email: utente1@mail.com - utente5@mail.com
-- Password: test123 (per tutti)
-- Username: utente1 - utente5

-- RISULTATO ATTESO NEL FRONTEND:
-- - Diagramma 1: [utente1] [utente2] [utente3]
-- - Diagramma 2: [utente1] [utente2] [+3] 
-- - Diagramma 3: [utente1]

-- CLEANUP (se necessario):
-- DELETE FROM diagram_shares WHERE diagram_id IN (SELECT id FROM diagrams WHERE title LIKE 'Diagramma Test Condivisione%');
-- DELETE FROM saved_views_shares WHERE saved_view_id IN (SELECT id FROM saved_views WHERE name LIKE 'Vista Test Condivisione%');
-- DELETE FROM saved_views WHERE name LIKE 'Vista Test Condivisione%';
-- DELETE FROM diagrams WHERE title LIKE 'Diagramma Test Condivisione%';
-- DELETE FROM profiles WHERE username LIKE 'utente%';
-- DELETE FROM auth.users WHERE email LIKE 'utente%@mail.com';