# Adendo obrigatório — Origem, tipo de contato e formulários dinâmicos por campanha

**Aplicação:** Fases 0 (inventário), 2 (campanhas), 3 (importação), 6 (atendimento), 7 (relatórios) e 8 (design).  
**Motivação:** os campos da campanha Upgrade 50 → 100 Mega **não** servem para leads novos de Hotspot, grupos de WhatsApp, indicações ou outras origens.  
**Status:** contrato de produto proposto, **não** afirmação sobre o schema existente. Implantar só após análise real e migração aditiva.

## 1. Separar conceitos — sem ambiguidade

1. **Contato/pessoa**: registro global identificado por UUID; pode existir em várias campanhas. O nome da tabela legada `clients` não significa que todo registro seja assinante.
2. **Vínculo com a empresa**: `cliente_confirmado`, `prospect` ou `desconhecido`. Não presumir vínculo contratual apenas porque o telefone está em uma base ou porque converteu no Kanban. Quando houver CRM oficial de assinantes, conferir vínculo por ID/contrato confiável; até lá, admitir `desconhecido`.
3. **Campanha**: iniciativa comercial (`upgrade`, `prospeccao`, `retencao`, etc.); determina funil e campos de trabalho, mas não é a fonte de verdade sobre o vínculo contratual.
4. **Origem**: de onde o lead foi captado (base interna Navetech, hotspot, grupo WhatsApp, formulário, indicação, condomínio, campanha de evento, etc.). Origem não equivale a autorização para enviar marketing.
5. **Lote de importação**: execução de upload identificada, com campanha, origem, data, responsável e resultados. A mesma campanha pode receber diversos lotes e origens.
6. **Oportunidade/campaign_lead**: progressão no Kanban, responsável e resultados **daquela campanha**. Não colocar o status do funil no contato global.

## 2. Fluxo de criação/importação

```text
Campanhas → Selecionar campanha → Importar leads
           ↓
Identificar tipo da campanha: Upgrade | Prospecção | Outro
           ↓
Selecionar origem do lote: Hotspot | Grupo WhatsApp | Base interna | Outra
           ↓
Informar procedência detalhada (ex.: identificação do hotspot/grupo, semana, data)
           ↓
Upload .xlsx/.csv → mapear cabeçalhos por TEMPLATE → pré-visualizar registros
           ↓
Validar: identidade, campos obrigatórios, números, repetidos, consentimento/opt-out
           ↓
Simular resultado: novos contatos, existentes reaproveitados, novos vínculos,
reaparecimentos em lote, rejeitados, pessoas com vínculo desconhecido
           ↓
Confirmar → gravar atomicamente por lote → auditoria → Kanban da campanha
```

**Não criar um seletor que marque automaticamente todos os leads importados como clientes ativos.** Ao escolher a campanha, o importador adapta as colunas e a ficha. Permitir troca de origem por linha quando um arquivo tiver fontes mistas, mantendo valor-padrão do lote.

## 3. Templates e campos por tipo

| Campo | Upgrade de cliente existente | Prospecção Hotspot/grupos |
|---|---|---|
| Nome e telefone | Necessários conforme capacidade de validação | Necessários conforme capacidade de validação |
| ID do assinante/contrato | Prioritário quando disponível | Oculto/não exigido |
| Plano atual / plano destino | Exibir e mapear | **Não exibir nem preencher automaticamente** |
| Campanha, origem, lote, data de captação | Registrar | Registrar |
| Condomínio, bairro, região | Se presentes | Opcionais, conforme origem |
| Interesse, objeção, próximo retorno | Aplicáveis | Aplicáveis |
| Vendedor, Kanban, histórico de contato | Aplicáveis | Aplicáveis |
| NPS de assinante / motivo de upgrade | Específicos quando cabíveis | Ocultos até haver contexto legítimo de pós-venda |
| Consentimento/base legal, opt-out, restrição de contato | Registrar/observar | **Obrigatório verificar antes de abordar** |
| Contratação/instalação confirmada | Upgrade concluído conforme processo oficial | Nova contratação somente após confirmação em fonte confiável |

### Exemplo de planilha Upgrade

```csv
nome;telefone;id_assinante;condominio;plano_atual;plano_destino
Maria Silva;77999999999;12345;Condomínio A;50 Mega;100 Mega
```

### Exemplo de planilha Hotspot

```csv
nome;telefone;hotspot;data_captacao;bairro;consentimento
João Souza;77988888888;Praça Central;2026-11-04;Centro;pendente_verificacao
```

### Exemplo de planilha de origem Grupo WhatsApp

```csv
nome;telefone;grupo_origem;data_captacao;permissao_contato
Ana Santos;77977777777;Grupo Exemplo;2026-11-04;nao_comprovada
```

**Importante:** estar em um grupo de WhatsApp não é consentimento para prospecção. O importador pode registrar procedência e restringir abordagem até verificar base legal, permissões e preferências; não implementar scraping nem envios em massa não autorizados.

## 4. Ficha dinâmica do lead e rotulagem

**Bloco fixo a toda campanha:** Nome, telefone, origem, lote, campanha, status/etapa, responsável, histórico de atendimento, observações, tarefas, próxima ação e sinalização de restrição de contato.

**Bloco da campanha Upgrade:** Cliente/contrato confirmado, plano atual, plano alvo, vantagens do upgrade, data/resultado, satisfação quando aplicável, motivo de recusa. Se status contratual não foi verificado, mostrar `Vínculo com a Navetech: a confirmar`.

**Bloco da campanha Prospecção:** Interessado em qual serviço, bairro/cobertura a verificar, objeção, proposta, agendamento, situação da instalação e resultado. **Não exibir `50M → 100M`, `wants_upgrade` ou rótulo `Cliente` como padrão.** Usar `Lead`, `Contato` ou `Prospect` até confirmação.

Botões contextuais: `Novo lead`/`Novo contato` nas campanhas de prospecção; `Adicionar cliente ao upgrade` somente onde fizer sentido. A mesma ficha global pode ter abas com oportunidades por campanha sem compartilhar etapas ou observações comerciais indevidamente.

## 5. Modelo de dados aditivo a validar

- Reaproveitar `clients` como cadastro legado sem renomear/excluir prematuramente.
- Propor tabela de fontes `lead_sources` (`id`, `name`, `source_type`, `description`, `active`) e campo `source_id`/`source_detail` no vínculo de campanha ou evento de captação. Fonte padrão do lote mais substituição por linha.
- `import_batches`: acrescentar `default_source_id`, `source_details`, `captured_period`, `consent_review_status` se necessário.
- `import_batch_rows`/ocorrências: rastrear `raw_source`, `normalized_source`, resultado e histórico sem expor PII desnecessária.
- `campaign_leads`: guardar campanha, etapa, atribuição, data de ingresso, `source_id` e **o primeiro vínculo**. Reaparições exigem tabela/evento separado para não perder múltiplas origens.
- Avaliar um atributo de vínculo contratual (`customer_relationship_status`) com valor `cliente_confirmado | prospect | desconhecido`, associado a evidência de verificação. **Não inferir automaticamente a partir de planilha Hotspot/grupo**.
- Dados de upgrade como `current_plan`, `target_plan`, `wants_upgrade` e `sold_at` permanecem preservados no legado; a lógica de campanhas novas **não deve escrever nesses campos**. Campos específicos futuros podem viver em `campaign_lead_attributes`/JSON tipado validado ou tabelas específicas conforme auditoria.
- Priorizar integridade referencial, índices de consulta, RLS por campanha e migrações reversíveis. Nenhuma alteração destrutiva.

## 6. Regras críticas do importador

- **Separar pessoa e campanha:** se telefone existir em outro projeto/campanha, reaproveitar contato somente com evidência de identidade suficiente; criar vínculo da campanha sem alterar cadastro confirmado indevidamente.
- **Não apagar andamento:** reimportação nunca reseta Kanban, responsável, proposta, notas, NPS, conversas ou opt-out.
- **Não inventar dados:** campos não existentes na planilha ficam nulos/pendentes, jamais converter `null` em plano `50 Mega`, `cliente ativo`, ou consentimento `sim`.
- **Diferenciar contagem:** total de contatos globais, oportunidades por campanha, novos vínculos, novos lotes e reaparições são KPIs diferentes.
- **Origem múltipla:** registrar origem original e novos eventos de captação, sem sobrescrever origem histórica em importações posteriores.
- **Fluxo de revisão:** linhas sem dados suficientes ficam em revisão/rejeição justificada; não avançam automaticamente para envio de WhatsApp.
- **Segurança:** controle de autorização no servidor, logs sem segredos, limites de upload, idempotência, exportação segura e política LGPD/opt-out.

## 7. Critérios de aceite obrigatórios

- [ ] Campanha Upgrade preserva os 125 registros legados e campos específicos de plano, sem perda de histórico.
- [ ] Campanha Hotspot importa sem exigir plano atual/destino, contrato ou NPS.
- [ ] Leads de Grupo WhatsApp podem ser armazenados com origem e permissão não comprovada, **sem** serem considerados opt-in.
- [ ] Ficha de Hotspot não mostra rótulo `Cliente` nem selo `50M → 100M` por padrão.
- [ ] Contato em duas campanhas possui dois Kanbans independentes e origem/lotes rastreáveis.
- [ ] Segunda importação semanal preserva status, responsável e notas da primeira.
- [ ] Relatórios distinguem **origem** da **campanha** e permitem comparar desempenho sem somar upgrades como novos assinantes.
- [ ] Todas as regras foram verificadas com testes de importação, RBAC/RLS e auditoria.

## Comando ao Antigravity

> Aplicar este adendo **somente nas Fases 2/3/6/7/8 pertinentes**, após a Fase 0 e sem criar tabela/coluna presumida. Diferenciar contato global, vínculo contratual, campanha, origem e lote. Revisar rótulos e campos dinâmicos da ficha de lead e mapear planilhas por tipo de campanha. Preservar todos os registros legados e impedir que importações de prospecção atribuam planos, upgrade ou cliente confirmado. Gerar diff, migrations versionadas, testes, evidências e rollback; não implantar tudo de uma vez.
