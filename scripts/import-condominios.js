const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Carregar variáveis de .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cehrtqnvxeugjqkzfnvz.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ ERRO: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function formatPhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 22) {
    const first11 = digits.slice(0, 11);
    return `(${first11.slice(0, 2)}) ${first11.slice(2, 7)}-${first11.slice(7)}`;
  }
  return raw.trim();
}

function parseExcelDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString();
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function runImport() {
  console.log('====================================================');
  console.log('📊 IMPORTAÇÃO AUTOMÁTICA DA PLANILHA OFICIAL (CONDOMINIOS.xlsx)');
  console.log('Target Supabase:', supabaseUrl);
  console.log('====================================================\n');

  const filePath = path.join(process.cwd(), 'CONDOMINIOS.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo CONDOMINIOS.xlsx não encontrado em:', filePath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  console.log('📂 Abas encontradas:', workbook.SheetNames);

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const totalRawRows = data.length;
  console.log(`📄 Total de linhas brutas na aba [${sheetName}]: ${totalRawRows}`);

  const clientsToInsert = [];
  const rejectedRecords = [];
  const seenPhones = new Map();
  let duplicateCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || (!row[0] && !row[1])) continue;

    const rawName = row[0] ? String(row[0]).replace(/\s+/g, ' ').trim() : '';
    const rawPhone = row[1] ? String(row[1]).trim() : '';
    const fb1 = row[2] ? String(row[2]).replace(/\s+/g, ' ').trim() : null;
    const rawDate = row[3];
    const fb2 = row[4] ? String(row[4]).replace(/\s+/g, ' ').trim() : null;

    if (!rawName) {
      rejectedRecords.push({ row: i + 1, reason: 'Nome ausente', data: row });
      continue;
    }

    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      rejectedRecords.push({ row: i + 1, reason: `Telefone inválido (${rawPhone})`, data: row });
      continue;
    }

    const normalizedPhone = formatPhone(rawPhone);
    const keyPhone = cleanDigits.slice(0, 11);

    if (seenPhones.has(keyPhone)) {
      duplicateCount++;
      rejectedRecords.push({
        row: i + 1,
        reason: `Duplicidade detectada (telefone já cadastrado na linha ${seenPhones.get(keyPhone)})`,
        data: { name: rawName, phone: normalizedPhone },
      });
      continue;
    }

    seenPhones.set(keyPhone, i + 1);

    // Determinar status inteligente
    let status = 'frio';
    if (fb2 && (fb2.includes('DESATIVOU') || fb2.includes('CANCELOU') || fb2.includes('NÃO QUER'))) {
      status = 'desativado';
    } else if (fb1 && fb1.includes('DESATIVOU')) {
      status = 'desativado';
    } else if (fb1 || fb2) {
      status = 'frio';
    }

    const lastContactAt = parseExcelDate(rawDate);
    const now = new Date().toISOString();

    const client = {
      id: `c_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      name: rawName.toUpperCase(),
      phone: normalizedPhone,
      condominium: 'Geral',
      current_plan: '50 Mega',
      target_plan: '100 Mega',
      status: status,
      feedback_first_contact: fb1,
      feedback_second_contact: fb2,
      last_contact_at: lastContactAt,
      operator_email: 'admin@navetech.com.br',
      created_at: now,
      updated_at: now,
    };

    clientsToInsert.push(client);
  }

  console.log('\n--- RELATÓRIO DE PROCESSAMENTO ---');
  console.log(`Linhas processadas: ${data.length - 1}`);
  console.log(`Registros válidos para importação: ${clientsToInsert.length}`);
  console.log(`Registros duplicados: ${duplicateCount}`);
  console.log(`Registros rejeitados: ${rejectedRecords.length}`);

  if (rejectedRecords.length > 0) {
    console.log('\nMotivo das rejeições:');
    rejectedRecords.forEach((r) => console.log(` - Linha ${r.row}: ${r.reason}`));
  }

  console.log('\n🚀 Iniciando inserção no Supabase Cloud...');
  const BATCH_SIZE = 50;
  let insertedCount = 0;

  for (let i = 0; i < clientsToInsert.length; i += BATCH_SIZE) {
    const batch = clientsToInsert.slice(i, i + BATCH_SIZE);
    const { data: inserted, error } = await supabase.from('clients').insert(batch).select('id');
    if (error) {
      console.error(`❌ Erro no lote ${i} - ${i + batch.length}:`, error.message);
      // Tentativa linha a linha se o lote falhar
      for (const item of batch) {
        const { error: singleErr } = await supabase.from('clients').insert([item]);
        if (!singleErr) insertedCount++;
        else console.error(`  Erro no cliente ${item.name}:`, singleErr.message);
      }
    } else {
      insertedCount += batch.length;
      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1} inserido (${insertedCount}/${clientsToInsert.length})`);
    }
  }

  console.log(`\n🎉 Importação concluída! Total inserido: ${insertedCount} clientes.`);

  // Auditoria pós-importação
  const { count, error: countErr } = await supabase.from('clients').select('*', { count: 'exact', head: true });
  console.log(`\n📊 SELECT COUNT(*) FROM clients => ${count} registros no banco.`);

  const { data: sample } = await supabase
    .from('clients')
    .select('name, phone, status, feedback_first_contact, feedback_second_contact')
    .limit(20);

  console.log('\n📋 Amostragem dos primeiros 20 registros inseridos:');
  console.table(sample);
}

runImport();
