# FASE 10 — Homologação integrada, segurança e publicação controlada

**Depende de:** Fases entregues até o escopo efetivamente escolhido.  
**Objetivo:** liberar recursos sem interromper operação nem perder dados.

## Estratégia de release

- Um PR/commit lógico por fase; deploy em Preview, testes e aprovação antes de Production.
- Migrações aditivas versionadas antes da feature que as usa; flags para habilitar por usuário/campanha quando factível.
- Preservar app atual até novos módulos estarem validados; não executar migrações destrutivas em produção.
- Registrar Git SHA, deployment ID, aliases e URL efetiva para evitar o erro anterior de acessar projeto/domínio antigo.
- Validar no **domínio oficial** `https://nave-zeta.vercel.app`, confirmado no painel Vercel no momento do deploy.

## Matriz de testes end-to-end

| Fluxo | Evidência exigida |
|---|---|
| Upgrade legado | Contagem, status, NPS, observações e Kanban idênticos ao baseline |
| Nova campanha Hotspot | Criação isolada, funil independente, permissões corretas |
| Dois lotes semanais | Novos + duplicados + rejeitados contabilizados sem perda |
| Usuário vendedor | Login próprio; não acessa campanha/lead não autorizado |
| Supervisor | Vê equipe autorizada, redistribui lead e gera auditoria |
| Duas instâncias WhatsApp | Conexão e envio manual por usuário sem misturar números |
| Webhook de resposta | Recebimento único apesar de retry, histórico e notificação |
| Mensagem ambígua | Triagem sem atribuição falsa a uma campanha |
| Tarefa/retorno | Aparece no Meu Dia e conserva status/histórico |
| Relatórios | Mesmos totais de consultas controladas e exportações |
| IA copiloto | Sugere, não envia, e respeita permissões/custos |
| Desktop/mobile | Navegação, Kanban, chat, relatórios e estados de erro utilizáveis |

## Segurança específica

- **Rotação de credenciais expostas:** chaves secretas Supabase, Evolution API e senha administrativa que foram compartilhadas anteriormente precisam ser substituídas e removidas de logs/repositório. Não gravar os valores antigos nos relatórios. Planejar ordem de rotação e smoke test para reduzir interrupção.
- Revisar `NEXT_PUBLIC_*`: somente parâmetros explicitamente públicos; chaves de serviço e Evolution nunca no browser.
- Confirmar RLS, autorização server-side, isolamento de campanha, IDOR, CORS, rate limiting, proteção contra webhook falso/replay, exportação de PII e tratamento de erros.
- Executar análise de dependências, `npm run build`, lint/testes disponíveis e cenários adversariais.
- Determinar retenção/eliminação de mensagens e arquivos; política LGPD e opt-out.

## Observabilidade mínima

- Falhas de webhook, backlog, duplicados descartados, latência de sincronização, instâncias offline.
- Falhas em importação, tarefas atrasadas, erros em relatórios e consumo/erros da IA.
- Logs correlacionáveis por ID de evento/solicitação, **sem segredos ou conteúdo sensível desnecessário**.
- Alertas de erro crítico ao administrador ou canal de operação configurado.

## Rollback

- Desligar módulos novos por flag/rota sem apagar registros criados.
- Reverter deploy na Vercel **apenas** após confirmar compatibilidade do código anterior com schema aditivo.
- Se migração falhar, parar writes novos e seguir plano específico da fase; não executar `DROP` para “voltar atrás”.
- Não reconstruir Supabase ou reimportar 125 clientes como forma de reparação.
- Registrar incidente, impacto, evidências e decisão de recuperação.

## Critérios finais

- [ ] Baseline de clientes preservada e diferenças justificadas.
- [ ] Campanhas isoladas e permissões efetivas em backend/banco.
- [ ] Instância WhatsApp legada funcionando, novas conexões testadas.
- [ ] Chat com mensagens enviadas/recebidas e auditoria consistente.
- [ ] Relatórios conciliados; nenhuma métrica sem definição.
- [ ] IA não pode enviar mensagens; operações humanas auditadas.
- [ ] Chaves expostas rotacionadas e vazamentos verificados.
- [ ] Plano de rollback executável e evidências anexadas.
- [ ] Administrador aprova antes de liberar em Production.

## Comando ao Antigravity

> Execute a homologação e o plano de rollout da Fase 10 com escopo limitado às fases aprovadas. Não publique nem altere dados de produção sem autorização. Entregue evidências de testes, riscos, migrações, backup e plano de rollback. Não declare 'tudo OK' sem provas.
