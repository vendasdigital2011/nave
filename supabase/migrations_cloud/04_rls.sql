-- ==============================================================================
-- 04_RLS.SQL - SUPABASE CLOUD OFICIAL
-- Políticas de Segurança (Row Level Security)
-- ==============================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir acesso completo para clientes no MVP" ON public.clients;
DROP POLICY IF EXISTS "Permitir acesso completo para interacoes no MVP" ON public.interactions;
DROP POLICY IF EXISTS "Permitir acesso completo para audit_logs no MVP" ON public.audit_logs;

-- Criação de Políticas de Acesso Total para a API da Aplicação
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
