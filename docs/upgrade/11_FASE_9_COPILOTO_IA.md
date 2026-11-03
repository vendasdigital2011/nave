# FASE 9 — Copiloto IA: analisar conversa e sugerir resposta (envio HUMANO)

**Depende de:** Fases 1, 2, 6, 7, 8 e central de conversas estável.  
**Objetivo:** IA auxiliar o vendedor, sem mandar mensagem nem agir por conta própria.

## Contrato de produto inegociável

**A IA só poderá:**
- Ler o histórico **autorizado e necessário** da conversa.
- Produzir resumo, identificação de intenção/interesse e objeções, proposta de próxima ação e **rascunho de resposta**.
- Explicar de forma curta por que sugeriu determinada abordagem e sinalizar incerteza.

**A IA NÃO poderá:**
- Enviar ou agendar WhatsApp automaticamente.
- Mover Kanban, atribuir lead, alterar score/NPS ou criar tarefa sem confirmação do vendedor.
- Inventar preço, cobertura, gratuidade, promoção, condições ou vantagens que não estejam em fontes aprovadas da campanha.
- Fazer promessas de contratação em nome da Navetech.
- Acessar conversas/contatos fora do escopo do usuário logado.

## Experiência do vendedor

1. Abre a conversa e clica em **Analisar com IA** (sob demanda, não a cada mensagem).
2. O sistema envia apenas as mensagens autorizadas e regras atuais da campanha para backend Next.js.
3. Painel mostra: **Resumo**, **Intenção sugerida**, **Objeções**, **Próximo passo sugerido**, **Resposta sugerida**.
4. Vendedor pode **Editar**, **Copiar**, **Gerar outra sugestão** ou **Descartar**.
5. Mensagem só é transmitida ao WhatsApp ao clicar no botão **Enviar** já existente no chat; a chamada de IA jamais deve receber permissão/capacidade de enviar.
6. Registrar metadados de uso IA e quando texto sugerido foi aproveitado, sem considerar análise como fato comercial confirmado.

## Integração técnica

- Endpoint sugerido: `POST /api/ai/suggest-reply` (verificar convenções reais do repositório).
- Autenticar sessão Supabase, verificar `conversation_id` e vínculo com campanha/equipe no servidor.
- Buscar histórico paginado e recortado, últimos N eventos com sumarização controlada; nunca confiar em mensagem do navegador como identidade/escopo.
- Consultar modelo de IA via provedor configurável. Ex.: OpenAI API (chave exclusivamente em servidor). Não é necessário um modelo separado para cada campanha.
- Saída estruturada validada (exemplo): `{ summary, interest_level, objections, suggested_next_step, suggested_reply, caveats }`; tratar campos vazios/erro e limites de tamanho.
- Contexto comercial vem de fonte administrada (planos, preços, cobertura, promoções e prazos verificáveis). Sem informação validada, a sugestão deve solicitar confirmação, não inventar.
- Limites de custo por usuário/campanha e limite mensal; rate limiting e observabilidade sem logs de conteúdo sensível.
- Resistir a **prompt injection** em mensagens de clientes: texto de chat é dado não confiável, nunca instrução de sistema ou ação de servidor.
- Minimizar PII, configurar retenção conforme provedor, LGPD e contrato. Não colocar secret key em prompt.

## Auditoria e qualidade

- Registrar usuário, campanha/conversa referenciada, modelo/versão, horário, tokens/custo estimado, resultado ou erro; corpo sugerido apenas conforme política de retenção.
- A resposta efetivamente enviada é armazenada como mensagem humana pelo fluxo normal; atribuir operador real.
- Inserir botão de feedback sobre sugestão: útil/não útil e motivo opcional.
- Cenários de teste: cliente interessado, objeção preço, pedido sem cobertura, instrução maliciosa, conversa vazia, dados incompletos, erro de API, alto volume.

## Aceite

- [ ] A IA apresenta análise e resposta editável.
- [ ] Não existe endpoint/ferramenta da IA capaz de enviar WhatsApp.
- [ ] Desativar API/sem saldo não bloqueia chat humano.
- [ ] Respostas não inventam dados comerciais; quando faltam informações, pedem confirmação.
- [ ] Usuários não analisam conversas de terceiros.
- [ ] Custo, limites, erros e auditoria são observáveis.
- [ ] Prompt injection de cliente não altera regras nem exfiltra segredos.

## Comando ao Antigravity

> Executar Fase 9. Implementar apenas copiloto sob demanda na central já existente. O vendedor revisa e envia manualmente. Não criar agente autônomo, automação de disparos, chatbot nem ferramentas de envio. Chaves no servidor, autorização por conversa e uso registrado. Não inventar preços ou regras.
