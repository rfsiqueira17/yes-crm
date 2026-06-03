-- ============================================================
-- YES! CRM — Schema completo para Supabase
-- Execute este arquivo no SQL Editor do Supabase Studio
-- ============================================================

-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- ENUM: Estágios do pipeline
-- ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM (
    'novos_leads',
    'sem_resposta',
    'em_negociacao',
    'aguardando_pagamento',
    'matriculou'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────────────
-- TABELA: schools
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schools (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  whatsapp_phone_id   TEXT,           -- ID do número no Meta (ex: "123456789")
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.schools IS 'Escolas YES! Idiomas (tenants do CRM)';

-- ──────────────────────────────────────────────
-- TABELA: users (perfis vinculados ao auth.users)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Perfis de usuários vinculados a uma escola';
CREATE INDEX IF NOT EXISTS idx_users_school_id ON public.users(school_id);

-- ──────────────────────────────────────────────
-- TABELA: leads
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id           UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  stage               lead_stage NOT NULL DEFAULT 'novos_leads',
  last_message_at     TIMESTAMPTZ,
  last_message_body   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Um número de WhatsApp por escola (sem duplicatas)
  CONSTRAINT uq_leads_school_phone UNIQUE (school_id, phone)
);

COMMENT ON TABLE public.leads IS 'Leads do pipeline de cada escola';
CREATE INDEX IF NOT EXISTS idx_leads_school_id       ON public.leads(school_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage           ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_last_message_at ON public.leads(last_message_at DESC NULLS LAST);

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ──────────────────────────────────────────────
-- TABELA: messages
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body            TEXT NOT NULL,
  wa_message_id   TEXT,           -- ID da mensagem no WhatsApp
  status          TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.messages IS 'Histórico de mensagens WhatsApp por lead';
CREATE INDEX IF NOT EXISTS idx_messages_lead_id   ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id     ON public.messages(wa_message_id) WHERE wa_message_id IS NOT NULL;

-- ──────────────────────────────────────────────
-- TABELA: notes
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notes IS 'Notas internas sobre leads';
CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON public.notes(lead_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Isolamento total: cada usuário vê apenas dados da SUA escola
-- ============================================================

ALTER TABLE public.schools  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes    ENABLE ROW LEVEL SECURITY;

-- ─── Função auxiliar: retorna school_id do usuário autenticado ───
CREATE OR REPLACE FUNCTION public.my_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ─── schools ───
DROP POLICY IF EXISTS "users can view own school" ON public.schools;
CREATE POLICY "users can view own school"
  ON public.schools FOR SELECT
  USING (id = public.my_school_id());

-- ─── users ───
DROP POLICY IF EXISTS "users can view own school users" ON public.users;
CREATE POLICY "users can view own school users"
  ON public.users FOR SELECT
  USING (school_id = public.my_school_id());

-- ─── leads ───
DROP POLICY IF EXISTS "users can select own school leads"  ON public.leads;
DROP POLICY IF EXISTS "users can insert own school leads"  ON public.leads;
DROP POLICY IF EXISTS "users can update own school leads"  ON public.leads;
DROP POLICY IF EXISTS "users can delete own school leads"  ON public.leads;

CREATE POLICY "users can select own school leads"
  ON public.leads FOR SELECT
  USING (school_id = public.my_school_id());

CREATE POLICY "users can insert own school leads"
  ON public.leads FOR INSERT
  WITH CHECK (school_id = public.my_school_id());

CREATE POLICY "users can update own school leads"
  ON public.leads FOR UPDATE
  USING (school_id = public.my_school_id())
  WITH CHECK (school_id = public.my_school_id());

CREATE POLICY "users can delete own school leads"
  ON public.leads FOR DELETE
  USING (school_id = public.my_school_id());

-- ─── messages ───
DROP POLICY IF EXISTS "users can select own school messages" ON public.messages;
DROP POLICY IF EXISTS "users can insert own school messages" ON public.messages;

CREATE POLICY "users can select own school messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = messages.lead_id
        AND leads.school_id = public.my_school_id()
    )
  );

CREATE POLICY "users can insert own school messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = messages.lead_id
        AND leads.school_id = public.my_school_id()
    )
  );

-- ─── notes ───
DROP POLICY IF EXISTS "users can select own school notes" ON public.notes;
DROP POLICY IF EXISTS "users can insert own school notes" ON public.notes;

CREATE POLICY "users can select own school notes"
  ON public.notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = notes.lead_id
        AND leads.school_id = public.my_school_id()
    )
  );

CREATE POLICY "users can insert own school notes"
  ON public.notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = notes.lead_id
        AND leads.school_id = public.my_school_id()
    )
  );

-- ============================================================
-- REALTIME: Habilita publicação das tabelas
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================
-- FUNÇÃO: Cria usuário após signup no Auth
-- Chamada automaticamente quando um usuário é criado no Auth
-- O school_id deve ser passado nos user_metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, school_id, name, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'school_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
