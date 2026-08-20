# Correção 02 - Performance

## Problema
Abertura de conversa levando aproximadamente 5 segundos.

## Meta
Ideal: abaixo de 1 segundo.
Aceitável: abaixo de 2 segundos.

## Auditoria Obrigatória
1. Tempo de abertura do chat
2. Tempo das queries
3. Tempo da Evolution API
4. Requisições duplicadas
5. N+1 Queries
6. Falta de índices
7. Promise.all
8. Renderizações duplicadas

## Entregável
- Arquivos envolvidos
- Gargalo encontrado
- Correção recomendada

## Critério de Aceite
- Chat abre em menos de 2 segundos
- Sem chamadas desnecessárias
- Sem travamentos
