# FASE 5 — Evolution API com instância WhatsApp por usuário

**Depende de:** Fases 1–4.  
**Objetivo:** cada funcionário autorizado conectar seu WhatsApp e operar no CRM, preservando a instância existente.

## Escolha funcional assumida

**Padrão inicial:** uma instância individual Evolution API por usuário autorizado. Suporte a números/caixas compartilhadas **fica preparado no modelo, mas não é requisito de implementação agora**, pois a modalidade compartilhada/híbrida não foi decidida. Admin pode visualizar estados das instâncias; não acessar segredos brutos.

## Fluxos

1. Admin autoriza o usuário a conectar uma instância.
2. Usuário abre **Meu WhatsApp**, solicita criação/associação da instância e vê QR/code de pareamento retornado pela Evolution.
3. Backend verifica dono/escopo, cria/vincula instância de forma idempotente e persiste ID externo/estado.
4. UI acompanha `connecting`, `connected`, `disconnected`, `error` conforme capacidades **reais** da versão Evolution instalada.
5. Usuário envia mensagem **somente após clique explícito**, através de rota backend que confere campanha, lead, atribuição, instância e opt-out.
6. Admin pode administrar conexão/desconexão com autorização e registro de auditoria.

## Modelo sugerido

`whatsapp_instances`: `id`, `provider`, `provider_instance_name` (único), `owner_user_id` (opcional para caixa compartilhada futura), `display_phone_masked`, `status`, `connected_at`, `last_seen_at`, `created_at`, `updated_at`.  
Não persistir tokens de sessão ou credenciais no frontend; guardar chaves em secret manager/env server-side apropriado. Não expor telefone completo ao usuário sem necessidade.

## Compatibilidade

- A instância existente deve permanecer conectada. Antes de migrá-la, identificar nome externo, webhooks, recursos associados e responsável atual.
- Associar a instância existente a um usuário autorizado por migration/backfill **sem recriação** se o provedor permitir.
- A URL Evolution hospedada em VPS é legítima; não removê-la devido às guardas anti-VPS do Supabase.
- Inspecionar versão/API instalada e documentação real para confirmar rotas, payloads, QR, estados, recursos de webhook e múltiplas instâncias. Não inventar métodos ou nomes de eventos.
- Preservar API Routes existentes e refatorar gradualmente se necessário.

## Segurança, limites e compliance

- Chave Evolution apenas no servidor. Nenhuma chave exibida no console, UI ou logs.
- Rate limiting por usuário/instância e controle de volume; mensagens em massa somente após política própria.
- Diferenciar `sent`, `delivered`, `read`, `failed` apenas quando o provedor efetivamente informar o status.
- Tratar desconexão/reconexão sem apagar histórico.
- Validar consentimento/opt-out e respeitar política do WhatsApp. Baileys não transforma o sistema em canal oficial; documentar risco operacional e eventual migração para API oficial.
- Não reutilizar uma instância de outro usuário sem permissão.

## Testes de aceite

- [ ] Instância atual segue funcionando sem nova leitura de QR não autorizada.
- [ ] Dois usuários conectam instâncias diferentes; uma não interfere na outra.
- [ ] Usuário A não obtém QR, configuração ou envio pela instância B.
- [ ] Reconexão e estados são exibidos corretamente.
- [ ] Envio manual é auditado e falha de API é exibida sem marcar falso sucesso.
- [ ] Tokens e chaves não aparecem no bundle/navegador.
- [ ] Webhooks existentes continuam compatíveis.

## Comando ao Antigravity

> Execute apenas Fase 5. Descubra a versão e endpoints reais da Evolution antes de codificar. Preserve integralmente a instância em uso. Construa vínculo usuário↔instância, conexão QR e envio manual seguro, sem começar a Central completa de conversas (Fase 6).
