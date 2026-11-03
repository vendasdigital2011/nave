-- ==============================================================================
-- FASE 3: IMPORTAÇÃO EXCEL POR CAMPANHA E RASTREABILIDADE DE LOTES
-- Projeto: NaveProspect - Supabase Cloud (https://cehrtqnvxeugjqkzfnvz.supabase.co)
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE LOTES DE IMPORTAÇÃO (import_batches)
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operator_email VARCHAR(255) DEFAULT 'admin@navetech.com.br',
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    inserted_clients INTEGER NOT NULL DEFAULT 0,
    linked_leads INTEGER NOT NULL DEFAULT 0,
    duplicate_leads INTEGER NOT NULL DEFAULT 0,
    rejected_rows INTEGER NOT NULL DEFAULT 0,
    error_summary TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA DE LINHAS DO LOTE DE IMPORTAÇÃO (import_batch_rows)
CREATE TABLE IF NOT EXISTS public.import_batch_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    raw_name VARCHAR(255),
    raw_phone VARCHAR(50),
    normalized_phone VARCHAR(50),
    result VARCHAR(50) NOT NULL, -- 'inserted', 'linked', 'duplicate', 'rejected'
    error_code VARCHAR(100),
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    campaign_lead_id UUID REFERENCES public.campaign_leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. COLUNA ADITIVA EM CAMPAIGN_LEADS (first_import_batch_id)
ALTER TABLE public.campaign_leads
ADD COLUMN IF NOT EXISTS first_import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL;

-- 5. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_import_batches_campaign ON public.import_batches(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_batches_hash ON public.import_batches(file_hash);
CREATE INDEX IF NOT EXISTS idx_import_batch_rows_batch ON public.import_batch_rows(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_batch_rows_phone ON public.import_batch_rows(normalized_phone);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batch_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de lotes de importacao para autenticados" ON public.import_batches;
DROP POLICY IF EXISTS "Insercao e gerenciamento de lotes de importacao" ON public.import_batches;
DROP POLICY IF EXISTS "Leitura de linhas de lote para autenticados" ON public.import_batch_rows;
DROP POLICY IF EXISTS "Insercao de linhas de lote" ON public.import_batch_rows;

CREATE POLICY "Leitura de lotes de importacao para autenticados" ON public.import_batches
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insercao e gerenciamento de lotes de importacao" ON public.import_batches
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de linhas de lote para autenticados" ON public.import_batch_rows
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insercao de linhas de lote" ON public.import_batch_rows
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
