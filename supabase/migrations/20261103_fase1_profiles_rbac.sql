-- ==============================================================================
-- FASE 1: MULTIUSUÁRIOS, AUTENTICAÇÃO E PERMISSÕES (RBAC)
-- Projeto: NaveProspect - Supabase Cloud (https://cehrtqnvxeugjqkzfnvz.supabase.co)
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM DOS PAPÉIS DE USUÁRIO (RBAC)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'admin',
        'supervisor',
        'seller'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE PERFIS DE USUÁRIOS (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'seller',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 5. TRIGGER DE UPDATED_AT PARA PROFILES
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profiles_updated_at();

-- 6. TRIGGER PARA CRIAR PERFIL AUTOMÁTICO AO CRIAR USUÁRIO NO AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val public.user_role;
    user_name_val TEXT;
BEGIN
    user_name_val := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
    
    -- Se for o primeiro usuário cadastrado ou explicitado nos metadados como admin
    IF (SELECT count(*) FROM public.profiles) = 0 OR (NEW.raw_user_meta_data->>'role') = 'admin' THEN
        user_role_val := 'admin'::public.user_role;
    ELSIF (NEW.raw_user_meta_data->>'role') = 'supervisor' THEN
        user_role_val := 'supervisor'::public.user_role;
    ELSE
        user_role_val := 'seller'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, display_name, role, is_active)
    VALUES (NEW.id, user_name_val, user_role_val, true)
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. FUNÇÃO HELPER PARA CONSULTAR PAPEL COM SEGURANÇA (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 8. COLUNA ADITIVA DE AUDITORIA (actor_user_id)
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);

-- 9. HABILITAR E CONFIGURAR ROW LEVEL SECURITY (RLS) EM PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer usuario autenticado pode ver perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus proprios nomes" ON public.profiles;

-- Leituras: Usuários autenticados podem ver perfis ativos dos colegas para listar responsáveis
CREATE POLICY "Qualquer usuario autenticado pode ver perfis" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Admins têm controle total sobre criação, edição e suspensão
CREATE POLICY "Admins podem gerenciar perfis" ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');

-- Usuários comuns podem atualizar apenas seu próprio display_name, sem alterar role nem status
CREATE POLICY "Usuarios podem atualizar seus proprios nomes" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND is_active = true);
