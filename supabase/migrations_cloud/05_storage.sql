-- ==============================================================================
-- 05_STORAGE.SQL - SUPABASE CLOUD OFICIAL
-- Configuração de Storage Buckets Opcionais (Se necessário no futuro)
-- ==============================================================================

-- Registra bucket 'imports' para armazenar planilhas e anexos se desejado
INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública para o bucket 'imports'
DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
CREATE POLICY "Public Storage Access" ON storage.objects
    FOR ALL
    USING (bucket_id = 'imports')
    WITH CHECK (bucket_id = 'imports');
