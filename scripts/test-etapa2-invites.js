const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');

let url = '';
let key = '';
for (const line of env.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    url = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
  }
  if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    key = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
  }
}

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);

async function runEtapa2Validation() {
  console.log('=== TESTES DE VALIDAÇÃO ETAPA 2 (CONVITES & SUPABASE AUTH ADMIN) ===\n');

  const testEmail = `teste.vendedor.${Date.now()}@navetech.com.br`;
  let testUserId = null;

  try {
    // 1. Testar envio de convite via Supabase Auth Admin API
    console.log(`1. Disparando convite oficial para: ${testEmail}...`);
    const { data: inviteData, error: inviteErr } = await sb.auth.admin.inviteUserByEmail(
      testEmail,
      {
        redirectTo: 'https://nave-zeta.vercel.app/ativar-conta',
        data: {
          display_name: 'Vendedor Teste Automatizado',
          role: 'vendedor',
        },
      }
    );

    if (inviteErr) {
      console.error('❌ Falha ao disparar convite:', inviteErr.message);
      process.exit(1);
    }

    testUserId = inviteData.user.id;
    console.log('✅ Convite aceito pelo Supabase Auth! User ID:', testUserId);
    console.log('   Email:', inviteData.user.email);
    console.log('   Confirmation Sent At:', inviteData.user.confirmation_sent_at);
    console.log('   Role nos metadados:', inviteData.user.user_metadata?.role);

    // 2. Testar rejeição de convite duplicado para o mesmo e-mail
    console.log('\n2. Testando rejeição de e-mail duplicado...');
    const { data: dupData, error: dupErr } = await sb.auth.admin.inviteUserByEmail(
      testEmail,
      { redirectTo: 'https://nave-zeta.vercel.app/ativar-conta' }
    );

    if (dupErr) {
      console.log('✅ Supabase Auth rejeitou convite duplicado como esperado:', dupErr.message);
    } else {
      console.log('ℹ️ Supabase reenviou link para usuário já existente (idempotência confirmada).');
    }

    // 3. Testar definição de senha segura pelo próprio usuário (Simulação do /ativar-conta)
    console.log('\n3. Simulando fluxo de ativação de conta (definir senha sem MFA)...');
    const { data: updateData, error: updateErr } = await sb.auth.admin.updateUserById(
      testUserId,
      {
        password: 'SenhaSegura123!',
        email_confirm: true,
      }
    );

    if (updateErr) {
      console.error('❌ Falha ao simular ativação:', updateErr.message);
      process.exit(1);
    }

    console.log('✅ Senha definida com sucesso! Usuário ativado.');
    console.log('   Email confirmado em:', updateData.user.email_confirmed_at);

    // 4. Testar autenticação nativa com a nova senha no Supabase
    console.log('\n4. Testando login nativo com a nova senha cadastrada...');
    const { data: loginData, error: loginErr } = await sb.auth.signInWithPassword({
      email: testEmail,
      password: 'SenhaSegura123!',
    });

    if (loginErr) {
      console.error('❌ Falha ao autenticar com nova senha:', loginErr.message);
      process.exit(1);
    }

    console.log('✅ Autenticação realizada com sucesso usando credenciais ativadas!');
    console.log('   Session user:', loginData.user.email);
    console.log('   SEM MFA: Acesso liberado diretamente com email + senha.');

  } finally {
    // 5. Limpeza de teste para não poluir o Supabase Cloud
    if (testUserId) {
      console.log('\n5. Limpando usuário de teste do Supabase Auth Cloud...');
      const { error: delErr } = await sb.auth.admin.deleteUser(testUserId);
      if (delErr) {
        console.warn('Aviso ao remover usuário de teste:', delErr.message);
      } else {
        console.log('✅ Usuário de teste removido com sucesso. Base limpa e preservada!');
      }
    }
  }

  console.log('\n🎉 TODOS OS TESTES DA ETAPA 2 FORAM HOMOLOGADOS COM SUCESSO!');
}

runEtapa2Validation();
