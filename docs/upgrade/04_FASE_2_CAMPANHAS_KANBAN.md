# FASE 2 — Multicampanhas e Kanbans independentes

**Depende de:** Fases 0 e 1.  
**Objetivo:** uma única aplicação Supabase com campanhas separadas, funis próprios e dados comerciais isolados.

## Cenários que devem funcionar

- **Campanha A (legado):** Upgrade 50 → 100 Mega, com os clientes/estados atuais preservados.
- **Campanha B (nova):** Leads Hotspot, recebendo novas planilhas a cada semana.
- Criar, editar, pausar, arquivar campanhas e abrir o Kanban de cada uma.
- Mesmo contato pode participar de duas campanhas sem duplicar pessoa nem misturar negociações.
- Permissões por campanha: admin tudo; supervisor/vendedor apenas campanhas em que têm autorização.

## Entidades propostas (somente após inspeção)

- `campaigns`: `id`, `name`, `type`, `description`, `status`, `created_by`, `created_at`, `updated_at`, opcionais `start_at`/`end_at`.
- `campaign_stages`: `id`, `campaign_id`, `name`, `position`, `stage_kind` (`open`, `won`, `lost`), `is_active`.
- `campaign_members`: `campaign_id`, `user_id`, `role` ou escopo, `joined_at`.
- `campaign_leads`: `id`, `campaign_id`, `client_id`, `stage_id`, `assigned_user_id`, `joined_at`, `last_activity_at`, `converted_at`, `lost_at`, `version`.
- Unique sugerida: `(campaign_id, client_id)`. **Não** tornar telefone único global se isso impedir histórico/identidades legítimas; ver modelo de dados.

## Estratégia especial para o legado

1. Tirar snapshot verificável dos registros atuais antes da migração.
2. Criar `campaigns` e registrar a campanha `Upgrade 50 → 100 Mega` com identificador estável.
3. Criar as etapas correspondentes aos estados legados `importados`, `frio`, `morno`, `quente`, `vendido`, `desativado`.
4. Efetuar **backfill idempotente** dos clientes existentes para `campaign_leads`, preservando `clients.id`, `clients.status`, `sold_at`, NPS, comentários, auditoria e interações.
5. A nova verdade do funil será `campaign_leads.stage_id`, **não** `clients.status` global. Na fase de transição, planejar leitura/compatibilidade com recursos legados sem sobrescrever os dados antigos.
6. O trigger antigo que altera `clients.sold_at`/`wants_upgrade` quando vendido não deve definir a conversão de **outras campanhas**. Preservar a regra do upgrade legado quando necessária, e armazenar resultado de cada campanha no vínculo.
7. Validar contagens e amostras por `client_id` antes/depois. Não criar leads duplicados ao repetir backfill.

## Interface e rotas

- Página **Campanhas**, com nome, tipo, situação, total de leads, responsáveis e última atividade.
- Criar campanha com nome, objetivo, origem, tipo e definição de etapas; oferecer template de funil sem impor às demais campanhas.
- Ao abrir campanha: tabs `Visão geral`, `Kanban`, `Leads`, `Importações` (fase seguinte), `Relatórios` (fase posterior).
- Filtros e ações sempre recebem `campaign_id` **validado no servidor**.
- Mudanças de coluna com drag-and-drop: validar etapa pertence à campanha; transação atômica e auditoria.
- Se uma pessoa constar em duas campanhas, listar contextos claramente, sem misturar status ou notas comerciais.

## Não implementar nesta fase

Importação de Excel por lote, distribuição automática, inteligência artificial, chat multi-instância, relatórios avançados ou redesign total.

## Critérios de aceite

- [ ] Campanha Upgrade mantém todos os registros e estados após migração.
- [ ] Nova campanha Hotspot pode ser criada, sem afetar Upgrade.
- [ ] Mover lead em um Kanban não move o mesmo contato em outro Kanban.
- [ ] Usuário sem acesso não lê/edita campanha por URL/API direta.
- [ ] Backfill pode ser reexecutado sem duplicar registros.
- [ ] Triggers existentes não convertem campanhas incorretamente.
- [ ] Total antigo de clientes permanece igual ao baseline verificado.

## Comando ao Antigravity

> Executar Fase 2 com migração ADITIVA, campanha legada de upgrade, `campaign_leads` e Kanbans por campanha. Não tocar em importação nem Evolution. Mostre queries de validação de contagens e testes de isolamento entre campanhas. Se o esquema real divergir, proponha ajuste antes de editar.
