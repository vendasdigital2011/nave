-- ==============================================================================
-- FASE 4: DISTRIBUIÇÃO DE LEADS, MEU DIA E AGENDA DE TAREFAS
-- Projeto: NaveProspect - Supabase Cloud (https://cehrtqnvxeugjqkzfnvz.supabase.co)
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS DE TAREFAS
DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM (
        'pending',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_type AS ENUM (
        'call',
        'whatsapp',
        'followup',
        'visit',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. GARANTIR FOREIGN KEY DE CAMPAIGN_LEADS PARA PROFILES
DO $$ BEGIN
    ALTER TABLE public.campaign_leads 
        ADD CONSTRAINT fk_campaign_leads_assigned_profile 
        FOREIGN KEY (assigned_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION 
    WHEN others THEN null;
END $$;

-- 4. TABELA DE TAREFAS E AGENDA DE RETORNO (lead_tasks)
CREATE TABLE IF NOT EXISTS public.lead_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_lead_id UUID NOT NULL REFERENCES public.campaign_leads(id) ON DELETE CASCADE,
    assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type public.task_type NOT NULL DEFAULT 'followup',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ NOT NULL,
    status public.task_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE HISTÓRICO DE TRANSFERÊNCIAS (lead_transfers)
CREATE TABLE IF NOT EXISTS public.lead_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_lead_id UUID NOT NULL REFERENCES public.campaign_leads(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    transferred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_due ON public.lead_tasks(assigned_user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead ON public.lead_tasks(campaign_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_status ON public.lead_tasks(status);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_lead ON public.lead_transfers(campaign_lead_id);

-- 7. TRIGGER DE UPDATED_AT PARA LEAD_TASKS
CREATE OR REPLACE FUNCTION public.handle_lead_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_lead_tasks_updated_at ON public.lead_tasks;
CREATE TRIGGER set_lead_tasks_updated_at
    BEFORE UPDATE ON public.lead_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_lead_tasks_updated_at();

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de tarefas para autenticados" ON public.lead_tasks;
DROP POLICY IF EXISTS "Gerenciamento de tarefas" ON public.lead_tasks;
DROP POLICY IF EXISTS "Leitura de transferencias para autenticados" ON public.lead_transfers;
DROP POLICY IF EXISTS "Insercao de transferencias" ON public.lead_transfers;

CREATE POLICY "Leitura de tarefas para autenticados" ON public.lead_tasks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerenciamento de tarefas" ON public.lead_tasks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de transferencias para autenticados" ON public.lead_transfers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insercao de transferencias" ON public.lead_transfers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
