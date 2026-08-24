-- ==============================================================================
-- 01_SCHEMA.SQL - SUPABASE CLOUD OFICIAL
-- Estrutura de Tabelas e Tipos para NaveProspect (Upgrade 100M)
-- ==============================================================================

-- Habilita extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para os status oficiais do funil comercial de 6 etapas
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

-- 1. TABELA DE CLIENTES (clients)
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

-- 2. TABELA DE INTERAÇÕES E MENSAGENS (interactions)
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

-- 3. TABELA DE AUDITORIA (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    operator_email VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    target_client_id TEXT,
    target_client_name TEXT,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
