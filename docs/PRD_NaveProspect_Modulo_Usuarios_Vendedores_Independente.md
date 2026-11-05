# PRD — NaveProspect | Módulo Independente de Gestão de Usuários e Vendedores

**Versão:** 1.0  
**Data:** 05/11/2026  
**Status:** Especificação para implementação incremental; não representa funcionalidade já instalada.  
**Projeto:** NaveProspect — Navetech Telecom  
**Produção informada:** https://nave-zeta.vercel.app  
**Repositório informado:** https://github.com/vendasdigital2011/nave (branch `main`)  
**Responsável pela implementação:** Antigravity, mediante inspeção prévia do repositório e aprovação do responsável pelo projeto.

---

## 1. Objetivo e regra inegociável

Adicionar um **módulo independente para cadastrar, convidar, ativar, gerenciar e suspender vendedores e supervisores**, com perfis e permissões próprias, **sem interromper ou reescrever qualquer funcionalidade que hoje já funciona**.

> **REGRA ZERO — PRESERVAÇÃO ABSOLUTA:** não refatorar autenticação, login, middleware, componentes, layouts, dashboard, Kanban, clientes, importações, conversas, instância Evolution API, serviços Supabase ou tabelas existentes por iniciativa própria. Trabalhar de forma **aditiva**, com arquivos, rotas e tabelas novas. Se algum requisito exigir alterar o legado, **parar, apresentar evidências, impacto e diff proposto, e pedir autorização específica antes de prosseguir**. Não aplicar alterações silenciosas.

A regra não significa prometer isolamento impossível: o módulo pode ser independente, mas **o uso de novas contas no login existente e o bloqueio dessas contas nas páginas antigas dependem da compatibilidade do mecanismo de autenticação já instalado**. Se houver conflito, apresentar como bloqueio, não contornar com uma segunda autenticação.

## 2. Escopo desta entrega

### INCLUÍDO

1. Painel administrativo de equipe acessível por rota nova (`/admin/equipe`, **se estiver disponível**).
2. Cadastro pelo administrador de: nome completo, e-mail, perfil de acesso, situação da conta, campanhas autorizadas quando o módulo multicampanhas existir.
3. Convite por e-mail com link individual de ativação, usando **Supabase Auth Admin API** em rota exclusiva do servidor.
4. Fluxo de ativação: confirmar convite e definir senha individual, respeitando as capacidades do Supabase Auth e a configuração real de callback/redirect.
5. Listagem e busca de funcionários; situação `convite_pendente`, `ativo`, `suspenso`, `desativado`.
6. Reenvio de convite ou instruções de recuperação **após validação do estado real da conta**, com limitação de frequência e sem criar contas duplicadas.
7. Perfis: `admin`, `supervisor` e `vendedor`, aplicados imediatamente **ao módulo novo**.
8. Concessão e revogação de permissões dentro do módulo, inclusive revogação de acesso às futuras integrações por usuário.
9. Trilha de auditoria específica para convites, alterações de perfil, suspensão, reativação e vínculos de campanha.
10. Interface responsiva no design já adotado pelo NaveProspect, sem redesenhar páginas existentes.
11. Testes de regressão e relatório de evidências antes de qualquer publicação.
12. Feature flag de habilitação do módulo, com padrão desligado, e rollback sem perda de dados.

### FORA DO ESCOPO

- **Não implementar MFA/2FA**: não exigir aplicativo autenticador, SMS ou código extra no login. A ativação por e-mail **não é MFA**.
- Não criar cadastro público/autocadastro.
- Não modificar a autenticação atual nem trocar o provedor de login.
- Não redistribuir leads existentes ou reestruturar Kanban.
- Não criar ou alterar campanhas, importações, relatórios ou tabelas de clientes.
- Não provisionar instâncias Evolution API nesta fase. Apenas preparar contrato de integração futura.
- Não criar robô de atendimento ou envio automático de WhatsApp.
- Não mexer em URLs de Supabase, Vercel ou instâncias atuais.

## 3. Contexto e pressupostos que precisam ser verificados

| Item | Referência de projeto | Conduta obrigatória |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | Confirmar `package.json` e roteamento real. |
| Dados | Supabase Cloud/PostgreSQL | Confirmar esquema atual e políticas RLS sem editar os objetos existentes. |
| Autenticação | Supabase Auth é a escolha proposta | **Verificar se já é utilizada no login atual. Não presumir.** |
| Operação | NaveProspect está em produção | Fazer snapshot/backup e validação read-only primeiro. |
| WhatsApp | Evolution API já integrada | Não alterar endpoint, webhooks, credenciais ou instância existente. |
| Clientes | Há 125 clientes importados segundo auditoria anterior | Confirmar contagem real antes/depois; não fazer UPDATE/DELETE em `clients`. |
| Campanhas | Multicampanhas planejadas | Vinculação opcional/desacoplada até existir esquema estável. |

**Portão de decisão A:** se o login atual for incompatível com convites do Supabase Auth, não reescrever `/login` e não implementar login paralelo. Entregar diagnóstico técnico e proposta de integração mínima separada, aguardando autorização.

**Portão de decisão B:** se `/admin/equipe`, `/ativar-conta` ou nomes de tabelas sugeridos já existirem, não sobrescrever: identificar alternativas e documentar.

## 4. Experiência do administrador

### 4.1 Nova tela de equipe

A rota nova exibe: nome, e-mail, perfil, status, última atividade quando disponível, data de cadastro e ações autorizadas. Filtros por perfil e status; busca por nome/e-mail; paginação. Sem expor senhas ou chaves privadas.

**Ações:** `Convidar funcionário`, `Reenviar convite` (quando válido), `Editar perfil`, `Suspender`, `Reativar`, `Desativar`, `Visualizar auditoria`.

### 4.2 Formulário de convite

| Campo | Tipo | Regra |
|---|---|---|
| Nome completo | Texto | Obrigatório; validar tamanho e remover espaços excedentes. |
| E-mail | E-mail | Obrigatório; normalizar para busca, validar; único no projeto Auth. |
| Perfil | Select | `vendedor` (padrão), `supervisor`, `admin` (apenas administradores autorizados). |
| Campanhas | Multiselect | Mostrar apenas se o módulo multicampanhas estiver instalado e homologado; caso contrário, indicar `vínculo pendente`, sem simular vínculo. |
| Status | Automático | Inicia como `convite_pendente`. |
| WhatsApp | Não nesta fase | Tela pode mostrar `Não configurado`; não criar instância. |

**Ao clicar em Convidar:** validar autorização no servidor, verificar duplicidade, enviar convite pelo Supabase Auth e registrar auditoria, sem registrar senha em tabela própria. Em falhas parciais, registrar estado reconciliável; nunca afirmar `convite enviado` quando a API retornou erro.

### 4.3 Ativação

1. Convite enviado ao endereço indicado.
2. Funcionário abre link individual e seguro que conduz a uma **nova rota isolada** de ativação, somente após configurar adequadamente o destino de redirecionamento permitido no Supabase.
3. O sistema valida a sessão/token de convite pelos mecanismos oficiais do Supabase Auth, nunca por token inventado em tabela própria.
4. Funcionário define sua senha e finaliza a ativação.
5. O status só passa a `ativo` **após confirmação verificável da identidade e conclusão da ativação**.
6. Login posterior utiliza o mecanismo existente **somente se compatível e testado**. Caso contrário, permanece bloqueado até aprovação de adaptação pontual.

**Não solicitar MFA em nenhuma etapa.** Aplicar políticas adequadas de senha, limitação de tentativas e mensagens de erro sem expor existência de contas a usuários não autorizados.

### 4.4 Suspensão e desligamento

- Suspender impede **acesso ao módulo novo** imediatamente por autorização verificada no backend/RLS. Revogação de sessão/token, quando suportada pelo Auth, deve ser testada; não declarar revogação instantânea global sem comprovação.
- Desativar preserva o histórico e dados de auditoria; não excluir usuário da tabela `auth.users` automaticamente.
- A transferência de leads e o bloqueio em **rotas antigas** pertencem a uma futura fase de integração, porque exigem verificar pontos de autorização do sistema existente.
- Nunca deletar conversas ou histórico ao desligar funcionário.

## 5. Matriz de autorização — módulo novo

| Ação | Admin | Supervisor | Vendedor |
|---|:---:|:---:|:---:|
| Listar toda a equipe | Sim | Apenas equipe autorizada, se vínculo disponível | Somente próprio perfil |
| Convidar funcionário | Sim | Não | Não |
| Alterar perfil/permissão | Sim | Não | Não |
| Suspender/desativar | Sim | Não | Não |
| Ver auditoria de usuários | Sim | Escopo autorizado, se existir | Não |
| Atualizar dados pessoais permitidos | Sim | Próprios | Próprios |
| Acessar campanhas | Conforme vínculo homologado | Conforme vínculo homologado | Conforme vínculo homologado |
| Conectar WhatsApp próprio | **Futuro módulo** | **Futuro módulo** | **Futuro módulo** |

Regras: `deny by default`; validar papel e status **sempre no servidor**. Não confiar em `role`, `is_admin` ou `user_id` enviados pelo navegador. Administrador não pode desativar a última conta administrativa ativa nem elevar perfil sem rastreabilidade. O primeiro admin deve ser vinculado a **identidade autenticada e verificada**, nunca a uma comparação solta com e-mail de ambiente.

## 6. Arquitetura isolada e chamada sob demanda

> Os caminhos abaixo são **sugestões**, não afirmações sobre arquivos existentes. Confirmar estrutura antes de criar.

```text
src/
  modules/
    team-management/
      components/
      server/
      validators/
      types/
      ui/
      README.md
  app/
    admin/
      equipe/
        page.tsx                   # rota nova; componente carregado sob demanda
    ativar-conta/
      page.tsx                    # rota nova para convite
    api/
      admin/
        team/
          route.ts                # listar e convidar
          [userId]/route.ts       # editar perfil/status
          [userId]/resend/route.ts
```

**Requisitos de desacoplamento:**

- Usar apenas **rotas novas e componentes novos**. O código do módulo não deve ser importado por páginas existentes nem adicionar listeners globais.
- A interface é carregada quando o administrador navega à rota, não durante a abertura do dashboard/Kanban; usar boundaries do App Router e lazy loading onde pertinente.
- Endpoints operacionais isolados, sem modificação em endpoints atuais.
- Criar uma camada adaptadora própria que consome contratos existentes **sem reescrever** clientes Supabase/serviços compartilhados.
- Se não existir ponto de extensão do menu, a primeira entrega será acessada **diretamente pela URL**. Não editar sidebar/layout sem autorização explícita.
- Feature flag do servidor: `NP_TEAM_MODULE_ENABLED=false` por padrão. Ligar apenas após homologação e aprovação. Não expor chave secreta por variável `NEXT_PUBLIC_*`.
- Sem cron jobs novos, sem webhooks novos, sem triggers globais em `auth.users` nesta fase, salvo necessidade demonstrada e expressamente aprovada após testes.

## 7. Modelo de dados aditivo (proposta, não SQL final)

Inspecionar `information_schema`, migrations e políticas atuais antes de selecionar nomes. Se houver colisão, adaptar o prefixo sem sobrescrever.

### `np_team_profiles`

- `user_id uuid PRIMARY KEY REFERENCES auth.users(id)`
- `full_name text NOT NULL`
- `email_snapshot text` (opcional, não fonte única da identidade)
- `role text CHECK (role IN ('admin','supervisor','vendedor'))`
- `status text CHECK (status IN ('convite_pendente','ativo','suspenso','desativado'))`
- `invited_by uuid NULL`
- `invited_at timestamptz`
- `activated_at timestamptz NULL`
- `suspended_at timestamptz NULL`
- `created_at`, `updated_at`

### `np_team_audit_events`

- `id uuid PRIMARY KEY`
- `actor_user_id uuid NULL`
- `target_user_id uuid NULL`
- `action text NOT NULL`
- `before_data jsonb`, `after_data jsonb` **sem tokens, senhas ou segredos**
- `created_at timestamptz`
- `request_id text NULL`

### Associação futura com campanhas

- Reservar contrato lógico `user_id`, `campaign_id`, `membership_role`, `status`, mas **não criar FK para tabela de campanhas que ainda não exista** e não modificar `clients`/`interactions` nesta entrega.
- Se a tabela `campaigns` já existir e estiver homologada, propor migration separada e reversível para `np_team_campaign_access`; executar apenas com autorização específica.
- A instância WhatsApp por usuário será responsabilidade da fase Evolution Multi-instância. O módulo atual não cria, altera nem desconecta instâncias.

### RLS e proteção

- Ativar RLS nas tabelas **novas**; negar acesso anônimo.
- Policy de leitura do próprio perfil, listagem administrativa e ações privilegiadas pelo servidor, sempre checando o ID autenticado.
- Evitar recursão de policies (`profiles` consultando ela mesma); preferir funções de autorização com `search_path` fixo, privilégios mínimos e testes de bypass.
- Client não pode escrever `role`, `status` nem `invited_by` diretamente.
- Índices por `status`, `role`, `invited_at` conforme necessidade comprovada.
- Não alterar `auth.users` nem criar triggers sobre esquema Auth na primeira entrega.

## 8. API e integração Supabase

- Usar a Admin API `supabase.auth.admin.inviteUserByEmail(email, { redirectTo })`, **exclusivamente no backend**, com credencial secreta disponível apenas ao servidor.
- Resolver qual tipo de credencial (`sb_secret_` ou chave legada) é suportado pelo SDK em uso e pelo projeto antes de implementar; nunca assumir equivalência cega.
- Proteger `POST /api/admin/team` e operações administrativas com sessão validada e perfil administrativo consultado no servidor.
- Validação de payload com biblioteca já presente (ex.: Zod, se instalada); limite de tamanho, rate limit e idempotência de tentativas.
- A ação de convite pode criar a identidade Auth antes de criar o perfil. Planejar reconciliação se uma das duas operações falhar; não presumir transação entre API Auth e Postgres.
- Tratar e-mail já existente como caso específico; não duplicar nem tentar sobrescrever credenciais.
- Auditar tentativa, sucesso ou falha sem registrar token de convite.
- A configuração de e-mail SMTP e URLs autorizadas pode afetar outros fluxos de autenticação. **Não alterar configuração compartilhada sem análise e aprovação.**

Referência técnica: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail

## 9. Segurança e restrições de implantação

1. **Sem MFA** — excluído expressamente deste PRD.
2. Nada de senhas criadas pelo administrador, senhas padrão, `ADMIN_PASSWORD` hardcoded ou senhas em texto simples.
3. Não expor chaves `sb_secret_`, Evolution ou quaisquer secrets no browser, repositório, logs ou relatórios.
4. Rotacionar, em procedimento operacional separado, as credenciais que foram compartilhadas previamente em texto. A rotação exige janela e validação para não quebrar serviços; não fazê-la silenciosamente dentro desta fase.
5. Acesso admin deve depender de autenticação real, não de comparação de e-mail no frontend.
6. Rate limiting e respostas genéricas em operações sensíveis.
7. Não enviar credenciais ou dados pessoais para APIs de IA; este módulo não chama IA.
8. Padrões de audit log sem conteúdo de mensagens comerciais.
9. Para o alcance de novas permissões no **sistema legado**, apresentar previamente auditoria de pontos de acesso. A entrega atual não garante isolamento em páginas legadas que não consultam essas permissões.

## 10. Etapas fechadas para Antigravity

### Etapa 0 — Auditoria somente leitura (obrigatória)

- Identificar versões, pasta app, mecanismos reais de login/sessão, middleware, layouts, rotas existentes, Auth Supabase, possíveis tabelas de perfis, políticas RLS e testes.
- Registrar commit SHA e evidências de produção. Confirmar backup/restauração e contagem de clientes.
- Informar **lista de arquivos existentes que permanecerão intocados** e conflitos potenciais.
- **Critério de saída:** relatório técnico; nenhuma alteração feita.

### Etapa 1 — Estrutura isolada, sem ativar em produção

- Criar pasta `src/modules/team-management` e rotas **novas** não conflitantes.
- Criar telas com dados reais ou estado vazio (sem fingir usuários); flag desligada.
- Criar migrações **aditivas** para tabelas novas com RLS e rollback.
- Testes unitários de validação e autorização.
- **Critério de saída:** build passa; nenhum arquivo legado modificado; nenhuma tabela antiga alterada.

### Etapa 2 — Convites e ativação

- Conectar API segura de convite por e-mail e fluxo de definição de senha.
- Testar e-mail válido, convite expirado, duplicado, erro SMTP, e-mail inexistente, reenvio, sessão inválida, status pendente/ativo.
- Validar integração com login atual sem modificá-lo. Se precisar de alteração, interromper e solicitar autorização.
- **Critério de saída:** um usuário de teste ativa sua conta com segurança e sem segundo fator; admin vê status correto.

### Etapa 3 — Administração e auditoria

- Editar perfil/status, suspender/reativar, impedir último admin, consultar trilha de auditoria.
- Verificar políticas RLS e escopos administrativos de todas as novas rotas.
- **Critério de saída:** vendedor não acessa endpoints administrativos nem altera seu próprio cargo.

### Etapa 4 — Homologação e ativação gradual

- Ativar em Preview ou ambiente de homologação com dados de teste.
- Rodar regressão de rotas existentes e testes de permissões.
- Publicar com flag desligada; liberar flag apenas após aceite.
- Validar que a instância WhatsApp em produção segue conectada e que os clientes/kanbans estão intactos.
- **Critério de saída:** aceite formal, evidências, rollback preparado.

### Etapa 5 — Integrações FUTURAS (não executar agora)

- Relacionar vendedores às campanhas; atribuição de leads; instância WhatsApp por usuário; relatórios por equipe.
- Estas integrações pertencem aos PRDs das fases multicampanhas, distribuição e Evolution multi-instância.
- Não inferir autorização para alterar módulos existentes a partir deste PRD.

## 11. Critérios de aceite objetivos

- [ ] NaveProspect anterior à alteração continua funcional: login, dashboard, clientes, importações, Kanban, conversas, Evolution API e métricas.
- [ ] Nenhuma migration altera/renomeia/deleta `clients`, `interactions`, `audit_logs` ou outros objetos existentes.
- [ ] Nenhuma alteração de arquivo legado sem aprovação escrita; o relatório final contém diff real e justificativa.
- [ ] Admin autenticado convida vendedor por e-mail; nenhuma senha é fornecida pelo admin.
- [ ] Funcionário ativa pelo link e define sua senha; **sem MFA**.
- [ ] Perfil e situação ficam corretos após ativação e podem ser auditados.
- [ ] Não há cadastro público de funcionários.
- [ ] Vendedor/supervisor não tem acesso administrativo por manipulação de URL/API.
- [ ] Suspensão bloqueia imediatamente novos acessos ao módulo e suas APIs; limitação de alcance em rotas legadas documentada, se houver.
- [ ] Convite repetido, inválido e falha parcial não causam múltiplos perfis inconsistentes.
- [ ] Nenhuma credencial sensível aparece em client bundle, logs ou repositório.
- [ ] Build, lint e testes passam; testes de regressão registram evidências.
- [ ] Chamada sob demanda: o módulo não carrega telas ou operações administrativas na abertura do CRM normal.
- [ ] Feature flag desativa o novo módulo sem afetar funcionalidades existentes.
- [ ] O rollback mantém registros novos preservados, sem excluir usuários ou outros dados automaticamente.

## 12. Relatório obrigatório ao encerrar cada etapa

O Antigravity deve entregar:

```text
ETAPA: [nome]
STATUS: [APROVADO / BLOQUEADO / EM HOMOLOGAÇÃO]
COMMIT BASE:
COMMIT FINAL:
ARQUIVOS NOVOS:
ARQUIVOS EXISTENTES MODIFICADOS: [idealmente NENHUM]
MIGRAÇÕES NOVAS:
TABELAS EXISTENTES ALTERADAS: [NENHUMA]
ROTAS NOVAS:
TESTES EXECUTADOS E RESULTADOS:
EVIDÊNCIAS DE NÃO REGRESSÃO:
RISCOS E PENDÊNCIAS:
NECESSITA APROVAÇÃO PARA MEXER NO LEGADO? [SIM/NÃO]
PROCEDIMENTO DE ROLLBACK:
```

Não usar “100% funcional” sem evidência de execução no ambiente correspondente.

## 13. Prompt de execução inicial para colar no Antigravity

> Implemente **somente o PRD de Gestão de Usuários e Vendedores** no NaveProspect, obedecendo integralmente à REGRA ZERO. **Não toque no que já funciona. Não implemente MFA.** O módulo deve ser aditivo, isolado, carregado somente quando acessado, com nova rota de administração, convite por e-mail via Supabase Auth, ativação e autorização do próprio módulo. **Comece exclusivamente pela Etapa 0, de auditoria read-only.** Não execute implementação ou migrations antes de apresentar o diagnóstico, confirmar compatibilidade com a autenticação existente e receber minha autorização para a próxima etapa. Se qualquer integração exigir mudança em arquivo/rota/tabela antiga, PARE e apresente o menor diff necessário, impacto, testes e plano de reversão. Não invente estrutura de código, tabelas nem funcionalidades que não foram verificadas.

---

## 14. Referências técnicas

- Supabase Auth Admin — Convites: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- Supabase Auth — Usuários: https://supabase.com/docs/guides/auth/users
- Supabase — Gestão de dados de usuário e RLS: https://supabase.com/docs/guides/auth/managing-user-data
- Next.js — Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js — Server e Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components

**Fim do PRD v1.0**
