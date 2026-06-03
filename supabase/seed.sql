-- ============================================================
-- YES! CRM — Seed: Escola de exemplo + Usuário Admin
-- Execute APÓS o schema.sql
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. Escola de exemplo
-- ──────────────────────────────────────────────
INSERT INTO public.schools (id, name, slug, whatsapp_phone_id)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'YES! Centro',
  'yes-centro',
  NULL  -- Configure depois com o ID real do Meta
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name;

-- ──────────────────────────────────────────────
-- 2. Usuário Admin (criado diretamente no banco)
--
-- ATENÇÃO: Primeiro crie o usuário no Supabase Auth:
--   Supabase Studio → Authentication → Users → "Add user"
--   Email: admin@yes-centro.com.br
--   Password: YesCRM@2024!
--
--   Depois copie o UUID gerado e substitua abaixo.
--   OU execute o bloco de criação via SQL abaixo.
-- ──────────────────────────────────────────────

-- INSTRUÇÃO: Crie o usuário pelo Supabase Studio primeiro:
--   Authentication → Users → "Add user"
--   Email: admin@yes-centro.com.br
--   Password: YesCRM@2024!
--
-- Depois, execute o INSERT abaixo substituindo o UUID pelo gerado:
-- (O trigger handle_new_user tentará criar automaticamente,
--  mas se falhar por falta de school_id nos metadados, use o INSERT manual)
--
-- INSERT INTO public.users (id, school_id, name, role)
-- VALUES (
--   'UUID-DO-USUARIO-CRIADO-NO-AUTH',
--   'a1b2c3d4-0000-0000-0000-000000000001',
--   'Admin YES! Centro',
--   'admin'
-- );

-- ──────────────────────────────────────────────
-- 3. Leads de exemplo para teste
-- ──────────────────────────────────────────────
INSERT INTO public.leads (id, school_id, name, phone, email, stage, last_message_at, last_message_body)
VALUES
  (
    'b1b2b3b4-0001-0001-0001-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'João Silva',
    '5511912345678',
    'joao@email.com',
    'novos_leads',
    NOW() - INTERVAL '5 minutes',
    'Oi, vi o anúncio e quero saber mais sobre os cursos!'
  ),
  (
    'b1b2b3b4-0001-0001-0001-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Maria Fernanda',
    '5511987654321',
    NULL,
    'em_negociacao',
    NOW() - INTERVAL '2 hours',
    'Quanto custa o curso de inglês avançado?'
  ),
  (
    'b1b2b3b4-0001-0001-0001-000000000003',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Pedro Costa',
    '5511955554444',
    'pedro@empresa.com',
    'aguardando_pagamento',
    NOW() - INTERVAL '1 day',
    'Ok, vou fechar! Como faço o pagamento?'
  ),
  (
    'b1b2b3b4-0001-0001-0001-000000000004',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Ana Souza',
    '5511933332222',
    NULL,
    'sem_resposta',
    NOW() - INTERVAL '3 days',
    'Olá!'
  ),
  (
    'b1b2b3b4-0001-0001-0001-000000000005',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Carlos Mendes',
    '5511911110000',
    'carlos@gmail.com',
    'matriculou',
    NOW() - INTERVAL '1 week',
    'Acabei de fazer a matrícula!'
  )
ON CONFLICT DO NOTHING;

-- Mensagens de exemplo para João
INSERT INTO public.messages (lead_id, direction, body, timestamp)
VALUES
  (
    'b1b2b3b4-0001-0001-0001-000000000001',
    'inbound',
    'Oi, vi o anúncio e quero saber mais sobre os cursos!',
    NOW() - INTERVAL '5 minutes'
  ),
  (
    'b1b2b3b4-0001-0001-0001-000000000001',
    'outbound',
    'Olá João! Seja bem-vindo à YES! Idiomas 😊 Temos cursos de inglês, espanhol e muito mais. Posso te ajudar?',
    NOW() - INTERVAL '4 minutes'
  ),
  (
    'b1b2b3b4-0001-0001-0001-000000000001',
    'inbound',
    'Ótimo! Vocês têm aulas presenciais ou só online?',
    NOW() - INTERVAL '3 minutes'
  )
ON CONFLICT DO NOTHING;
