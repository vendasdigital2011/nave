# Upgrade CRM WhatsApp MVP

## Objetivo do Projeto

Desenvolver um CRM extremamente simples para abordagem comercial de clientes de internet, focado inicialmente na migração de clientes do plano 50 Mega para 100 Mega.

O sistema será utilizado por operadores humanos e não terá chatbot, IA conversacional, disparos automáticos ou automações de WhatsApp nesta primeira versão.

Toda a operação será manual.

---

# Objetivo do MVP

Permitir que o operador:

- Importe uma planilha de clientes.
- Conecte um WhatsApp via QR Code.
- Converse com clientes dentro da plataforma.
- Organize clientes em um Kanban.
- Registre NPS.
- Registre interesse em upgrade.
- Registre indicações.
- Acompanhe métricas através de gráficos.

---

# Filosofia do Projeto

## Simplicidade primeiro

A prioridade é validar a operação.

Não desenvolver funcionalidades complexas antes da validação do fluxo comercial.

Sempre implementar primeiro a solução mais simples possível.

---

# Regras para Desenvolvimento

## Utilização de IA e Agentes

Este projeto será desenvolvido utilizando o plano gratuito da plataforma.

Para economizar créditos e contexto:

### Tarefas Simples

Utilizar agentes simples.

Exemplos:

- Criação de componentes.
- Ajustes visuais.
- CRUD simples.
- Formulários.
- Tabelas.
- Importação de planilhas.
- Correções pequenas.
- Refatorações pontuais.

---

### Tarefas Complexas

Utilizar IA avançada apenas quando necessário.

Exemplos:

- Arquitetura.
- Banco de dados.
- Integração WhatsApp.
- Realtime.
- Segurança.
- Performance.
- Migrações.
- Estruturação de módulos.
- Fluxos críticos.

---

### Regra Geral

Antes de iniciar qualquer tarefa, avaliar:

> Esta tarefa realmente exige IA avançada?

Se a resposta for não:

Utilizar agentes simples.

Objetivo:

Reduzir consumo desnecessário de créditos e contexto.

---

# Stack Tecnológica

## Frontend

- Next.js 16
- TypeScript
- Tailwind CSS
- Shadcn UI

## Backend

- Next.js Server Actions

## Banco de Dados

- Supabase PostgreSQL

## Autenticação

- Supabase Auth

## Hospedagem

- Vercel

## Gráficos

- Recharts
- Shadcn Charts

## Kanban

- dnd-kit

## WhatsApp

- Evolution API (fase posterior)

---

# Escopo MVP Inicial

## Fase 1

### Login

- Login simples
- Logout

---

### Importação de Planilha

Campos:

- Nome
- WhatsApp
- Plano

Formatos:

- XLSX
- CSV

---

### Cadastro de Clientes

Campos:

- Nome
- WhatsApp
- Plano

---

### Kanban

Colunas:

- Frio
- Morno
- Quente
- Vendido

Drag and Drop obrigatório.

---

### Dashboard

Indicadores:

- Total de Clientes
- Frios
- Mornos
- Quentes
- Vendidos
- Conversão

---

### Gráficos

#### Funil Comercial

- Frio
- Morno
- Quente
- Vendido

#### Conversão de Upgrade

- Total
- Abordados
- Interessados
- Vendidos

#### NPS

- Promotores
- Neutros
- Detratores

#### Evolução de Vendas

- Diário
- Semanal
- Mensal

#### Indicações

- Sim
- Não

#### Taxa de Resposta

- Respondidos
- Não Respondidos

---

# Fora do Escopo Inicial

Não desenvolver agora:

- Chatbot
- IA
- Automações
- Disparo em massa
- Multiempresa
- Multiatendente
- Aplicativo mobile
- Integração financeira
- Campanhas automáticas
- CRM avançado

---

# Roadmap

## Sprint 01

- Setup projeto
- Supabase
- Auth
- Layout
- Dashboard

## Sprint 02

- Clientes
- Importação XLSX
- Kanban

## Sprint 03

- Gráficos
- Indicadores
- Relatórios básicos

## Sprint 04

- Integração WhatsApp
- QR Code
- Conversas

---

# Meta da Versão 1

Validar se o processo comercial de upgrade de clientes funciona utilizando:

- Dashboard
- Kanban
- Controle operacional
- Atendimento humano

Antes de investir em automações, IA ou funcionalidades avançadas.

---

# Princípio de Desenvolvimento

> Entregar funcionalidade simples funcionando vale mais do que desenvolver funcionalidades complexas que ainda não foram validadas pelo negócio.

Implementar primeiro.
Validar com usuários.
Ajustar.
Evoluir depois.