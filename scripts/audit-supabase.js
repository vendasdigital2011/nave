const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🛡️  AUDITORIA DE SEGURANÇA ANTI-VPS SUPABASE (CI/BUILD)');
console.log('====================================================\n');

// 1. Carregar variáveis de .env.local se existirem localmente
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      if (k && v.length && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  });
}

// 2. Validar NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log('🔍 Validando NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || '(não definida no processo)');

if (supabaseUrl) {
  if (
    supabaseUrl.includes('8443') ||
    supabaseUrl.includes('vps10855') ||
    supabaseUrl.includes('icontainer.net') ||
    supabaseUrl.includes('supabase.vps10855.panel.icontainer.net')
  ) {
    console.error('\n❌ ERRO CRÍTICO: NEXT_PUBLIC_SUPABASE_URL aponta para a VPS antiga ou porta 8443!');
    console.error('URL PROIBIDA:', supabaseUrl);
    process.exit(1);
  }

  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
    console.error('\n❌ ERRO CRÍTICO: NEXT_PUBLIC_SUPABASE_URL precisa ser HTTPS oficial do Supabase Cloud (supabase.co)!');
    console.error('URL RECEBIDA:', supabaseUrl);
    process.exit(1);
  }
}

// 3. Varrer arquivos em src/ em busca de resquícios da VPS
console.log('🔍 Varrendo src/ para garantir ausência de 8443 e supabase.vps...');
const forbiddenPatterns = [
  { pattern: /8443/, name: 'Porta 8443' },
  { pattern: /supabase\.vps10855/, name: 'supabase.vps10855' },
  { pattern: /supabase\.vps/, name: 'supabase.vps' },
  { pattern: /https:\/\/supabase\./, name: 'https://supabase. (não cloud)' },
];

function scanDirectory(dir, violations = []) {
  if (!fs.existsSync(dir)) return violations;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, violations);
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      forbiddenPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(content)) {
          violations.push({ file: fullPath, violation: name });
        }
      });
    }
  }
  return violations;
}

const violations = scanDirectory(path.join(process.cwd(), 'src'));

if (violations.length > 0) {
  console.error('\n❌ ERRO CRÍTICO: Padrões proibidos da VPS encontrados no código fonte:');
  violations.forEach((v) => {
    console.error(` - [${v.violation}] no arquivo: ${v.file}`);
  });
  process.exit(1);
}

console.log('\n✅ AUDITORIA CONCLUÍDA COM SUCESSO: 0 referências à VPS Supabase encontradas!');
console.log('✅ O build prosseguirá utilizando EXCLUSIVAMENTE o Supabase Cloud oficial.\n');
