-- ==============================================================================
-- SCHEMA COMPLETO SUPABASE CLOUD OFICIAL - NAVETECH TELECOM (UPGRADE 100M)
-- Projeto: https://cehrtqnvxeugjqkzfnvz.supabase.co
-- ==============================================================================

-- 1. HABILITAR EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM DOS STATUS DO FUNIL COMERCIAL DE 6 ETAPAS
DO $$ BEGIN
    CREATE TYPE public.client_status AS ENUM (
        'importados',
        'frio',
        'morno',
        'quente',
        'vendido',
        'desativado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE CLIENTES (clients)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    condominium VARCHAR(255) DEFAULT 'Geral',
    current_plan VARCHAR(100) DEFAULT '50 Mega',
    target_plan VARCHAR(100) DEFAULT '100 Mega',
    status public.client_status NOT NULL DEFAULT 'importados',
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    wants_upgrade BOOLEAN DEFAULT false,
    gave_referral BOOLEAN DEFAULT false,
    referral_name VARCHAR(255),
    referral_phone VARCHAR(50),
    feedback_first_contact TEXT,
    feedback_second_contact TEXT,
    notes TEXT,
    operator_email VARCHAR(255) DEFAULT 'admin@navetech.com.br',
    last_contact_at TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE INTERAÇÕES (interactions)
CREATE TABLE IF NOT EXISTS public.interactions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    content TEXT,
    channel VARCHAR(50) DEFAULT 'whatsapp',
    message_content TEXT,
    direction VARCHAR(20) DEFAULT 'outbound',
    status VARCHAR(50) DEFAULT 'sent',
    old_status public.client_status,
    new_status public.client_status,
    operator_email VARCHAR(255) DEFAULT 'admin@navetech.com.br',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE AUDITORIA (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    operator_email VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    target_client_id TEXT,
    target_client_name TEXT,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_operator ON public.clients(operator_email);
CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON public.interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON public.audit_logs(operator_email);

-- 7. FUNÇÃO E TRIGGER FOR UPDATED_AT & SOLD_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'vendido' AND (OLD.status IS DISTINCT FROM 'vendido') THEN
        NEW.sold_at = timezone('utc'::text, now());
        NEW.wants_upgrade = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo para clientes no MVP" ON public.clients;
DROP POLICY IF EXISTS "Permitir acesso completo para interacoes no MVP" ON public.interactions;
DROP POLICY IF EXISTS "Permitir acesso completo para audit_logs no MVP" ON public.audit_logs;

CREATE POLICY "Permitir acesso completo para clientes no MVP" ON public.clients
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir acesso completo para interacoes no MVP" ON public.interactions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir acesso completo para audit_logs no MVP" ON public.audit_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

