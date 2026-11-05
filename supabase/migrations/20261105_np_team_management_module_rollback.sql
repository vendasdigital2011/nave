-- ============================================================================
-- ROLLBACK: 20261105_np_team_management_module_rollback.sql
-- Reversão segura do Módulo Independente de Gestão de Usuários e Vendedores
-- Remove apenas os objetos criados na migration correspondente.
-- Preserva auth.users, clients, interactions e demais tabelas legadas.
-- ============================================================================

DROP POLICY IF EXISTS np_team_audit_admin_read ON public.np_team_audit_events;
DROP POLICY IF EXISTS np_team_profiles_admin_all ON public.np_team_profiles;
DROP POLICY IF EXISTS np_team_profiles_read_own ON public.np_team_profiles;

DROP TABLE IF EXISTS public.np_team_audit_events CASCADE;
DROP TABLE IF EXISTS public.np_team_profiles CASCADE;
