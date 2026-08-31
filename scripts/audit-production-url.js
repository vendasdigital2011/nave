const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        return get(nextUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data, finalUrl: url }));
    }).on('error', reject);
  });
}

async function auditDeployment(host) {
  console.log('====================================================');
  console.log(`🌐 AUDITANDO DEPLOYMENT: ${host}`);
  console.log('====================================================');

  try {
    const home = await get(host);
    console.log(`Status HTTP: ${home.status}`);

    const buildIdMatch = home.data.match(/"buildId":"([^"]+)"/);
    console.log(`BUILD_ID publicado: ${buildIdMatch ? buildIdMatch[1] : 'Não encontrado no HTML'}`);

    const chunkMatches = home.data.match(/\/_next\/static\/chunks\/[^"'\s>]+/g) || [];
    const uniqueChunks = Array.from(new Set(chunkMatches));
    console.log(`Total de chunks únicos referenciados: ${uniqueChunks.length}`);

    for (const chunkPath of uniqueChunks) {
      const chunkUrl = host + chunkPath;
      const res = await get(chunkUrl);
      const hasCehrt = res.data.includes('cehrtqnvxeugjqkzfnvz.supabase.co');
      const hasOldCloud = res.data.includes('srpanthkbljrcguwdofz');
      const hasVps = res.data.includes('supabase.vps10855.panel.icontainer.net') || res.data.includes('supabase.vps');
      const has8443 = res.data.includes('8443');

      console.log(`\n📦 Chunk: ${chunkPath}`);
      console.log(`   - cehrtqnvxeugjqkzfnvz.supabase.co (Novo Oficial): ${hasCehrt ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   - srpanthkbljrcguwdofz (Cloud Anterior): ${hasOldCloud ? '⚠️ SIM' : '❌ NÃO'}`);
      console.log(`   - supabase.vps10855... (VPS Antiga): ${hasVps ? '🚨 SIM' : '✅ NÃO (0 ocorrências)'}`);
      console.log(`   - Porta 8443: ${has8443 ? '🚨 SIM' : '✅ NÃO (0 ocorrências)'}`);

      if (hasCehrt || hasOldCloud || hasVps) {
        const matches = res.data.match(/(https:\/\/[^"'\s\)]+)/g) || [];
        const relevantUrls = matches.filter(u => u.includes('supabase') || u.includes('8443'));
        console.log(`   - URLs detectadas:`, Array.from(new Set(relevantUrls)));
      }
    }
  } catch (err) {
    console.error(`❌ Erro ao auditar ${host}:`, err.message);
  }
}

async function runAll() {
  const hosts = [
    'https://nave-zeta.vercel.app',
    'https://nave-1ex53xw5f-vendasdigital2011-5220s-projects.vercel.app',
    'https://rmprospeccao-6nt5vmpt0-vendasdigital2011-5220s-projects.vercel.app'
  ];
  for (const h of hosts) {
    await auditDeployment(h);
  }
}

runAll();
