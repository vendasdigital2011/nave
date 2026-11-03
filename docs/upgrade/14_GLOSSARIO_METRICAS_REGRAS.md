# Glossário operacional e contratos de métricas

Este arquivo evita que telas diferentes atribuam significados distintos às mesmas palavras. **Definições propostas**: validar com o gestor antes de congelar o contrato de relatórios.

## Conceitos

| Termo | Definição proposta |
|---|---|
| Contato/cliente (`clients`) | Pessoa/telefone no cadastro global, independentemente das campanhas |
| Lead da campanha (`campaign_leads`) | Participação de um contato em uma campanha específica |
| Lead novo no lote | Campanha não possuía vínculo para aquela pessoa antes da importação |
| Duplicado no lote | Linha que repete identidade já presente na mesma planilha/lote |
| Reaparecimento em lote | Lead da campanha já existia, mas surgiu novamente em importação posterior |
| Lead atribuído | Possui responsável ativo naquela campanha |
| Lead contatado | Pelo menos uma tentativa de contato registrada conforme canal/status definidos |
| Lead respondente | Possui ao menos uma mensagem/resposta inbound válida ligada à oportunidade |
| Lead convertido | Atingiu etapa de `stage_kind = won`, com data de conversão daquela campanha |
| Lead perdido | Atingiu etapa `lost`, com motivo quando informado |
| Conversa pendente | Existe mensagem recebida sem resposta posterior apropriada do atendente, segundo regra de fila |
| Não lida | Ainda não foi visualizada pelo operador no CRM; não confundir com WhatsApp read receipt |
| Lote | Uma execução identificável de importação com arquivo, data, usuário, campanha e totais |
| Atendimento | Conversa atribuída a uma instância e contraparte, com contexto de campanha se conhecido |

## Fórmulas

**Taxa de contato (%)** = 100 × `leads contatados` / `leads elegíveis no período`.  
**Taxa de resposta (%)** = 100 × `leads com resposta inbound` / `leads contatados`.  
**Taxa de conversão (%)** = 100 × `leads convertidos` / `leads elegíveis no período`.

A definição de *elegível no período* precisa ser configurada e indicada em tela: coorte de importação, leads atribuídos ou total da campanha. **Não trocar denominador silenciosamente entre filtros.** Exibir `—` se denominador for zero.

**NPS** = `% promotores (9–10)` − `% detratores (0–6)`, com denominador igual à quantidade de **respostas válidas** de 0 a 10; notas 7–8 são neutras. Mostrar amostra `n` e taxa de participação; vazio não é nota zero.

**Tempo de primeira resposta humana** = horário da primeira resposta outbound do atendente após o primeiro inbound elegível na conversa − horário do inbound. Excluir mensagens automáticas e definir claramente horário comercial vs tempo corrido.  
**SLA de resposta** = percentual das conversas elegíveis respondidas dentro de limite configurado; não calcular sem limite explícito.

**Conversões do Upgrade** e **conversões do Hotspot** representam eventos comerciais distintos. Nunca somar como “novos assinantes” sem identificação do objetivo e deduplicação de resultado quando necessário.

## Regra de status de funil

Cada campanha pode ter nomes diferentes de etapas, mas cada etapa deve carregar um tipo estável: `open`, `won`, `lost`. Isso facilita consolidação sem obrigar todos os Kanbans a usar as mesmas colunas.

- Upgrade: Importados → Frio → Morno → Quente → Vendido (`won`) / Desativado (`lost`, se corresponder a desistência; validar significado legado).
- Hotspot (modelo inicial editável): Novos → Em contato → Interessados → Agendados → Convertidos (`won`) / Perdidos (`lost`).

Não mapear automaticamente `desativado` como recusa definitiva sem inspeção: o legado pode incluir telefone inválido ou opt-out.

## Campanhas e autores

- Membro de campanha: usuário autorizado a operar aquela campanha.
- Responsável pelo lead: usuário que responde pela oportunidade; diferente de operador que enviou uma mensagem específica.
- Responsável pela conversa: usuário associado ao atendimento daquela instância; pode mudar por transferência.
- Auditoria precisa identificar autor REAL e preservar o autor histórico quando houver transferência.

## Situações de privacidade e consentimento

- `opt_out`: cliente pediu para não receber contatos. Deve ser respeitado na campanha e, conforme sua manifestação e política de consentimento, possivelmente em todas as campanhas/canais.
- Interações inbound não significam consentimento irrestrito para campanhas futuras.
- Campos pessoais exigem acesso mínimo, política de retenção e base legal apropriada.

## Checklist para congelar métricas (antes da Fase 7)

- [ ] Definição de contato/tentativa/resposta aprovada.
- [ ] Denominador de conversão por campanha e período aprovado.
- [ ] Tratamento de importações repetidas aprovado.
- [ ] Mapeamento de estados `won/lost` aprovado.
- [ ] Fuso e calendário operacional aprovados.
- [ ] Tratamento de respostas WhatsApp fora de campanha aprovado.
- [ ] Origem, cobertura e cálculo de NPS aprovados.
