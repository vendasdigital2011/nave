-- ==============================================================================
-- 03_FUNCTIONS.SQL - SUPABASE CLOUD OFICIAL
-- Triggers e Funções PL/pgSQL para Atualização Automática de Campos
-- ==============================================================================

-- Função para atualizar updated_at e marcar sold_at na conversão
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

-- Trigger executado antes de qualquer UPDATE na tabela clients
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
