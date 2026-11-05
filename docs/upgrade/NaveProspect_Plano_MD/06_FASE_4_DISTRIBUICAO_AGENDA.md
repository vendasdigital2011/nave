# FASE 4 — Distribuição de leads, Meu Dia e agenda de retornos

**Depende de:** Fases 1–3.  
**Objetivo:** organizar o trabalho diário e evitar clientes esquecidos.

## Funcionalidades

**Atribuição de responsáveis**
- Manual por supervisor/admin.
- Automática em round-robin ou balanceamento por **quantidade de leads abertos**, configurável por campanha.
- Considerar apenas vendedores **ativos** e membros daquela campanha.
- Possibilidade de pausar recebimento durante ausência/folga.
- Transferência controlada, com motivo, origem/destino e log; histórico de contato não é apagado.
- Concorrência: dois supervisores não podem distribuir/assumir o mesmo lead simultaneamente sem regra transacional.

**Minha área (Meu Dia)**
- Cards operacionais de: leads atribuídos, respostas aguardando atendimento, retornos vencidos/hoje, negociações quentes.
- Lista priorizada por vencimento, última resposta e interesse; nunca pela ordem aleatória da planilha.
- Filtros por campanha e situação, preservando contexto escolhido.
- Ações rápidas: abrir lead, registrar observação, agendar retorno, transferir quando permitido, abrir conversa.

**Agenda e tarefas**
- Modelo proposto: `lead_tasks` com `id`, `campaign_lead_id`, `assigned_user_id`, `type`, `title`, `description`, `due_at`, `status`, `created_by`, `completed_at`, `created_at`.
- Fuso operacional `America/Bahia` para apresentação; timestamps armazenados em UTC.
- Uma tarefa concluída deixa histórico; não é apagada ao sair do Kanban.
- Avisos de retorno no CRM. Notificações push/e-mail somente em fase adicional, mediante decisão.
- Regras de SLA configuráveis por campanha, inicialmente **apenas alertas**, sem enviar mensagens automaticamente.

## Controles de negócio

- Lead pode ter **um responsável principal por campanha**, salvo modelo futuro de atendimento compartilhado.
- Gestor vê tarefas da equipe autorizada; vendedor vê somente suas próprias tarefas e leads autorizados.
- Se vendedor for suspenso, seus leads e tarefas devem ser sinalizados para redistribuição; jamais excluídos.
- Movimentações e transferências registradas com ator, data, estado anterior/novo e motivo.
- Lead de outra campanha não herda atribuição automaticamente.

## Não fazer

Não automatizar mensagens, não usar IA para alterar status, não criar disparos em massa e não redistribuir automaticamente os 125 registros legados sem regra aprovada.

## Testes e aceite

- [ ] Distribuição considera apenas membros ativos da campanha.
- [ ] Dois operadores concorrentes não sobrescrevem atribuições silenciosamente.
- [ ] Transferência mantém histórico e gera log.
- [ ] Meu Dia exibe apenas dados autorizados.
- [ ] Agendamentos respeitam fuso, vencimento e atualização.
- [ ] Suspensão de usuário não perde tarefas/leads.
- [ ] Nenhuma mensagem WhatsApp foi enviada por rotina de tarefas.

## Comando ao Antigravity

> Executar Fase 4: atribuição por campanha, transferências auditadas, agenda e Meu Dia. Inspecione modelo de `campaign_leads` vigente. Proteja concorrência e RBAC. Não implemente conexão WhatsApp, IA nem relatórios nesta fase.
