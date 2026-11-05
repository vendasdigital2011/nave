# CONTRATO GLOBAL — Instruções obrigatórias para a IA desenvolvedora

> **Este arquivo deve acompanhar TODA fase.** Atua como contrato de engenharia e limitações. Não substitui leitura do repositório.

## Papel do agente

Atue como engenheiro sênior de Next.js, TypeScript, Supabase/Postgres e integrações Evolution API. Trabalhe no **NaveProspect existente em produção**. Preserve compatibilidade e faça mudanças pequenas, testáveis, auditáveis e reversíveis. **Não redesenhe a arquitetura inteira por iniciativa própria.**

## Regras contra alucinação e mudanças destrutivas

1. **Inspecione antes de implementar:** leia `package.json`, rotas, esquema real do Supabase, migrações, políticas RLS, componentes usados e integração Evolution atual. Cite caminhos reais e mostre evidências. Jamais presuma que um arquivo, tabela, pacote ou endpoint existe.
2. **Separe fatos, inferências e propostas:** use etiquetas `[VERIFICADO]`, `[INFERIDO]`, `[PROPOSTO]` no diagnóstico. Se houver lacuna, anote `NÃO VERIFICADO`.
3. **Respeite estritamente a fase ativa:** não implemente funcionalidades de outras fases, mesmo que pareçam simples; somente pequenos ajustes necessários à compatibilidade e explicitamente justificados.
4. **Proibido recriar projetos:** não apagar repositório, projeto Vercel, Supabase, tabelas ou massa de clientes. Não usar `DROP TABLE`, `TRUNCATE`, `DELETE` em massa, `supabase db reset` em ambiente de produção.
5. **Migrações aditivas primeiro:** usar SQL versionado, backfill idempotente, validações antes/depois, índices e constraints com cuidado. Mover/renomear campos existentes apenas após estratégia formal de compatibilidade.
6. **Não mexer na URL do banco oficial:** o projeto informado é `cehrtqnvxeugjqkzfnvz.supabase.co`. Confirmar configuração no ambiente de destino. Nunca retornar ao Supabase antigo na VPS ou à porta `8443`.
7. **Não quebrar Evolution API:** sua API legítima pode operar em VPS; a proibição de VPS refere-se **somente ao Supabase antigo**. Não remover variáveis ou integrações Evolution por engano.
8. **Segredos:** nunca imprimir chaves completas, secrets, tokens de sessão ou senhas em relatórios, terminal, logs, PR, navegador ou banco de conversas. Se houver credenciais expostas, apontar necessidade de rotação. Usar configuração server-side e permissões mínimas.
9. **Sem falsos sucessos:** não afirmar que houve deploy, migração, teste, contagem de clientes ou conexão WhatsApp sem evidência de execução real.
10. **Rollback obrigatório:** cada alteração deve ter maneira de desativar a funcionalidade e preservar dados. Reversão de esquema não pode perder registros adquiridos depois da migração.
11. **Controle de concorrência:** múltiplos vendedores não podem sobrescrever ou assumir o mesmo lead sem uma regra clara; operações críticas precisam de transação/controle de versão.
12. **LGPD e consentimento:** registrar opt-out, limitar dados pessoais, controlar exportação, acesso e retenção. Não automatizar disparos não autorizados.
13. **Qualidade:** manter strict TypeScript, componentes existentes quando adequados, lint/build/testes, boas práticas de segurança e acessibilidade. Documentar exceções.
14. **Ambientes:** não presumir que `.env.local` equivale a Production na Vercel. Confirmar configuração por ambiente sem revelar valores sensíveis.
15. **Fases concluídas:** respeitar contratos e IDs já criados; não abrir migrations conflitantes nem duplicar modelos de dados em fases subsequentes.

## Portas de aprovação (gates)

**Antes de editar:** inventário real + impacto + plano + backup.  
**Antes de migrar:** script versionado + estratégia idempotente + teste em ambiente isolado + plano de volta.  
**Antes de publicar:** testes relevantes + comparação de contagens + validação RLS + revisão dos riscos.  
**Depois de publicar:** smoke test no domínio correto + telemetria + evidência de que clientes/WhatsApp permanecem íntegros.

## Estrutura mínima de resposta do agente

1. Resumo do que foi **verificado**.
2. Lista de arquivos/tabelas existentes afetados.
3. Diferenças entre documentação e repositório (se houver).
4. Plano limitado à fase, dependências e risco.
5. Alterações realizadas, por arquivo, e respectivas migrações.
6. Testes com comandos, saídas resumidas e resultados.
7. Evidências de preservação dos dados e funcionalidades existentes.
8. Bloqueios, decisões pendentes e riscos residuais.
9. Commit/PR, instrução de rollback e indicação explícita: `PRONTO PARA REVISÃO` ou `NÃO PRONTO`.

## Critério de pausa

Interrompa alterações e solicite decisão técnica somente quando algo essencial não possa ser verificado com segurança: autorização, propriedade de dados, credencial inválida, esquema significativamente diferente, risco de perda de dados ou integração que exige reconexão. **Nunca improvise uma solução destrutiva.**
