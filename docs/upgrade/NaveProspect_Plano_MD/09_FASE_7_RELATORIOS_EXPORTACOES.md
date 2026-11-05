# FASE 7 — Dashboards gerenciais, relatórios e exportações

**Depende de:** Fases 2–6.  
**Objetivo:** medir operação e resultados com dados verdadeiros, filtros consistentes e relatórios reproduzíveis.

## Telas

1. **Visão executiva:** resumo de campanhas, volume de leads, progresso, conversões, pendências e WhatsApp.
2. **Relatório por campanha:** entradas por lote, funil, atendimentos, objeções, perdas e evolução semanal.
3. **Relatório por vendedor:** leads atribuídos, contatos, respostas, pendências, tarefas e conversões.
4. **Qualidade de atendimento:** tempo de primeira resposta, conversas aguardando, transferências, recorrência de objeções.
5. **NPS:** promotores 9–10, neutros 7–8, detratores 0–6, com filtro e amostra; separar sem resposta de nota zero.
6. **Exportações:** Excel detalhado (campos autorizados) e PDF executivo com filtros, período, data de emissão e definições das métricas.

## Filtros compartilhados

Campanha, período, vendedor, supervisor, status/etapa, lote de importação, condomínio/origem e instância quando pertinente. Persistir contexto de filtros sem vazar dados de campanhas não autorizadas.

## Métricas mínimas (definições em `14_GLOSSARIO_METRICAS_REGRAS.md`)

- Leads únicos por campanha, entradas por lote, leads atribuídos, contatos iniciados, leads com resposta, taxa de resposta.
- Conversões por campanha e vendedor, conversão percentual com denominador explícito.
- Atendimentos abertos, pendentes, sem responsável, prazo vencido e tempo de primeira resposta.
- Taxas de perda e motivos informados por humanos.
- NPS com contagem respondente, taxa de participação e cálculo correto.
- Relatório de auditoria de atividades por usuário e período (somente quem tem permissão).

## Integridade e performance

- Métricas consultadas do Supabase **não** calculadas apenas a partir dos cards atualmente carregados no navegador.
- Usar agregação server-side/SQL ou views/RPC com RLS/controle de escopo. Evitar varrer todas as mensagens em cada renderização.
- Evitar `count` enganoso em joins 1:N: usar `DISTINCT campaign_lead_id` ou agregação adequada.
- Definir timezone `America/Bahia` para limites de dias/semanas na interface e armazenar UTC.
- Não misturar conversão de upgrade com conversão de nova assinatura Hotspot sem rotular objetivos.
- Filtros/exportações devem devolver os **mesmos totais** que a tela (respeitando arredondamento e eventuais amostras).
- Mostrar `—` ou “sem dados” para indicadores sem evidência; nunca usar dados simulados em produção sem rótulo inequívoco.
- Testar performance com volume projetado de importações semanais e múltiplos atendentes.

## Segurança

- Exportar dados pessoais somente sob permissão e com auditoria (quem, quando, qual filtro, volume).
- Evitar exportar corpo integral de conversas sem uma ação explícita de exportação autorizada.
- Aplicar controles idênticos para tela e endpoint do relatório; supervisor não vê campanha não autorizada.
- Limitar consultas por período/paginação e processamento de relatórios grandes por job controlado.

## Critérios de aceite

- [ ] Admin vê dados consolidados; supervisor/vendedor veem somente seu escopo.
- [ ] Filtrar Hotspot não retorna registros do Upgrade.
- [ ] Totais conciliam com consultas de referência e exportações.
- [ ] NPS calcula promotores−detratores sobre **respondentes**.
- [ ] Duplicidade de mensagens e lotes não infla métricas.
- [ ] PDFs e Excel indicam período e filtros usados.
- [ ] Indicadores sem dados não recebem números fictícios.

## Comando ao Antigravity

> Execute Fase 7. Antes de criar gráficos, consolide o contrato de métricas de `14_GLOSSARIO_METRICAS_REGRAS.md` e valide as contagens SQL. Implemente filtros e exportações com RBAC. Não altere o funil nem invente números. Não redesenhe toda a interface: isso é Fase 8.
