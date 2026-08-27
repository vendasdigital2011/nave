#!/usr/bin/env bash
set -e

echo "===================================================="
echo "🛡️  AUDITORIA DE SEGURANÇA ANTI-VPS SUPABASE (BASH)"
echo "===================================================="

node scripts/audit-supabase.js

if grep -rn "8443" src/; then
    echo "❌ ERRO: Porta 8443 encontrada em src/"
    exit 1
fi

if grep -rn "supabase.vps" src/; then
    echo "❌ ERRO: supabase.vps encontrado em src/"
    exit 1
fi

echo "✅ AUDITORIA BASH APROVADA!"
