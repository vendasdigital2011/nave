# FASE 1 — Multiusuários, autenticação e permissões (RBAC)

**Depende de:** Fase 0.  
**Objetivo:** cada funcionário ter identidade própria, acesso por função e trilha segura de ações.

## Resultado do usuário

- Administrador cadastra/convida, ativa, suspende e define função de funcionários.
- Supervisor gerencia campanhas e leads autorizados e acompanha os vendedores sob sua responsabilidade.
- Vendedor acessa somente campanhas e leads permitidos, atualiza seus atendimentos e utiliza sua conexão WhatsApp autorizada.
- Sessões individuais permitem atribuir ações ao ID da pessoa, não a um e-mail escrito no frontend.

## Decisões técnicas

- Usar **Supabase Auth** ou compatibilizar o auth existente após inspeção; **não substituir autenticação sem necessidade**.
- Papel global inicial proposto: `admin`, `supervisor`, `seller`. Não adicionar papéis não solicitados.
- Criar/normalizar `profiles` vinculado a `auth.users.id`, se ainda não existir, com `display_name`, `role`, `is_active`, `created_at`, `updated_at`.
- Não usar `operator_email`, claims alteráveis pelo cliente nem nome como fonte de autorização. Conservar `operator_email` legado para compatibilidade histórica, mas priorizar `actor_user_id` em novos registros.
- Gestão de convites/usuários via backend autenticado e autorizado; secrets apenas no servidor.
- Definir política de acesso a campanhas via `campaign_members` na Fase 2; nesta fase preparar RBAC, sem antecipar o esquema da Fase 2.

## Permissões iniciais (ajustar após inventário)

| Recurso | Admin | Supervisor | Vendedor |
|---|---|---|---|
| Configurar usuários | Sim | Não | Não |
| Criar campanhas | Sim | Mediante permissão posterior | Não |
| Ver todos os relatórios | Sim | Apenas escopo autorizado | Apenas próprio escopo |
| Acessar leads/conversas | Todos autorizados | Equipe/campanha autorizada | Próprios/atribuídos |
| Configurar credenciais Evolution | Sim | Não | Nunca visualizar segredo |
| Conectar instância própria | Sim | Se autorizado | Se autorizado |
| Excluir dados/auditoria | Regra restrita e auditável | Não | Não |

## Etapas de implementação

1. Auditar middleware, login, papéis e sessões atuais; identificar se a conta administrativa já usa Supabase Auth.
2. Criar migration **aditiva** para perfis/papéis e referências de auditoria ao `auth.users`, preservando usuários atuais.
3. Implementar serviços de criação/convite e suspensão com validação no backend; senhas temporárias nunca em código ou `.env` compartilhado.
4. Aplicar RLS testada em ambiente de desenvolvimento/preview; usar `auth.uid()` nas policies e `SECURITY DEFINER` somente quando imprescindível, com `search_path` e grants controlados.
5. Implementar UI de administração de usuários; estados de convite pendente, ativo e suspenso.
6. Impedir que usuário suspenso utilize APIs autenticadas, inclusive endpoints que usam secret key no backend.
7. Adicionar evento de auditoria para login relevante, criação de usuário, alteração de papel, suspensão e reativação, sem tokens/senhas.

## Requisitos de segurança

- Não permitir autoconcessão de `admin`/`supervisor` por update direto do perfil.
- Não armazenar senha de colaborador em texto puro, planilha, log ou tabela de aplicação.
- Não confiar no middleware como única barreira: toda rota sensível revalida a identidade e o escopo.
- Testar usuário A tentando consultar recursos do usuário B por troca de IDs (IDOR).
- Rotacionar credenciais de produção expostas com procedimento seguro e janela definida, inclusive credenciais administrativas legadas.

## Fora de escopo

Criar campanhas, conectar instâncias ou construir chat. Esses itens pertencem às fases seguintes.

## Critérios de aceite

- [ ] Admin cria/ativa/desativa funcionário autorizado.
- [ ] Funcionário possui login/sessão próprios.
- [ ] Vendedor não acessa endpoints de administração nem pode elevar papel.
- [ ] API e RLS negam acessos fora do papel, inclusive com chamada HTTP direta.
- [ ] Conta atual, dados e acesso de produção preservados.
- [ ] Eventos de administração aparecem na auditoria com ID do ator.
- [ ] Plano de rollback e testes registrados.

## Comando ao Antigravity

> Implemente exclusivamente a Fase 1 após ler baseline e contrato global. Verifique o auth real e crie multiusuários/RBAC com migração aditiva, testes RLS e compatibilidade. Não crie Kanban, campanhas ou WhatsApp nesta fase. Apresente diferenças reais antes de codificar.
