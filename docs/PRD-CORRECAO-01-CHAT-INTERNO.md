# Correção 01 - Chat Interno Evolution

## Objetivo
Remover qualquer abertura do WhatsApp Web ou App.

## Regra
Todo atendimento deve ocorrer dentro da plataforma.

## Proibido
- wa.me
- web.whatsapp.com
- api.whatsapp.com
- window.open para WhatsApp

## Fluxo Correto
Clientes
→ Conversa
→ Tela Interna
→ Evolution API
→ Cliente

## Auditoria
- Identificar arquivos do botão conversar
- Identificar redirecionamentos externos
- Identificar rotas de chat

## Critério de Aceite
- Nenhum clique abre WhatsApp externo
- Conversa abre internamente
- Histórico carregado dentro da plataforma
