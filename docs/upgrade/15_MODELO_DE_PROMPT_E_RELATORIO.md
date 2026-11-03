# Modelo de execução para o Antigravity — copie e adapte por fase

## Prompt de abertura (cole na IDE junto aos MD correspondentes)

```text
Você vai trabalhar no repositório EXISTENTE NaveProspect, em produção.

DOCUMENTOS OBRIGATÓRIOS PARA ESTA EXECUÇÃO:
- 01_CONTRATO_GLOBAL_ANTIALUCINACAO.md
- [MD da fase atual]
- 13_ARQUITETURA_E_MODELO_DE_DADOS.md (somente referência, não executar tudo)
- 14_GLOSSARIO_METRICAS_REGRAS.md (quando envolver regras/relatórios)
- BASELINE_VERIFICADA.md e relatório de conclusão da fase anterior, se já existirem.

ORDEM OBRIGATÓRIA:
1. Ler o repositório e comparar com os arquivos MD.
2. Apresentar o que está CONFIRMADO, DIVERGENTE e NÃO VERIFICADO.
3. Explicar quais arquivos, tabelas, APIs, RLS e componentes seriam afetados.
4. Apresentar plano de alteração, teste e reversão limitado à fase atual.
5. Somente então implementar o escopo definido, sem antecipar outras fases.
6. Validar com testes e evidências; não dizer que algo funcionou sem testar.
7. Entregar relatório de conclusão no formato abaixo.

RESTRIÇÕES:
- Não excluir nem recriar Supabase, Vercel, GitHub, clientes ou histórico.
- Não remover a conexão Evolution existente.
- Não publicar credenciais nem dados pessoais nos logs.
- Não alterar código de outras fases sem justificativa de compatibilidade.
- Não realizar deploy de produção sem aprovação explícita.
- Cada transição deve ser reversível e manter sistema atual utilizável.
- A IA copiloto apenas sugere: nunca envia WhatsApp automaticamente.

FASE ATUAL: [NUMERO E TITULO]
RESULTADO ESPERADO: [RESUMO]
```

## Relatório de conclusão obrigatório

```markdown
# Relatório de conclusão — Fase XX

## 1. Estado
- [ ] PRONTO PARA REVISÃO
- [ ] NÃO PRONTO
- Commit/PR:
- Ambiente testado:
- Data:

## 2. Evidências da baseline
- Git SHA inicial:
- Contagem de clientes inicial (consulta e projeto):
- Instância Evolution existente e estado (sem credenciais):
- Esquema/RLS relevante:

## 3. Mudanças realizadas
| Arquivo/tabela | Alteração | Justificativa |
|---|---|---|

## 4. Migrações/backfills
- Migration:
- Idempotência:
- Contagem depois:
- SQL de conferência (sem dados pessoais):

## 5. Testes executados
| Teste/comando | Resultado | Evidência |
|---|---|---|

## 6. Segurança e privacidade
- RBAC/RLS verificados:
- Segredos expostos?:
- Casos IDOR/webhook relevantes:

## 7. Preservação do legado
- Clientes e históricos:
- Kanban e importações antigas:
- WhatsApp/Evolution:
- Domínio e deploy verificados:

## 8. Riscos, bloqueios e decisões
- Riscos residuais:
- Requisitos divergentes:
- Pontos não testados:

## 9. Rollback
- Desativação por flag:
- Reversão de deploy:
- Compatibilidade de schema e dados:

## 10. Próxima fase
- Dependências atendidas:
- Pendências impeditivas:
```

## Critérios de reprovação imediata

- A IA inventar tabela/arquivo/endpoint e agir como se existisse.
- Mudança destrutiva ou migração sem conferência de integridade.
- Erro na segregação entre usuários/campanhas.
- Envio não autorizado de WhatsApp.
- Exposição de segredo em frontend/log ou PR.
- Refatoração geral fora do escopo da fase.
- Declaração de sucesso sem build/teste/consulta observável.
- Publicação em produção não aprovada.

## Exemplo de conversa com o agente

**Usuário:** “Execute somente a Fase 2. Leia o contrato global e a baseline. Primeiro me mostre o plano e o esquema real, depois implemente e teste.”

**Agente (esperado):** evidencia tabelas/código reais, elenca divergências, plano e migrations compatíveis, executa alterações permitidas, testa isolamento, entrega relatório. Se não conseguir verificar o banco, reporta bloqueio em vez de simular SQL bem-sucedido.
