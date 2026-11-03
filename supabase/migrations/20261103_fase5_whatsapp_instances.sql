-- ==============================================================================
-- FASE 5: EVOLUTION API COM INSTÂNCIA WHATSAPP MULTIUSUÁRIO
-- Projeto: NaveProspect - Supabase Cloud (https://cehrtqnvxeugjqkzfnvz.supabase.co)
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE INSTÂNCIAS DE WHATSAPP (whatsapp_instances)
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'evolution',
    provider_instance_name VARCHAR(100) NOT NULL UNIQUE,
    owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    display_phone_masked VARCHAR(50),
    profile_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    connected_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_owner ON public.whatsapp_instances(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_name ON public.whatsapp_instances(provider_instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON public.whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_default ON public.whatsapp_instances(is_default);

-- 4. TRIGGER DE UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_whatsapp_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'open' AND (OLD.status IS NULL OR OLD.status != 'open') THEN
        NEW.connected_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_whatsapp_instances_updated_at ON public.whatsapp_instances;
CREATE TRIGGER set_whatsapp_instances_updated_at
    BEFORE UPDATE ON public.whatsapp_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_whatsapp_instances_updated_at();

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de instancias para autenticados" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Gerenciamento de instancias" ON public.whatsapp_instances;

CREATE POLICY "Leitura de instancias para autenticados" ON public.whatsapp_instances
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerenciamento de instancias" ON public.whatsapp_instances
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. BACKFILL IDEMPOTENTE DA INSTÂNCIA LEGADA NAVE
INSERT INTO public.whatsapp_instances (
    provider,
    provider_instance_name,
    owner_user_id,
    display_phone_masked,
    profile_name,
    status,
    is_active,
    is_default,
    connected_at,
    last_seen_at
) VALUES (
    'evolution',
    'nave',
    NULL, -- Instância corporativa principal / compartilhada
    '+55 77 9****-0295',
    'Robson Oliveira Macedo - Navetech',
    'open',
    true,
    true,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
) ON CONFLICT (provider_instance_name) DO UPDATE SET
    status = 'open',
    is_default = true,
    profile_name = 'Robson Oliveira Macedo - Navetech',
    updated_at = timezone('utc'::text, now());
