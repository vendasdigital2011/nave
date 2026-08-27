#!/usr/bin/env bash
set -e

echo "🧹 [1/4] Removendo caches locais (.next, .vercel)..."
rm -rf .next
rm -rf .vercel

echo "🛡️ [2/4] Executando auditoria anti-VPS..."
node scripts/audit-supabase.js

echo "📦 [3/4] Executando build de produção limpo..."
npm run build

echo "✅ [4/4] Build limpo concluído com sucesso!"
