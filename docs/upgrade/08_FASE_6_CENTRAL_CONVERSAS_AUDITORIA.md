# FASE 6 — Central de conversas, respostas recebidas e auditoria integral

**Depende de:** Fases 1–5.  
**Objetivo:** toda conversa de WhatsApp operada pelo CRM ficar visível, pesquisável, atribuída e auditável.

## Experiência principal

Interface estilo mensageiro profissional com três áreas: **caixa de entrada**, **conversa selecionada** e **painel do lead/campanha**.

- Caixa de entrada: `Não lidas`, `Aguardando cliente`, `Aguardando vendedor`, `Pendentes`, `Encerradas`; filtro por campanha, instância, atendente e período.
- Conversa: mensagens em ordem estável, horário, remetente, mídia suportada, estado de envio e ação manual **Enviar**.
- Painel do lead: nome, telefone mascarado quando adequado, campanha ativa, etapa no Kanban, vendedor responsável, classificação da resposta, objeção, observações e retorno programado.
- Toda mensagem recebida deve entrar na caixa e criar alerta/contador para o responsável.
- Quando uma mensagem chega sem campanha inequívoca, ir para a **caixa de triagem**, sem atribuir automaticamente ao Kanban errado.
- É permitido inserir resposta/observação manual e classificação comercial; **não alterar o conteúdo bruto original recebido**.

## Pipeline técnico obrigatório

1. Evolution → webhook em rota backend com autenticação/validação permitida pela versão instalada.
2. Verificação do evento, payload mínimo, instância e ID externo da mensagem.
3. Persistência durável antes de confirmar processamento quando a infraestrutura permitir; deduplicação por `provider + instance_id + message_external_id`/identificador de evento apropriado.
4. Processamento idempotente e atualização do estado da mensagem; retry e tratamento de eventos fora de ordem.
5. Roteamento por instância, telefone normalizado, lead/campanha e responsável.
6. Notificação realtime privada para usuários autorizados; contagem de não lidas baseada no estado do atendimento/usuário.
7. Envio manual via backend → Evolution → atualização de estado sem registrar sucesso antecipado.

## Dados propostos (ver modelo de referência)

- `conversations`: `id`, `instance_id`, `contact_client_id` opcional, `campaign_lead_id` opcional, `assigned_user_id`, `status`, `last_message_at`, `created_at`.
- `messages`: `id`, `conversation_id`, `provider_message_id`, `direction` (`inbound`/`outbound`), `sender_ref`, `body`, `content_type`, `provider_timestamp`, `received_at`, `delivery_status`, `created_by_user_id` (para outbound), `metadata` sanitizada.
- `conversation_events`: `conversation_id`, `actor_user_id`, `event_type`, `before`, `after`, `occurred_at`; append-only.
- `conversation_notes`: classificação comercial, objeção, notas, próximo contato, autoria e data, sem sobrescrever mensagem.
- `webhook_events` ou fila durável: `provider_event_id`, hash/payload mínimo sanitizado, `processed_at`, `status`, retries.

## Regras de auditoria

- Registrar envio, recebimento, atribuição, transferência, encerramento, reabertura, mudança de etapa e observação comercial.
- Mensagens enviadas pelo CRM devem indicar o operador; recebidas indicam cliente/provedor, com origem e horários.
- Exportação de conversas restrita por perfil, propósito e período; nunca exportar chaves ou tokens.
- Auditoria somente append, acesso administrativo controlado; não disponibilizar edição/apagamento para vendedores.
- Guardar status de leitura do operador separado de status `read` do WhatsApp (são coisas diferentes).
- Definir retenção e política de dados conforme LGPD, sem declarar armazenamento infinito por padrão.

## Atenção a casos difíceis

- Contato participa de múltiplas campanhas: não inferir campanha usando apenas telefone. Usar origem da interação ou triagem explícita.
- Duas instâncias conversam com o mesmo número: identificar pelo par **instância + contato**, não só telefone.
- Mensagem chega fora de ordem ou repetida: reprocessar sem duplicar.
- Instância desconecta: manter conversa existente, mostrar erro/estado e retomar sem perder eventos.
- Lead muda de vendedor: preservar autoria histórica e atualizar roteamento autorizado.
- Mídia: começar com texto e expandir somente conforme APIs reais, segurança de links/arquivos e política de retenção.

## Não fazer nesta fase

Nenhum bot, envio automático, sugestão IA, disparos em massa ou redesign completo do dashboard.

## Critérios de aceite

- [ ] Mensagem de entrada aparece no CRM sem recarregar quando realtime estiver disponível.
- [ ] Vendedor responde manualmente; mensagem é vinculada ao usuário/instância corretos.
- [ ] Duplicação/retry do webhook não cria mensagem duplicada.
- [ ] Mensagem sem campanha clara vai à triagem, não ao lead errado.
- [ ] Supervisor autorizado audita conversa, eventos e mudanças de atendente.
- [ ] Usuário não autorizado não lê conversa por URL/API/Reatime.
- [ ] Nenhum conteúdo original é alterável pelo vendedor.
- [ ] Histórico da instância atual é mantido, com limites explícitos de sincronização retroativa.

## Comando ao Antigravity

> Execute Fase 6: central de conversas integrada à Evolution, pipeline de webhook idempotente, auditoria append-only e triagem de mensagens ambíguas. Preserve chats atuais. Não envie mensagens automaticamente. Inspecione os eventos reais da versão instalada antes de implementar.
