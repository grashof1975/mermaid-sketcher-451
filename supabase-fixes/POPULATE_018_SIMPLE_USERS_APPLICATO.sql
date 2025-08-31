-- POPULATE_018_SIMPLE: SOLO 5 UTENTI DI TEST
-- Data: 2025-08-25
-- Scopo: Creare SOLO 5 utenti di test senza diagrammi
-- Semplice e diretto

-- =============================================================================
-- IMPORTANTE: QUESTO È PER SOLO TESTING/DEVELOPMENT!
-- =============================================================================

-- =============================================================================
-- 1. CREAZIONE UTENTI IN AUTH.USERS
-- =============================================================================

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente1@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe',
  NOW(),
  NOW(),
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente2@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe',
  NOW(),
  NOW(),
  NOW()
),
(
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente3@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe',
  NOW(),
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente4@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe',
  NOW(),
  NOW(),
  NOW()
),
(
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'utente5@mail.com',
  '$2a$10$X1p2WaznPtS.QPWdMjEWJe0c8F8pI7n9MfJ8oVjcSdO4jPZx7GXRe',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. CREAZIONE PROFILI (SOLO ID E USERNAME)
-- =============================================================================

INSERT INTO profiles (id, username) VALUES 
('11111111-1111-1111-1111-111111111111', 'utente1'),
('22222222-2222-2222-2222-222222222222', 'utente2'),
('33333333-3333-3333-3333-333333333333', 'utente3'),
('44444444-4444-4444-4444-444444444444', 'utente4'),
('55555555-5555-5555-5555-555555555555', 'utente5')
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

-- =============================================================================
-- 3. VERIFICA CREAZIONE
-- =============================================================================

SELECT 'UTENTI CREATI' as tipo, email, id FROM auth.users WHERE email LIKE 'utente%@mail.com';
SELECT 'PROFILI CREATI' as tipo, username, id FROM profiles WHERE username LIKE 'utente%';

-- =============================================================================
-- CREDENZIALI:
-- Email: utente1@mail.com - utente5@mail.com  
-- Password: test123
-- Username: utente1 - utente5
-- =============================================================================