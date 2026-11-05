# NaveProspect — Plano modular de evolução

**Versão do planejamento:** 1.1 — 04/11/2026  
**Objetivo:** evoluir o CRM existente, em produção, para multicampanhas, multiusuários, múltiplas instâncias WhatsApp, central de conversas, relatórios e copiloto de IA, sem reescrever o aplicativo.

## Como usar este pacote no Antigravity

1. Entregue primeiro `01_CONTRATO_GLOBAL_ANTIALUCINACAO.md` ao agente e peça que o leia e o respeite em todas as etapas.
2. Execute `02_FASE_0_DIAGNOSTICO_BASELINE.md` **sem modificar o código**. Só avance após registrar as evidências atuais e ter backup verificável.
3. Execute **uma fase por vez**, na sequência numérica. Em cada nova conversa, envie o contrato global, o relatório de conclusão da fase anterior e **somente o MD da fase atual**.
4. Se a fase encontrar divergência entre o documento e a implementação real, **pare, registre a divergência e apresente uma alteração de plano**; não invente tabelas, endpoints, métodos ou migrações.
5. Cada fase deve terminar com testes, checklist de aceite, commits separados e relatório de implantação/reversão.
6. Não faça deploy de todas as fases juntas. Use ambiente de desenvolvimento/preview e liberações progressivas.

## Índice por ordem de execução

| Ordem | Documento | Resultado esperado |
|---|---|---|
| Leitura obrigatória | `01_CONTRATO_GLOBAL_ANTIALUCINACAO.md` | Regras fixas, escopo e proibições |
| Fase 0 | `02_FASE_0_DIAGNOSTICO_BASELINE.md` | Evidências da aplicação real e plano seguro |
| Fase 1 | `03_FASE_1_MULTIUSUARIOS_RBAC.md` | Contas individuais e permissões |
| Fase 2 | `04_FASE_2_CAMPANHAS_KANBAN.md` | Campanhas, bases lógicas e Kanbans isolados |
| Fase 3 | `05_FASE_3_IMPORTACOES_SEMANAIS.md` | Excel por campanha, lotes e deduplicação |
| Fase 4 | `06_FASE_4_DISTRIBUICAO_AGENDA.md` | Responsáveis, tarefas e retornos |
| Fase 5 | `07_FASE_5_EVOLUTION_MULTIINSTANCIA.md` | WhatsApp por usuário, sem perder conexão atual |
| Fase 6 | `08_FASE_6_CENTRAL_CONVERSAS_AUDITORIA.md` | Chat integrado e histórico íntegro |
| Fase 7 | `09_FASE_7_RELATORIOS_EXPORTACOES.md` | Indicadores por campanha, vendedor e lote |
| Fase 8 | `10_FASE_8_DASHBOARD_DESIGN.md` | Interface SaaS corporativa, sóbria e responsiva |
| Fase 9 | `11_FASE_9_COPILOTO_IA.md` | Análise e sugestão de respostas **sem envio automático** |
| Fase 10 | `12_FASE_10_TESTES_SEGURANCA_ROLLOUT.md` | Homologação e publicação gradual |
| Referência | `13_ARQUITETURA_E_MODELO_DE_DADOS.md` | Modelo de referência, não migração pronta |
| Referência | `14_GLOSSARIO_METRICAS_REGRAS.md` | Definições operacionais e métricas |
| Operação | `15_MODELO_DE_PROMPT_E_RELATORIO.md` | Prompt copiável e formato de entrega por fase |
| Adendo transversal | `16_ADENDO_ORIGEM_TIPO_LEAD_IMPORTACAO_DINAMICA.md` | Origens Hotspot/grupos, identificação de prospects e fichas dinâmicas |

## Adendo transversal obrigatório — Origem e tipo do lead (novembro/2026)

Leia também `16_ADENDO_ORIGEM_TIPO_LEAD_IMPORTACAO_DINAMICA.md` antes das Fases 2, 3, 6, 7 e 8. **Campanha** (objetivo comercial), **origem** (Hotspot, grupo WhatsApp, base Navetech etc.), **lote** (importação) e **vínculo contratual** (cliente confirmado, prospect, desconhecido) são conceitos diferentes. Formulários, importadores e indicadores devem se adaptar ao tipo de campanha. Não presumir que todo `clients` seja assinante; nem que telefone de grupo autorize abordagem.


## Situação recebida como contexto (NÃO constitui verificação independente)

- Nome: **NaveProspect**; negócio: Navetech Telecom.
- Repositório informado: `https://github.com/vendasdigital2011/nave.git`, branch `main`.
- Produção informada: `https://nave-zeta.vercel.app`.
- Banco oficial informado: Supabase Cloud `https://cehrtqnvxeugjqkzfnvz.supabase.co`.
- Base informada na auditoria: **125 clientes** importados de `CONDOMINIOS.xlsx`.
- Integração existente: Evolution API, com uma instância já utilizada.
- Stack descrita: Next.js App Router, TypeScript, Tailwind, Supabase, Recharts, dnd-kit, xlsx, Vercel.
- Campanha atual: Upgrade 50 → 100 Mega; campanha desejada: Leads Hotspot com novas importações semanais.
- Funcionalidades descritas pelo usuário são **requisitos e relatos**, não garantia de existência/funcionamento em cada arquivo.

## Objetivos inegociáveis

- Não excluir, zerar, sobrescrever ou recriar a base de produção.
- Não desconectar a instância WhatsApp existente nem modificar sua configuração sem migração aprovada.
- Preservar clientes, feedbacks, contatos, estados, indicadores, históricos, integrações e auditoria.
- A separação de campanhas deve ser **lógica no mesmo Supabase**, não criação de uma instância de banco para cada campanha.
- Cada usuário terá conta individual; por padrão, cada vendedor poderá conectar sua própria instância Evolution, mediante autorização.
- Centralizar as mensagens recebidas e enviadas, com fila de pendências, autoria e rastreabilidade.
- A IA **analisa e sugere**, mas **nunca envia mensagens, move Kanban nem agenda ações automaticamente** sem intervenção humana.
- Mudanças de interface devem ser sóbrias, profissionais e orientadas ao trabalho, não estereotipadas como “design de IA”.

## Como verificar conclusão

Cada fase deve produzir: (a) inventário do que mudou; (b) migração reversível, quando aplicável; (c) testes executados e resultados; (d) prints ou evidências de interface; (e) riscos residuais; (f) commit/PR; (g) instrução de rollback; (h) aprovação do usuário antes de publicar em produção.

**IMPORTANTE — segurança:** credenciais sensíveis de Supabase, Evolution API e administração apareceram em uma auditoria compartilhada anteriormente. Tratar como **potencialmente comprometidas** e planejar rotação imediata, sem copiá-las para MD, commits, logs ou prints. Apenas variáveis públicas autorizadas podem aparecer no navegador.
