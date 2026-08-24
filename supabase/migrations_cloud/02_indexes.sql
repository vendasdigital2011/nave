-- ==============================================================================
-- 02_INDEXES.SQL - SUPABASE CLOUD OFICIAL
-- Índices para Alta Performance em Consultas do Kanban, Clientes e Métricas
-- ==============================================================================

-- Índices na Tabela clients
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_operator ON public.clients(operator_email);

-- Índices na Tabela interactions
CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON public.interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at DESC);

-- Índices na Tabela audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON public.audit_logs(operator_email);
