# FASE 0 — Diagnóstico, inventário e linha de base

**Dependência:** contrato global.  
**Modo:** somente leitura, exceto criação de relatório local sem segredos.  
**Objetivo:** descobrir a implementação REAL e fixar uma referência verificável antes das mudanças.

## Escopo

- Identificar branch/commit, projeto Vercel, alias de produção, versão efetiva de Next.js, React, Supabase, Evolution API, Recharts, dnd-kit e xlsx.
- Mapear árvore de rotas e componentes atuais: dashboard, Kanban, clientes, importação, WhatsApp, conversas, NPS, relatórios, configurações, autenticação.
- Identificar serviços de dados, endpoints existentes, webhooks e estados do WhatsApp, sem disparar mensagens de teste para clientes reais.
- Obter esquema real de `clients`, `interactions`, `audit_logs`, constraints, índices, triggers, RLS, policies e grants; localizar migrações versionadas.
- Validar a fonte de verdade da contagem de clientes por SQL e consulta de aplicação, usando projeto certo. Base relatada: 125; **não presumir o valor sem executar consulta segura**.
- Identificar backfills históricos, referências de status, `sold_at`, `wants_upgrade`, relatórios, filtros, ordenação alfabética e possíveis dados de fallback.
- Verificar existência de backups e capacidade de restaurar com segurança; testar restauração em ambiente isolado quando autorizado.
- Inventariar riscos: variáveis expostas, autenticação compartilhada, chamadas com service role, CORS, webhooks sem assinatura, logs contendo PII e acesso sem RLS efetivo.

## Passos obrigatórios

1. `git remote -v`, `git rev-parse HEAD`, `git status --short`, revisão do `package.json` e `next.config`.
2. `rg` nos arquivos relevantes por uso de `clients`, `interactions`, `audit_logs`, `createClient`, `createServiceClient`, endpoints de WhatsApp e manipulação de `localStorage`.
3. Inspecionar migrações SQL existentes e comparar com metadados reais do Supabase (somente leitura).
4. Conferir Vercel Project → Production Deployment → Git SHA → Environment Variables (apenas nomes e presença; **nunca mostrar valores secretos**).
5. Verificar a URL efetiva de produção (`https://nave-zeta.vercel.app`) e chunks carregados para não confundir deploy antigo com o atual.
6. Mapear o fluxo completo de um cliente: importação → listagem → Kanban → interação → NPS → relatório.
7. Mapear o fluxo WhatsApp: usuário → rota Next.js → Evolution → retorno/webhook → persistência → atualização de tela.
8. Montar matriz de riscos de migração e plano de rollout por feature flags, se houver suporte.

## Entregável de diagnóstico

Produzir `docs/roadmap/BASELINE_VERIFICADA.md` no repositório, se isso for autorizado, com:

- `CURRENT_GIT_SHA`, domínio auditado, ambiente, versões, contagem SQL e tela, tudo com evidência (sem segredos).
- Inventário de tabelas e colunas **reais**; migrações já aplicadas.
- Arquivos e rotas reais que serão alterados por cada fase.
- Lista `[CONFIRMADO]`, `[DIVERGENTE]`, `[A_VALIDAR]`.
- Riscos impeditivos e medidas de mitigação.
- Estratégia de migração/backfill dos 125 clientes relatados, sem alterar dados nessa fase.
- Plano para rotacionar chaves expostas, com execução posterior coordenada para evitar indisponibilidade.

## Fora de escopo

Não criar tabela, corrigir código, trocar domínio, reimportar planilha, mudar política RLS, migrar instância WhatsApp ou executar deploy.

## Critérios de aceite

- [ ] Contagem real de clientes e origem das consultas comprovadas.
- [ ] Esquema e políticas existentes inventariados.
- [ ] Domínio/commit de produção validados.
- [ ] Fluxo Evolution e webhooks mapeados.
- [ ] Riscos, backups, estratégia de migração e dependências documentados.
- [ ] Nenhuma alteração funcional em produção.

## Comando ao Antigravity

> Execute SOMENTE a Fase 0, respeitando `01_CONTRATO_GLOBAL_ANTIALUCINACAO.md`. Não escreva código de feature. Entregue diagnóstico com evidências, inventário real e plano de risco. Não exiba chaves, tokens ou senhas.
