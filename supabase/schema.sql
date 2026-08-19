-- ==============================================================================
-- UPGRADE CRM WHATSAPP MVP - SCHEMA SUPABASE POSTGRESQL
-- ==============================================================================

-- Habilita extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criação do tipo enum para o status do funil do cliente
DO $$ BEGIN
    CREATE TYPE client_status AS ENUM ('frio', 'morno', 'quente', 'vendido', 'desativado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    condominium VARCHAR(255) DEFAULT 'Geral',
    current_plan VARCHAR(100) DEFAULT '50 Mega',
    target_plan VARCHAR(100) DEFAULT '100 Mega',
    status client_status NOT NULL DEFAULT 'frio',
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    wants_upgrade BOOLEAN DEFAULT false,
    gave_referral BOOLEAN DEFAULT false,
    referral_name VARCHAR(255),
    referral_phone VARCHAR(50),
    feedback_first_contact TEXT,
    feedback_second_contact TEXT,
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para consultas rápidas no Kanban e Dashboard
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

-- 2. TABELA DE INTERAÇÕES / HISTÓRICO
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'call', 'note', 'status_change'
    content TEXT NOT NULL,
    old_status client_status,
    new_status client_status,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON public.interactions(client_id);

-- 3. FUNÇÃO E TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DO updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'vendido' AND (OLD.status IS DISTINCT FROM 'vendido') THEN
        NEW.sold_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. POLÍTICAS DE ACESSO (RLS - Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Permitir leitura e escrita para usuários autenticados e service_role / anon no MVP
DROP POLICY IF EXISTS "Permitir acesso completo para autenticados e anon no MVP" ON public.clients;
CREATE POLICY "Permitir acesso completo para autenticados e anon no MVP" ON public.clients
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir interacoes para autenticados e anon no MVP" ON public.interactions;
CREATE POLICY "Permitir interacoes para autenticados e anon no MVP" ON public.interactions
    FOR ALL
    USING (true)
    WITH CHECK (true);
