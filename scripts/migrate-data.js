const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function migrateData() {
  console.log('=== POPULANDO SUPABASE CLOUD COM OS DADOS DE BACKUP ===\n');

  const backupPath = path.join(process.cwd(), 'backups', 'backup_completo_upgradenavetech_2026-08-21T23-04-59-598Z.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Arquivo de backup não encontrado em:', backupPath);
    return;
  }

  const backupContent = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  const clients = backupContent.clients || [];

  console.log(`Carregando ${clients.length} clientes do backup...`);

  const { data, error } = await supabase
    .from('clients')
    .upsert(clients, { onConflict: 'id' });

  if (error) {
    console.error('Erro ao migrar clientes:', error.message);
  } else {
    console.log(`✅ Sucesso! ${clients.length} clientes migrados com sucesso para o Supabase Cloud!`);
  }
}

migrateData();
