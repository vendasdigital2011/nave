-- ==============================================================================
-- FASE 2: MULTICAMPANHAS E KANBANS INDEPENDENTES
-- Projeto: NaveProspect - Supabase Cloud (https://cehrtqnvxeugjqkzfnvz.supabase.co)
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS DE CAMPANHAS E ETAPAS
DO $$ BEGIN
    CREATE TYPE public.campaign_status AS ENUM (
        'active',
        'paused',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stage_kind AS ENUM (
        'open',
        'won',
        'lost'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE CAMPANHAS (campaigns)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'upgrade',
    description TEXT,
    status public.campaign_status NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE ETAPAS DO FUNIL (campaign_stages)
CREATE TABLE IF NOT EXISTS public.campaign_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    stage_kind public.stage_kind NOT NULL DEFAULT 'open',
    color VARCHAR(50) DEFAULT '#FF6A00',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE MEMBROS DA CAMPANHA (campaign_members)
CREATE TABLE IF NOT EXISTS public.campaign_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(campaign_id, user_id)
);

-- 6. TABELA DE LEADS POR CAMPANHA (campaign_leads)
CREATE TABLE IF NOT EXISTS public.campaign_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.campaign_stages(id) ON DELETE RESTRICT,
    assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    converted_at TIMESTAMPTZ,
    lost_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(campaign_id, client_id)
);

-- 7. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_stages_campaign ON public.campaign_stages(campaign_id, position);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON public.campaign_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_client ON public.campaign_leads(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_stage ON public.campaign_leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_assigned ON public.campaign_leads(assigned_user_id);

-- 8. TRIGGER DE UPDATED_AT PARA CAMPAIGNS E CAMPAIGN_LEADS
CREATE OR REPLACE FUNCTION public.handle_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER set_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_campaigns_updated_at();

DROP TRIGGER IF EXISTS set_campaign_leads_updated_at ON public.campaign_leads;
CREATE TRIGGER set_campaign_leads_updated_at
    BEFORE UPDATE ON public.campaign_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_campaigns_updated_at();

-- 9. POPULAÇÃO INICIAL DAS CAMPANHAS OFICIAIS (IDEMPOTENTE COM UUIDS FIXOS)

-- Campanha 1: Upgrade 50 -> 100 Mega (Legado)
INSERT INTO public.campaigns (id, name, type, description, status)
VALUES (
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'Upgrade 50 → 100 Mega',
    'upgrade',
    'Campanha oficial de migração de clientes 50 Mega para 100 Mega.',
    'active'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Etapas da Campanha 1 (Upgrade)
INSERT INTO public.campaign_stages (id, campaign_id, name, position, stage_kind, color)
VALUES
    ('s0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Importados', 0, 'open', '#64748B'),
    ('s0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Contato Iniciado', 1, 'open', '#3B82F6'),
    ('s0000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Em Negociação', 2, 'open', '#F59E0B'),
    ('s0000000-0000-0000-0000-000000000004'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Proposta Enviada', 3, 'open', '#FF6A00'),
    ('s0000000-0000-0000-0000-000000000005'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Vendido', 4, 'won', '#10B981'),
    ('s0000000-0000-0000-0000-000000000006'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Desativado', 5, 'lost', '#EF4444')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    position = EXCLUDED.position,
    stage_kind = EXCLUDED.stage_kind,
    color = EXCLUDED.color;

-- Campanha 2: Leads Hotspot (Novas Importações Semanais)
INSERT INTO public.campaigns (id, name, type, description, status)
VALUES (
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'Leads Hotspot',
    'hotspot',
    'Prospecção de novos clientes originados dos Hotspots Wi-Fi Navetech.',
    'active'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Etapas da Campanha 2 (Hotspot)
INSERT INTO public.campaign_stages (id, campaign_id, name, position, stage_kind, color)
VALUES
    ('s0000000-0000-0000-0000-000000000011'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Novos Leads', 0, 'open', '#64748B'),
    ('s0000000-0000-0000-0000-000000000012'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Em Contato', 1, 'open', '#3B82F6'),
    ('s0000000-0000-0000-0000-000000000013'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Interessados', 2, 'open', '#F59E0B'),
    ('s0000000-0000-0000-0000-000000000014'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Agendados', 3, 'open', '#8B5CF6'),
    ('s0000000-0000-0000-0000-000000000015'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Convertidos', 4, 'won', '#10B981'),
    ('s0000000-0000-0000-0000-000000000016'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Perdidos', 5, 'lost', '#EF4444')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    position = EXCLUDED.position,
    stage_kind = EXCLUDED.stage_kind,
    color = EXCLUDED.color;

-- 10. BACKFILL IDEMPOTENTE DOS 125 CLIENTES EXISTENTES PARA A CAMPANHA UPGRADE
INSERT INTO public.campaign_leads (
    campaign_id,
    client_id,
    stage_id,
    notes,
    converted_at,
    lost_at,
    created_at,
    updated_at
)
SELECT
    'c0000000-0000-0000-0000-000000000001'::uuid,
    c.id,
    CASE 
        WHEN c.status = 'importados' THEN 's0000000-0000-0000-0000-000000000001'::uuid
        WHEN c.status = 'frio' THEN 's0000000-0000-0000-0000-000000000002'::uuid
        WHEN c.status = 'morno' THEN 's0000000-0000-0000-0000-000000000003'::uuid
        WHEN c.status = 'quente' THEN 's0000000-0000-0000-0000-000000000004'::uuid
        WHEN c.status = 'vendido' THEN 's0000000-0000-0000-0000-000000000005'::uuid
        WHEN c.status = 'desativado' THEN 's0000000-0000-0000-0000-000000000006'::uuid
        ELSE 's0000000-0000-0000-0000-000000000001'::uuid
    END,
    c.notes,
    CASE WHEN c.status = 'vendido' THEN COALESCE(c.sold_at, c.updated_at) ELSE NULL END,
    CASE WHEN c.status = 'desativado' THEN c.updated_at ELSE NULL END,
    c.created_at,
    c.updated_at
FROM public.clients c
ON CONFLICT (campaign_id, client_id) DO NOTHING;

-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de campanhas para autenticados" ON public.campaigns;
DROP POLICY IF EXISTS "Gerenciamento de campanhas para admin e supervisor" ON public.campaigns;
DROP POLICY IF EXISTS "Leitura de etapas para autenticados" ON public.campaign_stages;
DROP POLICY IF EXISTS "Gerenciamento de etapas para admin e supervisor" ON public.campaign_stages;
DROP POLICY IF EXISTS "Acesso completo a membros de campanha" ON public.campaign_members;
DROP POLICY IF EXISTS "Leitura de leads para autenticados" ON public.campaign_leads;
DROP POLICY IF EXISTS "Edição e movimentação de leads no Kanban" ON public.campaign_leads;

-- Políticas de Leitura e Edição
CREATE POLICY "Leitura de campanhas para autenticados" ON public.campaigns
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerenciamento de campanhas para admin e supervisor" ON public.campaigns
    FOR ALL TO authenticated
    USING (public.get_my_role() IN ('admin', 'supervisor'))
    WITH CHECK (public.get_my_role() IN ('admin', 'supervisor'));

CREATE POLICY "Leitura de etapas para autenticados" ON public.campaign_stages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerenciamento de etapas para admin e supervisor" ON public.campaign_stages
    FOR ALL TO authenticated
    USING (public.get_my_role() IN ('admin', 'supervisor'))
    WITH CHECK (public.get_my_role() IN ('admin', 'supervisor'));

CREATE POLICY "Acesso completo a membros de campanha" ON public.campaign_members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de leads para autenticados" ON public.campaign_leads
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Edição e movimentação de leads no Kanban" ON public.campaign_leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
