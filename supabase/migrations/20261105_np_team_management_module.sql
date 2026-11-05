-- ============================================================================
-- MIGRATION: 20261105_np_team_management_module.sql
-- Módulo Independente de Gestão de Usuários e Vendedores (NaveProspect)
--
-- REGRA ZERO: 100% Aditiva. Nenhuma tabela existente (clients, interactions,
-- campaigns, profiles, etc.) é alterada, renomeada ou excluída.
-- ============================================================================

-- 1. Tabela de Perfis do Módulo de Equipe
CREATE TABLE IF NOT EXISTS public.np_team_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  email_snapshot text,
  role text NOT NULL CHECK (role IN ('admin', 'supervisor', 'vendedor')),
  status text NOT NULL DEFAULT 'convite_pendente' CHECK (status IN ('convite_pendente', 'ativo', 'suspenso', 'desativado')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz NULL,
  suspended_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela de Trilha de Auditoria Exclusiva do Módulo
CREATE TABLE IF NOT EXISTS public.np_team_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  before_data jsonb NULL,
  after_data jsonb NULL,
  request_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Índices de Performance e Consulta
CREATE INDEX IF NOT EXISTS idx_np_team_profiles_status ON public.np_team_profiles(status);
CREATE INDEX IF NOT EXISTS idx_np_team_profiles_role ON public.np_team_profiles(role);
CREATE INDEX IF NOT EXISTS idx_np_team_profiles_invited_at ON public.np_team_profiles(invited_at DESC);
CREATE INDEX IF NOT EXISTS idx_np_team_audit_created_at ON public.np_team_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_np_team_audit_actor ON public.np_team_audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_np_team_audit_target ON public.np_team_audit_events(target_user_id);

-- 4. Habilitação de RLS (Row Level Security)
ALTER TABLE public.np_team_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.np_team_audit_events ENABLE ROW LEVEL SECURITY;

-- 5. Revogar privilégios do perfil anon (deny by default)
REVOKE ALL ON public.np_team_profiles FROM anon;
REVOKE ALL ON public.np_team_audit_events FROM anon;

-- 6. Políticas de Acesso Autenticado para np_team_profiles
DROP POLICY IF EXISTS np_team_profiles_read_own ON public.np_team_profiles;
CREATE POLICY np_team_profiles_read_own ON public.np_team_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS np_team_profiles_admin_all ON public.np_team_profiles;
CREATE POLICY np_team_profiles_admin_all ON public.np_team_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.np_team_profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'ativo'
    )
  );

-- 7. Políticas para np_team_audit_events
DROP POLICY IF EXISTS np_team_audit_admin_read ON public.np_team_audit_events;
CREATE POLICY np_team_audit_admin_read ON public.np_team_audit_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.np_team_profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'ativo'
    )
  );

-- 8. Concessão explícita para o service_role
GRANT ALL ON public.np_team_profiles TO service_role;
GRANT ALL ON public.np_team_audit_events TO service_role;

-- 9. Inicializar perfil administrativo do Administrador Geral existente
INSERT INTO public.np_team_profiles (user_id, full_name, email_snapshot, role, status, activated_at)
VALUES (
  '6d11b22c-3fb8-4f64-b770-a68a0b6a3546',
  'Administrador Geral',
  'admin@navetech.com.br',
  'admin',
  'ativo',
  now()
)
ON CONFLICT (user_id) DO NOTHING;
