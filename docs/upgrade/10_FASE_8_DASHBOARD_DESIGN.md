# FASE 8 — Dashboard profissional e design system (sem aparência genérica de IA)

**Depende de:** Fases 1–7.  
**Objetivo:** reorganizar navegação e painéis em uma interface SaaS corporativa, clara, acessível, responsiva e eficiente.

## Linguagem visual

- Marca Navetech: **laranja `#FF6A00`**, **grafite `#0B0B0D`**, **cinza claro `#F8FAFC`**. Branco para superfícies. Cor de marca usada como acento, não como fundo de todos os cards.
- Tipografia: `Inter` ou tipografia já utilizada se compatível; números com alinhamento tabular.
- Estilo: sóbrio, espaçamento consistente, bordas discretas, sombras mínimas, raios moderados; alto contraste, boa leitura.
- Evitar: neon, gradientes chamativos, emojis decorativos, ícones em excesso, telas com inúmeros cards iguais, microanimações gratuitas, textos genéricos e gráficos fictícios.
- Criar tokens de layout/cores/tipografia e componentes reutilizáveis; preferir evolução de componentes existentes à troca de toda a biblioteca.

## Arquitetura de navegação proposta

**Visão geral:** Dashboard executivo, Meu Dia.  
**Comercial:** Campanhas, Leads, Kanban, Importações.  
**Atendimento:** Conversas, Agenda, Meu WhatsApp.  
**Inteligência:** Relatórios, NPS, Auditoria (conforme papel).  
**Administração:** Usuários, Instâncias, Configurações.

Sidebar desktop colapsável, cabeçalho com seletor de campanha e período, breadcrumb em páginas profundas; experiência mobile com navegação adequada. Não deixar sidebar obstruir Kanban ou chat.

## Três painéis por função

**Administrador:** consolidado de campanhas, produtividade, conversões, SLA, instâncias e alertas técnicos; acesso à auditoria conforme política.  
**Supervisor:** campanhas e equipe autorizadas, fila sem resposta, distribuição, produtividade, metas e gargalos.  
**Vendedor:** `Meu Dia`: tarefas, leads, conversas aguardando, retornos e propostas em andamento; evitar indicadores administrativos irrelevantes.

## Páginas e componentes

- **Dashboard:** cabeçalho com contexto; quatro KPIs prioritários; evolução temporal; conversões por campanha; pendências de atendimento; tabela de campanhas.
- **Campanhas:** listagem escaneável com nome, objetivo, período, situação, volume de leads, responsável e CTA de entrada.
- **Kanban:** colunas de altura e rolagem adequadas; cartões compactos, nome, última atividade, responsável, próximo retorno; boa UX de arrastar e soltar, alternativa acessível por menu.
- **Central de conversas:** inbox, mensagens, painel de lead; foco em leitura e velocidade, não em efeitos.
- **Importação:** passos claros, preview, erros por linha, resultado do lote.
- **Relatórios:** filtros consistentes, tabelas, gráficos justificados, notas de metodologia.
- **Administração:** formularios com validação, feedback preciso e ações perigosas com confirmação.

## Estados essenciais

Loading skeleton simples; erro de conexão com ação de tentar novamente; vazio explicado; sem permissão explícito; dados parciais; instância WhatsApp desconectada; envio em andamento; sucesso somente após confirmação real.

## Requisitos de UX e desempenho

- Usar espaçamento consistente (escala 4/8 px), contraste acessível, foco por teclado, labels e estados de erro.
- Mobile: páginas com navegação própria; tabelas responsivas; não forçar Kanban de seis colunas minúsculas.
- Filtros ativos visíveis, links/copiar URL úteis, lembrar seleção de campanha sem violar permissões.
- Boa performance em listas grandes: paginação/virtualização conforme necessidade, sem carregar todas as conversas.
- Gráficos devem contar algo útil e partir de dados reais. Sem números inventados ou linhas de crescimento decorativas.

## Processo de design sem regressão

1. Auditar páginas reais e mapa de navegação existente.
2. Definir tokens e componentes em ambiente preview; capturas de antes/depois.
3. Redesenhar Dashboard/Meu Dia e navegação sem alterar regras de negócio.
4. Harmonizar Campanhas, Kanban, Conversas, Importação e Relatórios de forma incremental.
5. Testar responsividade em larguras desktop/tablet/mobile e verificar acessibilidade.
6. Manter funcionalidades essenciais acessíveis durante transição; revisar impactos na UI existente.

## Aceite

- [ ] Admin, supervisor e vendedor veem dashboard adequado ao perfil.
- [ ] Nenhum indicador falso ou gráfico sem dados é exibido como real.
- [ ] Menu e navegação são consistentes nas telas.
- [ ] Kanban e chat continuam funcionais em desktop e mobile.
- [ ] Componentes têm foco, contraste e estados de erro corretos.
- [ ] Performance e funcionalidades existentes não regrediram.
- [ ] Visual profissional e contido, sem recursos decorativos excessivos.

## Comando ao Antigravity

> Execute SOMENTE Fase 8: UX/UI profissional do CRM atual. Não refatore esquema do banco, regras comerciais nem integrações. Construa design system reutilizável, dashboards por papel e navegação adaptativa. Apresente telas antes/depois e testes de regressão. Não invente dados.
