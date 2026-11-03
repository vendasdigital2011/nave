# BASELINE VERIFICADA — NaveProspect (Fase 0 Concluída)

**Data do diagnóstico:** 03 de Novembro de 2026  
**Ambiente auditado:** Produção Real (Vercel & Supabase Cloud)  
**Modo:** Somente Leitura (Zero alterações destrutivas ou de código em produção)  
**Status da Fase 0:** ✅ CONCLUÍDA COM SUCESSO  

---

## 1. Identificação de Ambiente e Versões

| Item | Valor Verificado | Status |
| :--- | :--- | :---: |
| **Git Remote** | `https://github.com/vendasdigital2011/nave.git` | `[CONFIRMADO]` |
| **Branch Ativa** | `main` | `[CONFIRMADO]` |
| **Git Commit SHA** | `7cbfa1796fb9e1f252b8a74df3c0ffb514f3f6bc` | `[CONFIRMADO]` |
| **Projeto Vercel** | `nave` (Escopo: `vendasdigital2011-5220s-projects`) | `[CONFIRMADO]` |
| **URL de Produção** | `https://nave-zeta.vercel.app` (HTTP 200 OK) | `[CONFIRMADO]` |
| **Next.js** | `^15.2.0` (App Router) | `[CONFIRMADO]` |
| **React / React DOM** | `^19.0.0` | `[CONFIRMADO]` |
| **TypeScript** | `^5.7.3` | `[CONFIRMADO]` |
| **TailwindCSS** | `^3.4.17` | `[CONFIRMADO]` |
| **Supabase SDKs** | `@supabase/ssr: ^0.5.2`, `@supabase/supabase-js: ^2.49.1` | `[CONFIRMADO]` |
| **Recharts** | `^2.15.1` | `[CONFIRMADO]` |
| **dnd-kit** | `@dnd-kit/core: ^6.3.1`, `@dnd-kit/sortable: ^10.0.0` | `[CONFIRMADO]` |
| **xlsx** | `^0.18.5` | `[CONFIRMADO]` |

---

## 2. Linha de Base dos Dados (Supabase Cloud Oficial)

- **Instância Oficial Conectada:** `https://cehrtqnvxeugjqkzfnvz.supabase.co` `[CONFIRMADO]`
- **Segurança Anti-VPS / Porta 8443:** 0 chamadas a hosts de VPS ou porta 8443. Bloqueios de guarda ativos em `src/lib/supabase/client.ts` e `src/lib/supabase/server.ts`. `[CONFIRMADO]`

### 📊 Contagem Real no Banco de Produção:

| Tabela | Contagem de Registros | Detalhamento / Distribuição |
| :--- | :---: | :--- |
| **`public.clients`** | **125** | • `desativado`: **96**<br>• `vendido`: **29**<br>• `condominium`: 125 registros marcados como `"Geral"` |
| **`public.interactions`** | **0** | Tabela vazia na base de produção (histórico limpo) |
| **`public.audit_logs`** | **215** | Registros de auditoria preservados |

---

## 3. Estado da Integração Evolution API (WhatsApp)

- **Endpoint da API:** `https://evolutionapi.vps10855.panel.icontainer.net` `[CONFIRMADO]`
- **Status do Endpoint (`/instance/fetchInstances`):** HTTP 200 OK `[CONFIRMADO]`
- **Instância Existente Ativa:**  
  - Nome: **`nave`**  
  - Status de Conexão: **`open` (Conectada e Operacional)** `[CONFIRMADO]`
- **Preservação:** Nenhuma modificação, deleção ou reconexão foi realizada. A instância permanece íntegra.

---

## 4. Inventário de Arquitetura e Rotas Atuais

### 📄 Rotas de Interface (App Router):
1. `/` (`src/app/page.tsx`): Dashboard executivo e métricas.
2. `/login` (`src/app/login/page.tsx`): Tela de autenticação.
3. `/kanban` (`src/app/kanban/page.tsx`): Funil comercial de 6 etapas (`importados`, `frio`, `morno`, `quente`, `vendido`, `desativado`).
4. `/clientes` (`src/app/clientes/page.tsx`): Tabela/grid de contatos.
5. `/conversas` (`src/app/conversas/page.tsx`): Central de mensagens WhatsApp.
6. `/importacao` (`src/app/importacao/page.tsx`): Importador de planilhas.
7. `/metricas` (`src/app/metricas/page.tsx`): Análise de conversão e NPS.
8. `/whatsapp` (`src/app/whatsapp/page.tsx`): Painel de gerenciamento de QR Code / Conexão Evolution.
9. `/configuracoes` (`src/app/configuracoes/page.tsx`): Configurações operacionais.

### 🔌 Endpoints de API:
- `POST /api/auth/login` (Autenticação baseada em cookie `AUTH_COOKIE_NAME` e credencial administrativa).
- `POST /api/auth/logout` (Limpeza de cookie).
- `GET /api/evolution/instances` (Listagem de instâncias WhatsApp).
- `POST /api/evolution/instance/create` (Criação de instância).
- `GET /api/evolution/instance/connect` (Geração de QR Code).
- `GET /api/evolution/messages` (Recuperação de histórico de mensagens).
- `POST /api/evolution/message/sendText` (Disparo de mensagem de texto).
- `POST /api/evolution/webhook` (Recebimento de eventos da Evolution API).

---

## 5. Mapeamento de Tabelas Reais e Migrações

- **Arquivo DDL de Referência:** `supabase/schema.sql` (aplicado em 27/08/2026).
- **Extensões:** `uuid-ossp`.
- **Tipo ENUM:** `public.client_status` (`importados`, `frio`, `morno`, `quente`, `vendido`, `desativado`).
- **Triggers:** `set_clients_updated_at` (atualiza `updated_at` e atribui `sold_at` e `wants_upgrade = true` ao mover para `vendido`).
- **RLS Ativo:** Habilitado em `clients`, `interactions` e `audit_logs` com políticas de leitura/escrita permissivas para a etapa inicial de MVP.

---

## 6. Lista de Classificação e Diagnóstico

### `[CONFIRMADO]`
- A base real possui exatamente **125 clientes** importados, sendo 96 desativados e 29 vendidos.
- O projeto oficial do Supabase Cloud é `https://cehrtqnvxeugjqkzfnvz.supabase.co`.
- A instância Evolution `nave` está conectada (`open`) e funcionando na VPS da Evolution.
- A Vercel possui todas as variáveis de produção configuradas no projeto `nave`.

### `[DIVERGENTE]`
- **Autenticação Atual vs. Planejada:** A autenticação atual utiliza credencial fixa com cookie assinado via `src/app/api/auth/login/route.ts`, e ainda não utiliza `auth.users` / tabela `profiles`. *(Será implementado na Fase 1)*.
- **Estrutura de Campanhas:** Todos os 125 clientes atuais estão na tabela plana `clients` sem vínculo com entidade `campaigns`. *(A separação lógica será implementada na Fase 2)*.

### `[A_VALIDAR]`
- Definição formal com a gestão de vendas se os 96 clientes com status `desativado` representam recusas definitivas (opt-out) ou falha de contato inicial no condomínio.

---

## 7. Matriz de Riscos e Mitigações

| Risco Identificado | Impacto | Severidade | Medida de Mitigação |
| :--- | :--- | :---: | :--- |
| **Desconexão da Instância WhatsApp** | Perda de comunicação operacional | 🔴 Alta | Manter a instância `nave` intocada; adicionar multi-instância de forma aditiva na Fase 5. |
| **Perda ou sobrescrita dos 125 clientes** | Perda de histórico de vendas | 🔴 Alta | Modelo aditivo: a tabela `clients` continua existindo como entidade base; criar `campaign_leads` com FK apontando para `clients.id`. |
| **Colisão de Vendedores em Leads** | Atendimento duplicado ao mesmo cliente | 🟡 Média | Criação de tabela de atribuição (`assigned_user_id`) com controle de concorrência na Fase 4. |
| **Credenciais em Logs/Commits** | Exposição de segredos | 🔴 Alta | Proibição contratual de impressão de segredos; execução de scripts locais com expurgo imediato de arquivos temporários. |

---

## 8. Estratégia de Backfill para as Próximas Fases

1. **Fase 1 (RBAC):** Criar `profiles` vinculado a `auth.users`, mantendo fallback para o admin atual para não travar a aplicação.
2. **Fase 2 (Campanhas & Kanban):**
   - Criar registro na tabela `campaigns` com o nome **"Upgrade 50 → 100 Mega"** (tipo `upgrade`).
   - Migrar os 125 clientes para `campaign_leads` de forma 100% idempotente (`ON CONFLICT (campaign_id, client_id) DO NOTHING`), vinculando status correspondentes (`desativado` -> `lost`, `vendido` -> `won`).
   - Criar a segunda campanha **"Leads Hotspot"** vazia e pronta para as novas importações semanais.
