-- ==============================================================================
-- FASE 6: CENTRAL DE CONVERSAS, RESPOSTAS RECEBIDAS E AUDITORIA INTEGRAL
-- Projeto: NaveProspect - Supabase Cloud (https://cehrtqnvxeugjqkzfnvz.supabase.co)
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM DE STATUS DA CONVERSA
DO $$ BEGIN
    CREATE TYPE public.conversation_status AS ENUM (
        'unread',
        'waiting_user',
        'waiting_client',
        'pending',
        'triagem',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE CONVERSAS (conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
    contact_client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    campaign_lead_id UUID REFERENCES public.campaign_leads(id) ON DELETE SET NULL,
    assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    status public.conversation_status NOT NULL DEFAULT 'waiting_user',
    unread_count INTEGER NOT NULL DEFAULT 0,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_conversations_instance_phone UNIQUE (instance_id, contact_phone)
);

-- 4. TABELA DE MENSAGENS (messages) - IMUTÁVEL / AUDITÁVEL
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    provider_message_id VARCHAR(255) UNIQUE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender_ref VARCHAR(255),
    body TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL DEFAULT 'text',
    provider_timestamp TIMESTAMPTZ,
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
    created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE EVENTOS DA CONVERSA (conversation_events) - APPEND ONLY
CREATE TABLE IF NOT EXISTS public.conversation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABELA DE NOTAS COMERCIAIS E OBJEÇÕES (conversation_notes)
CREATE TABLE IF NOT EXISTS public.conversation_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    author_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    commercial_classification VARCHAR(100),
    objection VARCHAR(255),
    content TEXT NOT NULL,
    next_followup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABELA DE AUDITORIA DE WEBHOOKS (webhook_events)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_event_id VARCHAR(255) UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    instance_name VARCHAR(100) NOT NULL,
    payload_hash VARCHAR(64),
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_conversations_instance ON public.conversations(instance_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON public.conversations(contact_client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_campaign_lead ON public.conversations(campaign_lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_provider_id ON public.messages(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_conversation_events_conv ON public.conversation_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_conv ON public.conversation_notes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id ON public.webhook_events(provider_event_id);

-- 9. TRIGGER DE UPDATED_AT PARA CONVERSATIONS
CREATE OR REPLACE FUNCTION public.handle_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_conversations_updated_at ON public.conversations;
CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_conversations_updated_at();

-- 10. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de conversas para autenticados" ON public.conversations;
DROP POLICY IF EXISTS "Gerenciamento de conversas" ON public.conversations;
DROP POLICY IF EXISTS "Leitura de mensagens para autenticados" ON public.messages;
DROP POLICY IF EXISTS "Insercao de mensagens" ON public.messages;
DROP POLICY IF EXISTS "Leitura de eventos" ON public.conversation_events;
DROP POLICY IF EXISTS "Insercao de eventos" ON public.conversation_events;
DROP POLICY IF EXISTS "Leitura de notas" ON public.conversation_notes;
DROP POLICY IF EXISTS "Gerenciamento de notas" ON public.conversation_notes;
DROP POLICY IF EXISTS "Leitura de webhook_events" ON public.webhook_events;
DROP POLICY IF EXISTS "Insercao de webhook_events" ON public.webhook_events;

CREATE POLICY "Leitura de conversas para autenticados" ON public.conversations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerenciamento de conversas" ON public.conversations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de mensagens para autenticados" ON public.messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insercao de mensagens" ON public.messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de eventos" ON public.conversation_events
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insercao de eventos" ON public.conversation_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de notas" ON public.conversation_notes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerenciamento de notas" ON public.conversation_notes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de webhook_events" ON public.webhook_events
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insercao de webhook_events" ON public.webhook_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. POVOAMENTO IDEMPOTENTE INICIAL: Vincular clientes da instância 'nave'
DO $$
DECLARE
    inst_id UUID;
BEGIN
    SELECT id INTO inst_id FROM public.whatsapp_instances WHERE provider_instance_name = 'nave' LIMIT 1;
    
    IF inst_id IS NOT NULL THEN
        -- Criar registros de conversa para clientes que ainda não possuem
        INSERT INTO public.conversations (
            instance_id,
            contact_client_id,
            campaign_lead_id,
            assigned_user_id,
            contact_phone,
            contact_name,
            status,
            last_message_text,
            last_message_at
        )
        SELECT 
            inst_id,
            c.id,
            cl.id,
            cl.assigned_user_id,
            c.phone,
            c.name,
            CASE 
                WHEN c.status = 'morno' OR c.status = 'quente' THEN 'waiting_user'::public.conversation_status
                WHEN c.status = 'frio' THEN 'waiting_client'::public.conversation_status
                WHEN c.status = 'vendido' OR c.status = 'desativado' THEN 'closed'::public.conversation_status
                ELSE 'pending'::public.conversation_status
            END,
            COALESCE(c.notes, 'Cliente registrado na base de upgrade'),
            c.updated_at
        FROM public.clients c
        LEFT JOIN public.campaign_leads cl ON cl.client_id = c.id
        ON CONFLICT (instance_id, contact_phone) DO NOTHING;
    END IF;
END $$;
