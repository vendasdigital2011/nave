# FASE 3 — Importação Excel por campanha e por lote

**Depende de:** Fase 2.  
**Objetivo:** importar planilhas diferentes para campanhas diferentes; permitir entradas semanais recorrentes sem perder o histórico.

## Experiência de uso

1. Administrador/supervisor autorizado escolhe campanha (`Leads Hotspot`, por exemplo).
2. Faz upload do `.xlsx`/`.csv` permitido. Sistema apresenta **prévia**, detecta cabeçalhos e oferece mapeamento de colunas.
3. Exibe resumo ANTES de gravar: total lido, válidos, inválidos, contatos já cadastrados, duplicados na campanha e novos vínculos.
4. Confirma importação e acompanha execução/lote com status `pending` → `processing` → `completed`/`partial`/`failed`.
5. Consulta histórico semanal, responsável, data, rejeições e arquivo original se a política de retenção permitir.
6. Exporta erros para correção sem revelar contatos de campanhas não autorizadas.

## Modelo proposto

- `import_batches`: `id`, `campaign_id`, `uploaded_by`, `file_name`, `file_hash`, `status`, `total_rows`, `valid_rows`, `inserted_clients`, `linked_leads`, `duplicates`, `rejected_rows`, `started_at`, `completed_at`, `error_summary`.
- `import_batch_rows` (opcional, se necessário para auditoria/retentativa): `batch_id`, `row_number`, `normalized_phone`, `result`, `error_code`, `client_id`, `campaign_lead_id`; limitar PII.
- `campaign_leads.first_import_batch_id` (ou tabela associativa de histórico de lotes) para rastrear origem. Se o mesmo lead reaparecer em lotes sucessivos, **não sobrescrever o primeiro lote**; registrar nova ocorrência separadamente.

## Regras obrigatórias

- Normalizar nomes, espaçamentos, telefones, DDI/DDD sem transformar números inválidos em válidos; aceitar especificações brasileiras e indicar números incompletos.
- Deduplicar **dentro do mesmo arquivo** e **dentro da campanha**; quando contato já estiver no cadastro central, reutilizar `clients.id` sempre que a identidade for suficientemente confiável.
- Reimportar o mesmo lote deve ser idempotente; verificar `file_hash` e chave de importação (não depender apenas do nome do arquivo).
- Telefone em outras campanhas **não impede** ingresso na nova campanha.
- Nunca zerar status, observações, mensagens, `assigned_user_id`, `nps_score` ou histórico de lead existente ao reimportar.
- Associar lote ao usuário que importou; auditoria de inserções, duplicatas e rejeições.
- Validar tamanho do arquivo, extensão, MIME quando possível e limites por lote; não confiar em Excel como fonte de scripts/HTML executáveis.
- Processar arquivos maiores em tarefas paginadas/reiniciáveis, não em requisição longa que pode estourar limite da Vercel.
- Evitar acesso do navegador à chave privada do Supabase; checagem de autorização no servidor.

## Testes mínimos

| Cenário | Resultado |
|---|---|
| Primeira importação Hotspot | Cria contatos/vínculos corretos |
| Segunda planilha semanal | Soma leads novos sem apagar antigos |
| Mesmo arquivo enviado duas vezes | Não duplica leads nem lotes de maneira enganosa |
| Mesmo telefone em duas campanhas | Um contato, duas oportunidades independentes |
| Telefone inválido ou linha vazia | Rejeição visível por linha |
| Reimportação de cliente em negociação | Mantém etapa e responsável |
| Upload sem permissão | 403/negação no backend |
| Erro parcial/retry | Reinício seguro sem duplicações |

## Fora de escopo

Distribuição automática e scoring IA. Esta fase só insere/importa e registra procedência.

## Critérios de aceite

- [ ] Hotspot recebe duas ou mais importações sucessivas.
- [ ] Lotes exibem totais consistentes e erros.
- [ ] Dados antigos do Upgrade preservados.
- [ ] Nenhuma reimportação reduz a quantidade de registros ou reseta negociações.
- [ ] Exportação de falhas controlada por permissão.
- [ ] Testes e limite de upload documentados.

## Comando ao Antigravity

> Executar Fase 3: importador por campanha com lotes idempotentes, preview, normalização e relatório de linhas rejeitadas. Verifique o importador existente antes de reaproveitar. Não modifique distribuição, WhatsApp nem IA. Preserve histórico e associação entre campanhas.
