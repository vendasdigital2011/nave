# Módulo de Gestão de Usuários e Vendedores (NaveProspect)

Módulo 100% aditivo e desacoplado, desenvolvido para permitir o cadastro, convite, ativação e governança de vendedores e supervisores no CRM NaveProspect sem impacto nas rotas ou dados legados.

## 1. Princípios Arquiteturais (REGRA ZERO)
- **Zero Modificação no Legado**: Nenhuma alteração em tabelas (`clients`, `interactions`, `campaigns`), componentes de navegação ou rotas legadas.
- **Chamada Sob Demanda**: O código é carregado apenas quando o administrador acessa `/admin/equipe` ou quando o usuário acessa `/ativar-conta`.
- **Sem MFA/2FA**: Nenhum aplicativo autenticador ou SMS é exigido. A ativação ocorre via link individual seguro do Supabase Auth Admin.
- **Feature Flag do Servidor**: Controlado via `NP_TEAM_MODULE_ENABLED=true/false` (padrão desligado).
- **Proteção do Último Admin**: O serviço impede explicitamente a suspensão, desativação ou rebaixamento do último administrador ativo da equipe.

## 2. Estrutura de Arquivos
```text
src/
  modules/
    team-management/
      components/
        team-table.tsx       # Tabela de membros com filtros e ações
        invite-modal.tsx     # Modal de convite de novo membro
        audit-drawer.tsx     # Gaveta com trilha de auditoria
      server/
        team-service.ts      # Regras de negócio, Supabase Auth Admin API e auditoria
      validators/
        index.ts             # Validações estritas de e-mail, nome, papéis e status
      types/
        index.ts             # Tipos TypeScript do módulo
      README.md              # Esta documentação
```

## 3. Rotas Isoladas
- **UI Administrativa**: `/admin/equipe` (Apenas administradores autenticados)
- **UI de Ativação**: `/ativar-conta` (Fluxo isolado onde o usuário define sua senha)
- **API Administrativa**:
  - `GET /api/admin/team` (Listagem com filtros)
  - `POST /api/admin/team` (Convite de novo membro)
  - `PATCH /api/admin/team/[userId]` (Atualização de cargo e status com proteção de lockout)
  - `POST /api/admin/team/[userId]/resend` (Reenvio seguro de convite)
  - `GET /api/admin/team/audit` (Consulta da trilha de auditoria)

## 4. Esquema de Banco de Dados Aditivo
- **Tabela**: `public.np_team_profiles` (chave primária `user_id uuid` vinculada a `auth.users(id)`)
- **Tabela**: `public.np_team_audit_events` (registro imutável de eventos administrativos)
- **Migrations**: `supabase/migrations/20261105_np_team_management_module.sql`
- **Rollback**: `supabase/migrations/20261105_np_team_management_module_rollback.sql`
